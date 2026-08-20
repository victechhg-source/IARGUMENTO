import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ENEM_PROMPT_C1, ENEM_PROMPT_C23, ENEM_PROMPT_C45 } from './enemSystemPrompts.ts';
import { UFG_PROMPT_MOD, UFG_PROMPT_TEMA, UFG_PROMPT_GENERO_COESAO } from './ufgSystemPrompts.ts';
import { FUVEST_PROMPT_NP, FUVEST_PROMPT_GEN_COE, FUVEST_PROMPT_TEMA } from './fuvestSystemPrompts.ts';

// Anotação DETERMINÍSTICA: injeta marcadores por competência diretamente na
// transcrição original (preservando paragrafação e texto exatos) com base nos
// excerpts de cada finding — TODOS (erros, motivos de atenção e acertos).
// Casamento por tokens: tolera diferenças de pontuação, aspas, acentos e caixa.
function buildAnnotatedText(transcription: string, stages: any[]): string {
  if (!transcription) return '';
  const normToken = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const transTokens = [...transcription.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => ({
    start: m.index as number,
    end: (m.index as number) + m[0].length,
    norm: normToken(m[0])
  }));
  const used: Array<[number, number]> = [];
  const findOccurrence = (excerpt: string): { start: number; end: number } | null => {
    const exTokens = [...excerpt.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => normToken(m[0]));
    if (!exTokens.length) return null;
    for (let i = 0; i + exTokens.length <= transTokens.length; i++) {
      let ok = true;
      for (let j = 0; j < exTokens.length; j++) {
        if (transTokens[i + j].norm !== exTokens[j]) { ok = false; break; }
      }
      if (!ok) continue;
      const start = transTokens[i].start;
      const end = transTokens[i + exTokens.length - 1].end;
      const overlap = used.some(([s, e]) => start < e && end > s);
      if (!overlap) { used.push([start, end]); return { start, end }; }
    }
    return null;
  };
  const matches: Array<{ start: number; end: number; comp: number; id: string }> = [];
  stages.forEach((stg, i) => {
    const comp = i + 1;
    (stg?.findings || []).forEach((f, fi) => {
      const occ = findOccurrence(String(f?.excerpt || ''));
      if (!occ) return;
      matches.push({ start: occ.start, end: occ.end, comp, id: f.id || `c${comp}-${fi + 1}` });
    });
  });
  matches.sort((a, b) => a.start - b.start);
  let out = '';
  let last = 0;
  for (const m of matches) {
    if (m.start < last) continue;
    out += transcription.slice(last, m.start);
    out += `[[C${m.comp}#${m.id}:${transcription.slice(m.start, m.end)}]]`;
    last = m.end;
  }
  out += transcription.slice(last);
  return out || transcription;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });

    const { banca, essayId, prompt, responseJsonSchema, stages = [], debug = false } = await req.json();
    const essay = await base44.asServiceRole.entities.Essay.get(essayId);
    if (!essay || essay.created_by_id !== user.id) return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });

    const agents = await base44.asServiceRole.entities.CorrectionAgent.filter({ banca, active: true, status: 'ready' });
    const agent = agents[0] || null;
    const resources = agent ? await base44.asServiceRole.entities.AgentTrainingResource.filter({ agent_id: agent.id }) : [];
    const context = resources.filter((resource) => resource.content).map((resource) => `### ${resource.title}\n${resource.content}`).join('\n\n');
    const basePrompt = `${agent?.system_prompt || ''}\n\n${context}\n\n${prompt}`.trim();
    const fileUrls = resources.filter((resource) => resource.file_url).map((resource) => resource.file_url);
    const model = agent?.model || 'automatic';

    if (banca !== 'ENEM' && banca !== 'UFG' && banca !== 'FUVEST') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: basePrompt,
        response_json_schema: responseJsonSchema,
        model,
        ...(fileUrls.length ? { file_urls: fileUrls } : {})
      });
      const inputTokens = Math.ceil(basePrompt.length / 4);
      const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
      await base44.asServiceRole.entities.AgentUsage.create({ agent_id: agent?.id || '', agent_name: agent?.name || `Padrão ${banca}`, model, banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [], input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens });
      return Response.json({ result, usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens } });
    }

    // ─── Arquitetura FUVEST (USP) ───
    // Três especialistas rodam em paralelo:
    //   1. Norma Padrão (0-10) — reproduz a transcrição com marcadores [[NP:trecho]]
    //   2. Gênero Textual (0-10) + Coesão e Coerência (0-15) — marcadores [[GEN:trecho]] / [[COE:trecho]]
    //   3. Tema e Coletânea (0-15) — marcadores [[TEMA:trecho]]
    // Total máximo: 50 pontos. Corretores 2 e 3 são 15% mais rígidos (sem benefício da dúvida).
    if (banca === 'FUVEST') {
      const fuvestTranscription = essay.transcription || '';
      const fuvestSpecialistPrompts = [FUVEST_PROMPT_NP, FUVEST_PROMPT_GEN_COE, FUVEST_PROMPT_TEMA];
      const fuvestContextBlock = context ? `### Base de referência (Grade de Correção FUVEST — Escola Argumento)\n${context}\n\n` : '';

      const runFuvestSpecialist = async (sysPrompt: string) => {
        const fullPrompt = `${sysPrompt}\n\n${fuvestContextBlock}REDAÇÃO DO ALUNO:\n"""\n${fuvestTranscription}\n"""`;
        const output = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: fullPrompt,
          model,
          ...(fileUrls.length ? { file_urls: fileUrls } : {})
        });
        return String(output || '');
      };

      const [npText, genCoeText, temaText] = await Promise.all(fuvestSpecialistPrompts.map(runFuvestSpecialist));
      console.log('[runCorrectionAgent][FUVEST] Especialista Norma Padrão:', npText.slice(0, 300));
      console.log('[runCorrectionAgent][FUVEST] Especialista Gênero+Coesão:', genCoeText.slice(0, 300));
      console.log('[runCorrectionAgent][FUVEST] Especialista Tema:', temaText.slice(0, 300));

      const fuvestExtractNote = (text: string, key: string, max: number, validValues?: number[]) => {
        const clamp = (v: number) => Math.max(0, Math.min(max, Number(v) || 0));
        const m1 = text.match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
        if (m1) {
          const v = clamp(Number(m1[1]));
          if (validValues) return validValues.includes(v) ? v : validValues.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
          return v;
        }
        const m2 = text.match(new RegExp(`${key}\\s*:\\s*(\\d+)`, 'i'));
        if (m2) {
          const v = clamp(Number(m2[1]));
          if (validValues) return validValues.includes(v) ? v : validValues.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
          return v;
        }
        return 0;
      };

      // Escalas FUVEST: NP e Gênero em 0,2,4,6,8,10; Coesão e Tema em 0,3,6,9,12,15
      const npValid = [0, 2, 4, 6, 8, 10];
      const genValid = [0, 2, 4, 6, 8, 10];
      const coeValid = [0, 3, 6, 9, 12, 15];
      const temaValid = [0, 3, 6, 9, 12, 15];

      const notaNP = fuvestExtractNote(npText, 'NOTA_FINAL_NP', 10, npValid);
      const notaGEN = fuvestExtractNote(genCoeText, 'NOTA_FINAL_GENERO', 10, genValid);
      const notaCOE = fuvestExtractNote(genCoeText, 'NOTA_FINAL_COESAO', 15, coeValid);
      const notaTEMA = fuvestExtractNote(temaText, 'NOTA_FINAL_TEMA', 15, temaValid);
      const fuvestTotal = notaNP + notaGEN + notaCOE + notaTEMA;
      console.log('[runCorrectionAgent][FUVEST] Notas extraídas:', { notaNP, notaGEN, notaCOE, notaTEMA, total: fuvestTotal });

      // Estágios FUVEST: 4 critérios
      // Ordem: Norma Padrão (C1/vermelho), Gênero Textual (C2/azul), Coesão e Coerência (C3/violeta), Tema e Coletânea (C4/âmbar)
      const fuvestStageNames = [
        'Norma Padrão',
        'Gênero Textual e Projeto de Texto',
        'Coesão e Coerência',
        'Tema e Coletânea'
      ];
      const fuvestMaxScores = [10, 10, 15, 15];
      const fuvestNotes = [notaNP, notaGEN, notaCOE, notaTEMA];

      const fuvestSynthesisSchema = {
        type: 'object',
        properties: {
          annotated_text: { type: 'string' },
          memorable_strengths: { type: 'array', items: { type: 'string' } },
          stages: { type: 'array', items: { type: 'object', properties: {
            stage: { type: 'string' },
            score: { type: 'number' },
            max_score: { type: 'number' },
            summary: { type: 'string' },
            findings: { type: 'array', items: { type: 'object', properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              excerpt: { type: 'string' },
              explanation: { type: 'string' },
              suggestion: { type: 'string' },
              video_suggestion: { type: 'string' }
            } } }
          }, required: ['stage', 'summary', 'findings'] } },
          writing_suggestions: { type: 'array', items: { type: 'string' } },
          study_suggestions: { type: 'array', items: { type: 'string' } }
        },
        required: ['annotated_text', 'memorable_strengths', 'stages', 'writing_suggestions', 'study_suggestions']
      };

      const fuvestSynthesisPrompt = `Você é o ORQUESTRADOR da devolutiva final da redação FUVEST. Três corretores avaliaram a redação em paralelo:
- Corretor 1 — Norma Padrão (ortografia, gramática, sintaxe e convenção da escrita) — produziu a transcrição completa com erros marcados
- Corretor 2 — Gênero Textual e Projeto de Texto + Coesão e Coerência
- Corretor 3 — Tema e Coletânea (conteúdo, repertório, indícios de autoria)

RELATÓRIOS DOS CORRETORES:
--- Norma Padrão ---
${npText}
--- Gênero + Coesão ---
${genCoeText}
--- Tema e Coletânea ---
${temaText}
---

REDAÇÃO DO ALUNO:
"""
${fuvestTranscription}
"""

NOTAS POR EIXO (extraídas deterministicamente dos marcadores NOTA_FINAL_* de cada corretor):
- Norma Padrão = ${notaNP}/10 (escala: 0,2,4,6,8,10)
- Gênero Textual = ${notaGEN}/10 (escala: 0,2,4,6,8,10)
- Coesão e Coerência = ${notaCOE}/15 (escala: 0,3,6,9,12,15)
- Tema e Coletânea = ${notaTEMA}/15 (escala: 0,3,6,9,12,15)
- Total = ${fuvestTotal}/50

Preencha "score" e "max_score" de cada stage EXATAMENTE com esses valores; não recalcule, não padronize.

Monte a devolutiva final no formato JSON. A correção deve ser MINUCIOSA: enumere TODOS os pontos relevantes de cada eixo (erros e acertos), com atenção especial aos ERROS — um finding por erro/acerto identificado, com explanation detalhada e didática e suggestion concreta.

1. "annotated_text": deixe como string VAZIA (""). A marcação do texto será gerada automaticamente a partir dos excerpts; NÃO reproduza nem marque o texto aqui. Garanta que CADA finding.excerpt seja uma CÓPIA EXATA (verbatim) de um trecho real da redação do aluno — mesma grafia, pontuação, acentos e erros; jamais corrija, parafraseie ou altere o trecho. PRESERVE a paragrafação e as quebras de linha exatamente como estão.

2. "stages": 4 entradas nesta ordem: "Norma Padrão", "Gênero Textual e Projeto de Texto", "Coesão e Coerência", "Tema e Coletânea". Para cada uma, preencha "score" (o valor indicado acima), "max_score" (respectivamente 10, 10, 15, 15), "summary" = síntese concisa e didática do parecer do corretor correspondente, e "findings" = lista minuciosa, CADA UMA com "id" (shortcode único, ex.: "f1"), "type" ("correct"/"warning"/"error"), "excerpt" (trecho exato verbatim), "explanation" detalhada e didática, "suggestion" concreta e "video_suggestion" (termo curto de busca no YouTube).
   - Stage 1 (Norma Padrão): baseie-se no relatório do Corretor 1.
   - Stage 2 (Gênero Textual): baseie-se na parte Gênero/Projeto do Corretor 2.
   - Stage 3 (Coesão e Coerência): baseie-se na parte Coesão/Coerência do Corretor 2.
   - Stage 4 (Tema e Coletânea): baseie-se no relatório do Corretor 3.

3. "memorable_strengths": até 3 acertos memoráveis.
4. "writing_suggestions": 3 a 5 sugestões práticas de escrita.
5. "study_suggestions": 3 a 5 sugestões de estudo focadas nas fraquezas.
Retorne apenas o JSON.`;

      const fuvestSynth = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: fuvestSynthesisPrompt,
        response_json_schema: fuvestSynthesisSchema,
        model,
        ...(fileUrls.length ? { file_urls: fileUrls } : {})
      });

      const fuvestFinalStages = fuvestStageNames.map((name, i) => {
        const ss = Array.isArray(fuvestSynth?.stages) ? fuvestSynth.stages[i] : null;
        const synthScore = typeof ss?.score === 'number' ? ss.score : null;
        const score = synthScore !== null ? Math.max(0, Math.min(fuvestMaxScores[i], synthScore)) : fuvestNotes[i];
        const findings = (ss?.findings || []).map((f, fi) => ({ ...f, id: f?.id || `c${i + 1}-${fi + 1}` }));
        return { stage: ss?.stage || name, score, max_score: fuvestMaxScores[i], summary: ss?.summary || '', findings };
      });
      const fuvestComputedTotal = fuvestFinalStages.reduce((s, st) => s + st.score, 0);
      console.log('[runCorrectionAgent][FUVEST] Notas finais:', fuvestFinalStages.map((s) => s.score), 'total', fuvestComputedTotal);

      const fuvestResult = {
        annotated_text: buildAnnotatedText(fuvestTranscription, fuvestFinalStages) || fuvestSynth?.annotated_text || '',
        memorable_strengths: fuvestSynth?.memorable_strengths || [],
        stages: fuvestFinalStages,
        writing_suggestions: fuvestSynth?.writing_suggestions || [],
        study_suggestions: fuvestSynth?.study_suggestions || [],
        final_grade: fuvestComputedTotal,
        max_grade: 50
      };

      const fuvestInputTokens = Math.ceil((npText.length + genCoeText.length + temaText.length + fuvestSynthesisPrompt.length + basePrompt.length) / 4);
      const fuvestOutputTokens = Math.ceil(JSON.stringify(fuvestResult).length / 4);
      await base44.asServiceRole.entities.AgentUsage.create({ agent_id: agent?.id || '', agent_name: agent?.name || 'Padrão FUVEST', model, banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [], input_tokens: fuvestInputTokens, output_tokens: fuvestOutputTokens, total_tokens: fuvestInputTokens + fuvestOutputTokens });
      return Response.json({ result: fuvestResult, usage: { input_tokens: fuvestInputTokens, output_tokens: fuvestOutputTokens, total_tokens: fuvestInputTokens + fuvestOutputTokens }, ...(debug ? { _debug: { specialists: { np: npText, genCoe: genCoeText, tema: temaText }, extractedNotes: { notaNP, notaGEN, notaCOE, notaTEMA, total: fuvestTotal }, synthesis: fuvestSynth } } : {}) });
    }

    // ─── Arquitetura UFG (Vestibular 2026) ───
    // Três corretores especialistas rodam em paralelo (Modalidade Escrita,
    // Tema, Gênero Textual + Coesão/Coerência), cada um com seu system prompt.
    // As notas são extraídas deterministicamente dos marcadores NOTA_FINAL_*;
    // uma chamada final de síntese adapta os relatórios ao formato estruturado.
    if (banca === 'UFG') {
      const ufgTranscription = essay.transcription || '';
      const ufgSpecialistPrompts = [UFG_PROMPT_MOD, UFG_PROMPT_TEMA, UFG_PROMPT_GENERO_COESAO];
      const ufgContextBlock = context ? `### Base de referência (Orientações Gerais — Prova de Redação Vestibular UFG 2026)\n${context}\n\n` : '';
      const runUfgSpecialist = async (sysPrompt: string) => {
        const fullPrompt = `${sysPrompt}\n\n${ufgContextBlock}REDAÇÃO DO ALUNO:\n"""\n${ufgTranscription}\n"""`;
        const output = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: fullPrompt,
          model,
          ...(fileUrls.length ? { file_urls: fileUrls } : {})
        });
        return String(output || '');
      };
      const [modText, temaText, generoCoesaoText] = await Promise.all(ufgSpecialistPrompts.map(runUfgSpecialist));
      console.log('[runCorrectionAgent][UFG] Especialista Modalidade Escrita:', modText);
      console.log('[runCorrectionAgent][UFG] Especialista Tema:', temaText);
      console.log('[runCorrectionAgent][UFG] Especialista Gênero+Coesão:', generoCoesaoText);

      const ufgExtractNote = (text: string, key: string, max: number) => {
        const clamp = (v: number) => Math.max(0, Math.min(max, Number(v) || 0));
        const m1 = text.match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
        if (m1) return clamp(Number(m1[1]));
        const m2 = text.match(new RegExp(`${key}\\s*:\\s*(\\d+)`, 'i'));
        if (m2) return clamp(Number(m2[1]));
        return 0;
      };
      const notaME = ufgExtractNote(modText, 'NOTA_FINAL_MODESCRITA', 5);
      const notaTEMA = ufgExtractNote(temaText, 'NOTA_FINAL_TEMA', 9);
      const notaGENERO = ufgExtractNote(generoCoesaoText, 'NOTA_FINAL_GENERO', 5);
      const notaCOESAO = ufgExtractNote(generoCoesaoText, 'NOTA_FINAL_COESAO', 5);
      const ufgTotal = notaME + notaTEMA + notaGENERO + notaCOESAO;
      const eliminado = ufgTotal < 10;
      console.log('[runCorrectionAgent][UFG] Notas extraídas:', { notaME, notaTEMA, notaGENERO, notaCOESAO, total: ufgTotal, eliminado });

      const ufgStageNames = ['Adequação ao tema', 'Adequação ao gênero textual', 'Adequação à modalidade escrita', 'Coesão e coerência'];
      const ufgMaxScores = [9, 5, 5, 5];
      const ufgNotes = [notaTEMA, notaGENERO, notaME, notaCOESAO];
      const ufgSpecialists = { mod: modText, tema: temaText, generoCoesao: generoCoesaoText };
      const ufgStageListStr = ufgStageNames.map((n) => `"${n}"`).join(', ');
      const ufgMaxListStr = ufgMaxScores.join(', ');
      const ufgElimAviso = eliminado ? ` Inclua por último em study_suggestions um aviso claro de que a nota total (${ufgTotal}/24) está abaixo do corte eliminatório de 10 pontos, e o candidato seria eliminado do processo seletivo.` : '';

      const ufgSynthesisSchema = {
        type: 'object',
        properties: {
          annotated_text: { type: 'string' },
          memorable_strengths: { type: 'array', items: { type: 'string' } },
          stages: { type: 'array', items: { type: 'object', properties: {
            stage: { type: 'string' },
            score: { type: 'number' },
            max_score: { type: 'number' },
            summary: { type: 'string' },
            findings: { type: 'array', items: { type: 'object', properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              excerpt: { type: 'string' },
              explanation: { type: 'string' },
              suggestion: { type: 'string' },
              video_suggestion: { type: 'string' }
            } } }
          }, required: ['stage', 'summary', 'findings'] } },
          writing_suggestions: { type: 'array', items: { type: 'string' } },
          study_suggestions: { type: 'array', items: { type: 'string' } }
        },
        required: ['annotated_text', 'memorable_strengths', 'stages', 'writing_suggestions', 'study_suggestions']
      };

      const ufgSynthesisPrompt = `Você é o ORQUESTRADOR da devolutiva final da redação do Vestibular UFG 2026. Três corretores avaliaram a redação em paralelo:
- Corretor 1 — Modalidade Escrita (norma-padrão, estrutura sintática e registro)
- Corretor 2 — Tema (tema, coletânea e repertório sociocultural)
- Corretor 3 — Gênero Textual e Coesão/Coerência

RELATÓRIOS DOS CORRETORES:
--- Modalidade Escrita ---
${modText}
--- Tema ---
${temaText}
--- Gênero + Coesão ---
${generoCoesaoText}
---

REDAÇÃO DO ALUNO:
"""
${ufgTranscription}
"""

NOTAS POR CRITÉRIO (extraídas dos marcadores NOTA_FINAL_* declarados por cada corretor): Modalidade Escrita = ${notaME}/5, Tema = ${notaTEMA}/9, Gênero Textual = ${notaGENERO}/5, Coesão/Coerência = ${notaCOESAO}/5 — Total = ${ufgTotal}/24${eliminado ? ' (ABAIXO do corte eliminatório de 10 pontos — candidato eliminado)' : ''}. Preencha "score" e "max_score" de cada stage EXATAMENTE com esses valores; não recalcule, não padronize.

Monte a devolutiva final no formato JSON. A correção deve ser MINUCIOSA: enumere TODOS os pontos relevantes de cada critério (erros e acertos), com atenção especial aos ERROS — um finding por erro/acerto identificado, com explanation detalhada e didática e suggestion concreta.

1. "annotated_text": deixe como string VAZIA (""). A marcação do texto será gerada automaticamente a partir dos excerpts; NÃO reproduza nem marque o texto aqui. Garanta que CADA finding.excerpt seja uma CÓPIA EXATA (verbatim) de um trecho real da redação do aluno — mesma grafia, pontuação, acentos e erros; jamais corrija, parafraseie ou altere o trecho. PRESERVE a paragrafação e as quebras de linha exatamente como estão.
2. "stages": 4 entradas nesta ordem: ${ufgStageListStr}. Para cada uma, preencha "score" (o valor indicado acima), "max_score" (respectivamente ${ufgMaxListStr}), "summary" = síntese concisa e didática do parecer do corretor correspondente, e "findings" = lista minuciosa, CADA UMA com "id" (shortcode único, ex.: "f1"), "type" ("correct"/"warning"/"error"), "excerpt" (trecho exato), "explanation" detalhada e didática, "suggestion" concreta e "video_suggestion" (termo curto de busca no YouTube).
   - Stage 1 (Adequação ao tema): baseie-se no relatório do Corretor 2 (Tema).
   - Stage 2 (Adequação ao gênero textual): baseie-se na parte Gênero Textual do Corretor 3.
   - Stage 3 (Adequação à modalidade escrita): baseie-se no relatório do Corretor 1.
   - Stage 4 (Coesão e coerência): baseie-se na parte Coesão/Coerência do Corretor 3.
3. "memorable_strengths": até 3 acertos memoráveis.
4. "writing_suggestions": 3 a 5 sugestões práticas de escrita.
5. "study_suggestions": 3 a 5 sugestões de estudo focadas nas fraquezas.${ufgElimAviso}
Retorne apenas o JSON.`;

      const ufgSynth = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: ufgSynthesisPrompt,
        response_json_schema: ufgSynthesisSchema,
        model,
        ...(fileUrls.length ? { file_urls: fileUrls } : {})
      });

      const ufgFinalStages = ufgStageNames.map((name, i) => {
        const ss = Array.isArray(ufgSynth?.stages) ? ufgSynth.stages[i] : null;
        const synthScore = typeof ss?.score === 'number' ? ss.score : null;
        const score = synthScore !== null ? Math.max(0, Math.min(ufgMaxScores[i], synthScore)) : ufgNotes[i];
        const findings = (ss?.findings || []).map((f, fi) => ({ ...f, id: f?.id || `c${i + 1}-${fi + 1}` }));
        return { stage: ss?.stage || name, score, max_score: ufgMaxScores[i], summary: ss?.summary || '', findings };
      });
      const ufgComputedTotal = ufgFinalStages.reduce((s, st) => s + st.score, 0);
      console.log('[runCorrectionAgent][UFG] Notas finais (synthesis + fallback marcador):', ufgFinalStages.map((s) => s.score), 'total', ufgComputedTotal);

      const ufgResult = {
        annotated_text: buildAnnotatedText(ufgTranscription, ufgFinalStages) || ufgSynth?.annotated_text || '',
        memorable_strengths: ufgSynth?.memorable_strengths || [],
        stages: ufgFinalStages,
        writing_suggestions: ufgSynth?.writing_suggestions || [],
        study_suggestions: ufgSynth?.study_suggestions || [],
        final_grade: ufgComputedTotal,
        max_grade: 24
      };

      const ufgInputTokens = Math.ceil((modText.length + temaText.length + generoCoesaoText.length + ufgSynthesisPrompt.length + basePrompt.length) / 4);
      const ufgOutputTokens = Math.ceil(JSON.stringify(ufgResult).length / 4);
      await base44.asServiceRole.entities.AgentUsage.create({ agent_id: agent?.id || '', agent_name: agent?.name || 'Padrão UFG', model, banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [], input_tokens: ufgInputTokens, output_tokens: ufgOutputTokens, total_tokens: ufgInputTokens + ufgOutputTokens });
      return Response.json({ result: ufgResult, usage: { input_tokens: ufgInputTokens, output_tokens: ufgOutputTokens, total_tokens: ufgInputTokens + ufgOutputTokens }, ...(debug ? { _debug: { specialists: ufgSpecialists, extractedNotes: { notaME, notaTEMA, notaGENERO, notaCOESAO, total: ufgTotal, eliminado }, synthesis: ufgSynth } } : {}) });
    }

    // ─── Arquitetura ENEM (Escola Argumento) ───
    // Três especialistas rodam em paralelo (C1, C2-3, C4-5), cada um com seu
    // system prompt específico, e finalizam com um marcador NOTA_FINAL_Cx=<nota>.
    // As notas são extraídas deterministicamente; uma chamada final de síntese
    // adapta os relatórios ao formato estruturado esperado pela interface.
    const transcription = essay.transcription || '';
    const specialistPrompts = [ENEM_PROMPT_C1, ENEM_PROMPT_C23, ENEM_PROMPT_C45];

    const contextBlock = context ? `### Base de treinamento (Escola Argumento)\n${context}\n\n` : '';
    const runSpecialist = async (sysPrompt) => {
      const fullPrompt = `${sysPrompt}\n\n${contextBlock}REDAÇÃO DO ALUNO:\n"""\n${transcription}\n"""`;
      const output = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        model,
        ...(fileUrls.length ? { file_urls: fileUrls } : {})
      });
      return String(output || '');
    };

    const [c1Text, c23Text, c45Text] = await Promise.all(specialistPrompts.map(runSpecialist));
    console.log('[runCorrectionAgent][ENEM] Especialista C1:', c1Text);
    console.log('[runCorrectionAgent][ENEM] Especialista C2-3:', c23Text);
    console.log('[runCorrectionAgent][ENEM] Especialista C4-5:', c45Text);

    const extractNote = (text, key) => {
      const clamp = (v) => Math.max(0, Math.min(200, Number(v) || 0));
      const m1 = text.match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
      if (m1) return clamp(m1[1]);
      const m2 = text.match(new RegExp(`${key}\\s*:\\s*(\\d+)`, 'i'));
      if (m2) return clamp(m2[1]);
      const comp = key.match(/C(\d)$/);
      if (comp) {
        const n = comp[1];
        const m3 = text.match(new RegExp(`Compet[^\\d]{0,20}${n}[^\\d]{0,6}(\\d{1,3})\\s*/\\s*200`, 'i'));
        if (m3) return clamp(m3[1]);
      }
      return 0;
    };
    const notaC1 = extractNote(c1Text, 'NOTA_FINAL_C1');
    const notaC2 = extractNote(c23Text, 'NOTA_FINAL_C2');
    const notaC3 = extractNote(c23Text, 'NOTA_FINAL_C3');
    const notaC4 = extractNote(c45Text, 'NOTA_FINAL_C4');
    const notaC5 = extractNote(c45Text, 'NOTA_FINAL_C5');
    const total = notaC1 + notaC2 + notaC3 + notaC4 + notaC5;
    const notes = [notaC1, notaC2, notaC3, notaC4, notaC5];
    console.log('[runCorrectionAgent][ENEM] Notas extraídas dos marcadores NOTA_FINAL_Cx:', { notaC1, notaC2, notaC3, notaC4, notaC5, total });

    const stageNames = [
      'Competência I — Norma-padrão',
      'Competência II — Tema e repertório',
      'Competência III — Argumentação',
      'Competência IV — Coesão',
      'Competência V — Intervenção'
    ];

    const synthesisSchema = {
      type: 'object',
      properties: {
        annotated_text: { type: 'string' },
        memorable_strengths: { type: 'array', items: { type: 'string' } },
        stages: { type: 'array', items: { type: 'object', properties: {
          stage: { type: 'string' },
          score: { type: 'number' },
          max_score: { type: 'number' },
          summary: { type: 'string' },
          findings: { type: 'array', items: { type: 'object', properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          excerpt: { type: 'string' },
            explanation: { type: 'string' },
            suggestion: { type: 'string' },
            video_suggestion: { type: 'string' }
          } } }
        }, required: ['stage', 'summary', 'findings'] } },
        writing_suggestions: { type: 'array', items: { type: 'string' } },
        study_suggestions: { type: 'array', items: { type: 'string' } }
      },
      required: ['annotated_text', 'memorable_strengths', 'stages', 'writing_suggestions', 'study_suggestions']
    };

    const synthesisPrompt = `Você é o ORQUESTRADOR da devolutiva final do ENEM (Escola Argumento). Três especialistas avaliaram a redação em paralelo:
- Especialista C1 (Norma-padrão e estrutura sintática)
- Especialista C2-3 (Tema, repertório, projeto de texto e argumentação)
- Especialista C4-5 (Coesão e proposta de intervenção)

RELATÓRIOS DOS ESPECIALISTAS:
--- C1 ---
${c1Text}
--- C2-3 ---
${c23Text}
--- C4-5 ---
${c45Text}
---

REDAÇÃO DO ALUNO:
"""
${transcription}
"""

NOTAS POR COMPETÊNCIA: cada especialista já declarou a nota de cada competência no próprio relatório (linhas "Nota Competência X: Y/200" e marcador final "NOTA_FINAL_Cx=Y"). LEIA essas notas diretamente dos relatórios e preencha "score" (0-200) e "max_score" (200) de cada stage. As notas precisam ser FIELS ao que cada especialista concluiu e VARIADAS por competência — NÃO padronize, NÃO use 120 (ou qualquer outro valor) como valor padrão, NÃO recalcule por conta própria. Se um relatório não trouxer a nota de uma competência, use 0.

Monte a devolutiva final no formato JSON solicitado. A correção deve ser MINUCIOSA: enumere TODOS os pontos relevantes de cada competência (erros e acertos), com atenção especial aos ERROS — um finding por erro/acerto identificado, com explanation detalhada e didática e suggestion concreta. Não resuma em poucos itens; quanto mais pontos específicos mapeados no texto, melhor.

1. "annotated_text": deixe como string VAZIA (""). A marcação do texto será gerada automaticamente a partir dos excerpts; NÃO reproduza nem marque o texto aqui. Em vez disso, garanta que CADA finding.excerpt seja uma CÓPIA EXATA (verbatim) de um trecho real da redação do aluno — mesma grafia, pontuação, acentos e erros; jamais corrija, parafraseie ou altere o texto do excerpt. PRESERVE a paragrafação e as quebras de linha exatamente como estão após o aval do OCR — o texto integral (palavras e parágrafos) permanece INALTERADO em todo lugar.
2. "stages": 5 entradas nesta ordem: ${stageNames.map((name) => `"${name}"`).join(', ')}. Para cada uma, preencha "score" (0-200, LIDO do relatório do especialista correspondente — nunca padronize nem use sempre 120), "max_score" 200, "summary" = síntese concisa e didática do parecer do especialista correspondente, e "findings" = lista minuciosa de observações, CADA UMA com "id" (shortcode único, ex.: "f1" — o MESMO id usado no marcador do annotated_text), "type" ("correct"/"warning"/"error"), "excerpt" (o trecho exato, idêntico ao do marcador), "explanation" detalhada e didática do erro/acerto, "suggestion" concreta de melhoria e "video_suggestion" (termo curto de busca no YouTube).
3. "memorable_strengths": até 3 acertos memoráveis.
4. "writing_suggestions": 3 a 5 sugestões práticas de escrita.
5. "study_suggestions": 3 a 5 sugestões de estudo focadas nas fraquezas.
Retorne apenas o JSON.`;

    const synth = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: synthesisPrompt,
      response_json_schema: synthesisSchema,
      model,
      ...(fileUrls.length ? { file_urls: fileUrls } : {})
    });

    const finalStages = stageNames.map((name, i) => {
      const ss = Array.isArray(synth.stages) ? synth.stages[i] : null;
      const synthScore = typeof ss?.score === 'number' ? ss.score : null;
      const score = synthScore !== null ? Math.max(0, Math.min(200, synthScore)) : notes[i];
      return {
        stage: ss?.stage || name,
        score,
        max_score: typeof ss?.max_score === 'number' ? ss.max_score : 200,
        summary: ss?.summary || '',
        findings: ss?.findings || []
      };
    });
    finalStages.forEach((s, si) => {
      (s.findings || []).forEach((f, fi) => {
        if (!f.id) f.id = `c${si + 1}-${fi + 1}`;
      });
    });
    const computedTotal = finalStages.reduce((sum, s) => sum + s.score, 0);
    const allEqual = finalStages.length > 0 && finalStages.every((s) => s.score === finalStages[0].score);
    if (allEqual) console.warn('[runCorrectionAgent][ENEM] Notas idênticas em todas as competências — verificar relatórios dos especialistas:', finalStages.map((s) => s.score));
    console.log('[runCorrectionAgent][ENEM] Notas finais (synthesis + fallback marcador):', finalStages.map((s) => s.score), 'total', computedTotal, 'marcadores', notes);

    const result = {
      annotated_text: buildAnnotatedText(transcription, finalStages) || synth.annotated_text || '',
      memorable_strengths: synth.memorable_strengths || [],
      stages: finalStages,
      writing_suggestions: synth.writing_suggestions || [],
      study_suggestions: synth.study_suggestions || [],
      final_grade: computedTotal,
      max_grade: 1000
    };

    const inputTokens = Math.ceil((c1Text.length + c23Text.length + c45Text.length + synthesisPrompt.length + basePrompt.length) / 4);
    const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
    await base44.asServiceRole.entities.AgentUsage.create({ agent_id: agent?.id || '', agent_name: agent?.name || 'Padrão ENEM', model, banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [], input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens });
    return Response.json({ result, usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens }, ...(debug ? { _debug: { specialists: { c1: c1Text, c23: c23Text, c45: c45Text }, extractedNotes: { c1: notaC1, c2: notaC2, c3: notaC3, c4: notaC4, c5: notaC5, total }, synthesis: synth } } : {}) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}