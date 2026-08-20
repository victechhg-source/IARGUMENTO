import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Cria a redação do aluno. Body: { banca }. Responde { essay }.
// Create na entidade é admin-only; aqui usamos service role com created_by_id.
const BANCAS = ['ENEM', 'FUVEST', 'UNICAMP', 'UNIFESP', 'UFG'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { banca } = body;
    if (!BANCAS.includes(banca)) {
      return Response.json({ error: 'Banca inválida.' }, { status: 400 });
    }

    const memberships = await base44.asServiceRole.entities.ClassMembership.filter({
      student_id: user.id,
      status: 'approved',
    });
    const teacherIds = [...new Set(memberships.map((m) => m.teacher_id).filter(Boolean))];
    const schoolIds = [...new Set(memberships.map((m) => m.school_id).filter(Boolean))];

    const essay = await base44.asServiceRole.entities.Essay.create({
      banca,
      status: 'transcribing',
      created_by_id: user.id,
    });

    // Vínculos gravados via service role: FLS write admin-only nesses campos.
    const updated = (teacherIds.length || schoolIds.length)
      ? await base44.asServiceRole.entities.Essay.update(essay.id, {
        teacher_ids: teacherIds,
        school_ids: schoolIds,
      })
      : essay;

    return Response.json({ essay: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
