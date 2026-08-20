import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Persiste o resultado da correção (Essay.update no cliente é admin-only).
// Body: { essayId, result } — result vem do runCorrectionAgent.
// Grava SOMENTE os campos do resultado (status 'completed', annotated_text,
// memorable_strengths, corrections = result.stages, final_grade, max_grade,
// writing_suggestions, study_suggestions). Responde { essay }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { essayId, result } = body;
    if (!essayId || !result || typeof result !== 'object') {
      return Response.json({ error: 'essayId e result são obrigatórios.' }, { status: 400 });
    }
    if (typeof result.final_grade !== 'number' || Number.isNaN(result.final_grade)) {
      return Response.json({ error: 'result.final_grade deve ser um número.' }, { status: 400 });
    }
    if (!Array.isArray(result.stages)) {
      return Response.json({ error: 'result.stages deve ser uma lista.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const essay = await svc.Essay.get(essayId);
    if (!essay || essay.created_by_id !== user.id) {
      return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });
    }
    if (!['correcting', 'reviewing'].includes(essay.status)) {
      return Response.json({ error: 'Esta redação não está em correção.' }, { status: 409 });
    }

    const asStringArray = (value) =>
      Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];

    const updated = await svc.Essay.update(essayId, {
      status: 'completed',
      annotated_text: typeof result.annotated_text === 'string' ? result.annotated_text : '',
      memorable_strengths: asStringArray(result.memorable_strengths),
      corrections: result.stages,
      final_grade: result.final_grade,
      max_grade: typeof result.max_grade === 'number' ? result.max_grade : essay.max_grade,
      writing_suggestions: asStringArray(result.writing_suggestions),
      study_suggestions: asStringArray(result.study_suggestions),
    });
    return Response.json({ essay: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
