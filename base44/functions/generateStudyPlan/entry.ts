import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { authUserId, isSuspended } from '../../shared/entityAccess.ts';
import { deriveStudySubjects } from '../../shared/studySubjects.ts';
import { PLANNER_SYSTEM_PROMPT } from '../../shared/plannerPrompt.ts';

// Gera um plano de estudos semanal personalizado para o aluno. As matérias
// são derivadas das correções das próprias redações (prioridade alta p/ erro
// recorrente, baixa p/ acerto). As preferências vêm da interface (botões).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const userId = authUserId(user);
    if (!userId) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (isSuspended(user)) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const prefs = body && typeof body.preferences === 'object' ? body.preferences : {};
    const selectedNames: string[] = Array.isArray(body.selectedSubjectNames)
      ? body.selectedSubjectNames.filter((n: any) => typeof n === 'string')
      : [];

    const essays = await base44.entities.Essay.filter({ status: 'completed' }, '-created_date', 100);
    const subjects = deriveStudySubjects(essays as any[]);
    const included = selectedNames.length
      ? subjects.filter((s) => selectedNames.includes(s.name))
      : subjects;

    if (!included.length) {
      return Response.json({ error: 'Selecione ao menos uma matéria para planejar.' }, { status: 400 });
    }

    const agents = await base44.asServiceRole.entities.PlannerAgent.filter({ active: true, status: 'ready' });
    const agent = agents[0] || null;
    const systemPrompt = (agent?.system_prompt || '').trim() || PLANNER_SYSTEM_PROMPT;
    const model = agent?.model || 'automatic';

    const subjectsBlock = included.map((s) =>
      `- ${s.name} (prioridade ${s.priority}) — ${s.errors} erro(s), ${s.corrects} acerto(s) em ${s.essays} redação(ões); bancas: ${s.bancas.join(', ') || '—'}.${s.suggestions.length ? ' Foco sugerido pela IA: ' + s.suggestions.join('; ') + '.' : ''}`
    ).join('\n');

    const days = Array.isArray(prefs.days) && prefs.days.length ? prefs.days.join(', ') : '—';
    const userMsg = `PERFIL DO ALUNO (matérias derivadas das correções das redações):
${subjectsBlock}

PREFERÊNCIAS DE ESTUDO (coletadas pela interface):
- Horas por dia: ${prefs.hoursPerDay ?? '—'}
- Dias por semana: ${prefs.daysPerWeek ?? '—'}${days !== '—' ? ` (${days})` : ''}
- Sessões por dia: ${prefs.sessionsPerDay ?? '—'}
- Minutos por sessão: ${prefs.minutesPerSession ?? '—'}
- Pico de concentração: ${prefs.peakTime || 'não informado'}
- Horários indisponíveis: ${prefs.unavailable || 'nenhum'}
- Data da prova/objetivo: ${prefs.examDate || 'não informada'}
- Observações de prioridade: ${prefs.priorityNotes || 'nenhuma'}

Monte o cronograma semanal completo no JSON do schema. Use como "subject" EXATAMENTE os nomes das matérias listadas. Aplique prática espaçada, intercalação e ordenação por energia. "priority" em cada sessão deve refletir a prioridade da matéria.`;

    const schema = {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        principles_applied: { type: 'array', items: { type: 'string' } },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    session: { type: 'number' },
                    subject: { type: 'string' },
                    focus: { type: 'string' },
                    duration_min: { type: 'number' },
                    activity_split: { type: 'string' },
                    break_min: { type: 'number' },
                    priority: { type: 'string' },
                  },
                  required: ['session', 'subject', 'focus', 'duration_min'],
                },
              },
            },
            required: ['day', 'sessions'],
          },
        },
        weekly_review_checklist: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
      required: ['summary', 'days', 'weekly_review_checklist'],
    };

    const fullPrompt = `${systemPrompt}\n\n${userMsg}\n\nRetorne APENAS o JSON.`;
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: schema,
      model,
    });

    const inputTokens = Math.ceil(fullPrompt.length / 4);
    const outputTokens = Math.ceil(JSON.stringify(result || {}).length / 4);
    await base44.asServiceRole.entities.AgentUsage.create({
      agent_id: agent?.id || '',
      agent_name: agent?.name || 'Planejador de Estudos',
      model,
      banca: 'PLANNER',
      student_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    });

    return Response.json({ plan: result, subjects: included });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}