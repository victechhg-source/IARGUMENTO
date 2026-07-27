import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { banca, essayId, prompt, responseJsonSchema, stages = [] } = await req.json();
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

    const stageSchema = {
      type: 'object',
      properties: {
        score: { type: 'number' },
        summary: { type: 'string' },
        findings: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, excerpt: { type: 'string' }, explanation: { type: 'string' }, suggestion: { type: 'string' }, video_suggestion: { type: 'string' } } } }
      },
      required: ['score', 'summary', 'findings']
    };
    const stageResults = await Promise.all(stages.map(async (stage) => {
      const competencyPrompt = `${basePrompt}\n\nVocê avaliará SOMENTE a etapa "${stage.name}" (máximo ${stage.max_score} pontos). Não avalie ou pontue as demais competências. Atribua a nota exclusivamente pelas regras da base de treinamento. Identifique erros com sugestões amigáveis e, quando houver, acertos relevantes desta competência. Retorne apenas o JSON solicitado.`;
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: competencyPrompt,
        response_json_schema: stageSchema,
        model,
        ...(fileUrls.length ? { file_urls: fileUrls } : {})
      });
      const score = Math.max(0, Math.min(stage.max_score, Number(analysis.score) || 0));
      return { stage: stage.name, score, max_score: stage.max_score, summary: analysis.summary, findings: analysis.findings || [] };
    }));

    const total = stageResults.reduce((sum, stage) => sum + stage.score, 0);
    const finalSchema = {
      type: 'object',
      properties: {
        annotated_text: { type: 'string' },
        memorable_strengths: { type: 'array', items: { type: 'string' } },
        writing_suggestions: { type: 'array', items: { type: 'string' } },
        study_suggestions: { type: 'array', items: { type: 'string' } }
      },
      required: ['annotated_text', 'memorable_strengths', 'writing_suggestions', 'study_suggestions']
    };
    const finalPrompt = `${basePrompt}\n\nAs cinco competências já foram avaliadas separadamente. Produza somente a devolutiva final: marque no texto todos os erros identificados com [[e:trecho]] e avisos com [[w:trecho]]. Marque no máximo 3 acertos memoráveis com [[c:trecho]] e liste esses mesmos três (ou menos, se não existirem) em memorable_strengths. Não inclua HTML. Sugira estudos de reforço exclusivamente para os erros identificados. Retorne apenas o JSON solicitado.`;
    const finalResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: finalPrompt, response_json_schema: finalSchema, model, ...(fileUrls.length ? { file_urls: fileUrls } : {}) });
    const result = { ...finalResult, stages: stageResults, final_grade: total, max_grade: stages.reduce((sum, stage) => sum + stage.max_score, 0) };
    const inputTokens = Math.ceil((basePrompt.length * 6) / 4);
    const outputTokens = Math.ceil((JSON.stringify(stageResults).length + JSON.stringify(finalResult).length) / 4);
    await base44.asServiceRole.entities.AgentUsage.create({ agent_id: agent?.id || '', agent_name: agent?.name || 'Padrão ENEM', model, banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [], input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens });
    return Response.json({ result, usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}