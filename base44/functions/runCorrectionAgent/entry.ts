import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ENEM_PROMPT_C1, ENEM_PROMPT_C23, ENEM_PROMPT_C45 } from './enemSystemPrompts.ts';

// Anotação DETERMINÍSTICA: injeta marcadores por competência diretamente na
// transcrição original (preservando paragrafação e texto exatos) com base nos
// excerpts de cada finding. Não depende do LLM reproduzir o texto.
function buildAnnotatedText(transcription: string, stages: any[]): string {
  if (!transcription) return '';
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"');
  const normTrans = normalize(transcription);
  const used: Array<[number, number]> = [];
  const findOccurrence = (needle: string): number => {
    const n = normalize(needle);
    if (!n) return -1;
    let from = 0;
    while (true) {
      const idx = normTrans.indexOf(n, from);
      if (idx < 0) return -1;
      const end = idx + n.length;
      const overlap = used.some(([s, e]) => idx < e && end > s);
      if (!overlap) { used.push([idx, end]); return idx; }
      from = idx + 1;
    }
  };
  const matches: Array<{ start: number; end: number; comp: number; id: string }> = [];
  stages.forEach((stg, i) => {
    const comp = i + 1;
    (stg?.findings || []).forEach((f, fi) => {
      const ex = String(f?.excerpt || '');
      if (ex.length < 2) return;
      const start = findOccurrence(ex);
      if (start < 0) return;
      matches.push({ start, end: start + ex.length, comp, id: f.id || `c${comp}-${fi + 1}` });
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

    if (banca !== 'ENEM' || stages.length !== 5) {
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