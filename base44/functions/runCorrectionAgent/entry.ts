import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const { banca, essayId, prompt, responseJsonSchema } = await req.json();
    let essay;
    try {
      essay = await base44.asServiceRole.entities.Essay.get(essayId);
    } catch {
      return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });
    }
    if (!essay || essay.created_by_id !== user.id) return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });

    const agents = await base44.asServiceRole.entities.CorrectionAgent.filter({ banca, active: true, status: 'ready' });
    const agent = agents[0] || null;
    const resources = agent ? await base44.asServiceRole.entities.AgentTrainingResource.filter({ agent_id: agent.id }) : [];
    const context = resources.filter((r) => r.content).map((r) => `### ${r.title}\n${r.content}`).join('\n\n');
    const finalPrompt = `${agent?.system_prompt || ''}\n\n${context}\n\n${prompt}`.trim();
    const fileUrls = resources.filter((r) => r.file_url).map((r) => r.file_url);
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: finalPrompt,
      response_json_schema: responseJsonSchema,
      model: agent?.model || 'automatic',
      ...(fileUrls.length ? { file_urls: fileUrls } : {})
    });

    const inputTokens = Math.ceil(finalPrompt.length / 4);
    const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
    await base44.asServiceRole.entities.AgentUsage.create({
      agent_id: agent?.id || '', agent_name: agent?.name || `Padrão ${banca}`, model: agent?.model || 'automatic',
      banca, essay_id: essayId, student_id: user.id, school_ids: essay.school_ids || [],
      input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens
    });
    return Response.json({ result, usage: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: inputTokens + outputTokens } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});