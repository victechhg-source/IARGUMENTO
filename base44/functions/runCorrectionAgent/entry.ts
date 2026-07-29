import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ENEM_PROMPT_C1, ENEM_PROMPT_C23, ENEM_PROMPT_C45 } from './enemSystemPrompts.ts';

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
      const match = text.match(new RegExp(`${key}\\s*=\\s*(\\d+)`, 'i'));
      return match ? Math.max(0, Math.min(200, Number(match[1]) || 0)) : 0;
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
          summary: { type: 'string' },
          findings: { type: 'array', items: { type: 'object', properties: {
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

NOTAS OFICIAIS ATRIBUÍDAS (use EXATAMENTE estes valores, não recalcule):
- Competência I: ${notaC1}/200
- Competência II: ${notaC2}/200
- Competência III: ${notaC3}/200
- Competência IV: ${notaC4}/200
- Competência V: ${notaC5}/200

Monte a devolutiva final no formato JSON solicitado:
1. "annotated_text": reproduza a redação integralmente PRESERVANDO EXATAMENTE os marcadores [[r:trecho]] que o Especialista C1 inseriu (grifo vermelho de norma-padrão). NÃO adicione novos [[r:]] — esse marcador é EXCLUSIVO do C1 e outros especialistas não o usam. Para os demais problemas use [[e:trecho]] (erros), [[w:trecho]] (avisos) e até 3 [[c:trecho]] (acertos memoráveis). Não use HTML nem negrito.
2. "stages": 5 entradas nesta ordem: ${stageNames.map((name, i) => `"${name}" (score ${notes[i]})`).join(', ')}. Para cada uma, "max_score" 200, "summary" = síntese concisa e didática do parecer do especialista correspondente, e "findings" = observações com type ("correct"/"warning"/"error"), excerpt, explanation, suggestion e video_suggestion (termo curto de busca no YouTube).
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
      return {
        stage: ss?.stage || name,
        score: notes[i],
        max_score: 200,
        summary: ss?.summary || '',
        findings: ss?.findings || []
      };
    });

    const result = {
      annotated_text: synth.annotated_text || '',
      memorable_strengths: synth.memorable_strengths || [],
      stages: finalStages,
      writing_suggestions: synth.writing_suggestions || [],
      study_suggestions: synth.study_suggestions || [],
      final_grade: total,
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