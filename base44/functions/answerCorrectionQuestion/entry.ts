import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { authUserId, isSuspended, ownsEssay, unwrapEntity } from '../../shared/entityAccess.ts';

// Limite de dúvidas por redação (economia de tokens). Aplicado server-side:
// como o update de Essay é admin-only e só a service role escreve qa_history,
// o cliente não consegue contornar o limite.
const MAX_QUESTIONS = 2;

// Serializa a correção salva na redação num bloco de contexto para o LLM,
// de forma banca-agnóstica (funciona para ENEM, FUVEST, UFU, UniRV, etc.).
function serializeCorrection(essay: Record<string, any>): string {
  const lines: string[] = [];
  lines.push(`- Banca: ${essay.banca || '—'}`);
  lines.push(`- Nota final: ${essay.final_grade ?? '—'} / ${essay.max_grade ?? '—'}`);
  const stages = Array.isArray(essay.corrections) ? essay.corrections : [];
  stages.forEach((st: any, i: number) => {
    lines.push(`  Critério ${i + 1}: ${st?.stage || ''} — ${st?.score ?? '—'}/${st?.max_score ?? '—'}`);
    if (st?.summary) lines.push(`    Resumo: ${st.summary}`);
    (st?.findings || []).forEach((f: any) => {
      const label = f?.type === 'error' ? 'Erro' : f?.type === 'warning' ? 'Atenção' : 'Acerto';
      const tail = f?.suggestion ? ` (Sugestão: ${f.suggestion})` : '';
      lines.push(`    [${label}] ${f?.excerpt || ''} — ${f?.explanation || ''}${tail}`);
    });
  });
  if (Array.isArray(essay.memorable_strengths) && essay.memorable_strengths.length)
    lines.push(`- Pontos fortes: ${essay.memorable_strengths.join('; ')}`);
  if (Array.isArray(essay.writing_suggestions) && essay.writing_suggestions.length)
    lines.push(`- Sugestões de escrita: ${essay.writing_suggestions.join('; ')}`);
  if (Array.isArray(essay.study_suggestions) && essay.study_suggestions.length)
    lines.push(`- Sugestões de estudo: ${essay.study_suggestions.join('; ')}`);
  if (essay.teacher_note) lines.push(`- Recado do professor: ${essay.teacher_note}`);
  return lines.join('\n');
}

function serializeQa(qa: any[]): string {
  if (!qa || !qa.length) return '(nenhuma ainda)';
  return qa.map((q: any, i: number) => `P${i + 1}: ${q.question}\nR${i + 1}: ${q.answer}`).join('\n');
}

// ─── Pipeline de tira-dúvidas pós-correção ───
// Camada de interação adicional do agente de correção: o aluno faz até
// MAX_QUESTIONS perguntas sobre a correção concluída. O corretor responde
// lembrando de todos os parâmetros (notas, erros, sugestões) e recusa
// perguntas sem relação com a redação. Banca-agnóstico — integra em todas.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const userId = authUserId(user);
    if (!userId) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (isSuspended(user)) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const essayId = typeof body.essayId === 'string' ? body.essayId.trim() : '';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!essayId) return Response.json({ error: 'essayId é obrigatório.' }, { status: 400 });
    if (!question) return Response.json({ error: 'Escreva uma pergunta.' }, { status: 400 });
    if (question.length > 500)
      return Response.json({ error: 'Pergunta muito longa (máx 500 caracteres).' }, { status: 400 });

    const essay = unwrapEntity(await base44.asServiceRole.entities.Essay.get(essayId));
    // Admin pode tirar dúvidas de qualquer redação (auditoria/teste); alunos só das suas.
    if (!essay || (user.role !== 'admin' && !ownsEssay(essay, userId)))
      return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });

    if (essay.status !== 'completed')
      return Response.json({ error: 'A correção precisa estar concluída para tirar dúvidas.' }, { status: 409 });
    if (!essay.transcription)
      return Response.json({ error: 'Redação sem transcrição.' }, { status: 409 });

    const qaHistory: any[] = Array.isArray(essay.qa_history) ? essay.qa_history : [];
    if (qaHistory.length >= MAX_QUESTIONS)
      return Response.json({ error: 'Limite de dúvidas atingido (2 por redação).', remaining: 0 }, { status: 429 });

    const correctionContext = serializeCorrection(essay);
    const previousQa = serializeQa(qaHistory);

    const prompt = `Você é o CORRETOR que acabou de avaliar a redação do aluno para a banca ${essay.banca}. O aluno está tirando dúvidas sobre a correção.

REGRAS:
- Responda APENAS perguntas relacionadas a ESTA redação, à sua correção, aos critérios da banca ${essay.banca} ou à escrita em geral.
- Se a pergunta NÃO tiver relação com a redação/correção, recuse educadamente e peça ao aluno que reformule a dúvida dentro do tema da redação.
- Você se lembra de TODOS os parâmetros da correção (notas por critério, erros apontados, sugestões dadas). Baseie-se estritamente neles — não invente notas novas nem re-corrija o que já foi corrigido.
- Seja didático, claro e conciso (no máximo ~250 palavras).
- Mantenha o tom de um professor que quer ajudar o aluno a evoluir.

CONTEXTO DA CORREÇÃO:
${correctionContext}

REDAÇÃO DO ALUNO:
"""
${essay.transcription}
"""

HISTÓRICO DE PERGUNTAS ANTERIORES (considere o contexto acumulado):
${previousQa}

NOVA PERGUNTA DO ALUNO:
${question}

Responda em português, de forma direta e didática.`;

    const output = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'automatic',
    });
    const answer = String(output || '').trim();
    if (!answer)
      return Response.json({ error: 'Não foi possível gerar uma resposta.' }, { status: 500 });

    const now = new Date().toISOString();
    const newEntry = { question, answer, created_date: now };
    const updatedQa = [...qaHistory, newEntry];

    await base44.asServiceRole.entities.Essay.update(essayId, {
      qa_history: updatedQa,
    });

    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(answer.length / 4);
    await base44.asServiceRole.entities.AgentUsage.create({
      agent_name: `Tira-dúvidas ${essay.banca}`,
      model: 'automatic',
      banca: essay.banca,
      essay_id: essayId,
      student_id: userId,
      school_ids: Array.isArray(essay.school_ids) ? essay.school_ids : [],
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    });

    return Response.json({
      answer,
      qa_history: updatedQa,
      remaining: Math.max(0, MAX_QUESTIONS - updatedQa.length),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}