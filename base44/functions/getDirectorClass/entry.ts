import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Detalhe de uma turma para o diretor (somente leitura).
// Recusa se a turma não pertencer à escola do diretor.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const me = await base44.auth.me();
    if (me.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }
    if (me.account_type !== 'director' && me.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a diretores.' }, { status: 403 });
    }
    if (!me.school_id) return Response.json({ error: 'Nenhuma escola vinculada à sua conta.' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const classId = body?.classId;
    if (!classId) return Response.json({ error: 'classId é obrigatório.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const classroom = (await svc.Classroom.filter({ id: classId }))[0];
    if (!classroom) return Response.json({ error: 'Turma não encontrada.' }, { status: 404 });
    if (classroom.school_id !== me.school_id) {
      return Response.json({ error: 'Esta turma não pertence à sua escola.' }, { status: 403 });
    }

    const memberships = await svc.ClassMembership.filter({ class_id: classId }, '-created_date', 500);
    const approved = memberships.filter((m) => m.status === 'approved');
    const pending = memberships.filter((m) => m.status === 'pending');
    const studentIds = approved.map((m) => m.student_id);

    const essays = await svc.Essay.filter({ school_ids: me.school_id, status: 'completed' }, '-created_date', 1000);
    const classEssays = essays.filter((e) => studentIds.includes(e.created_by_id));
    const graded = classEssays.filter((e) => typeof e.final_grade === 'number' && e.max_grade);
    const avgPercent = graded.length
      ? Math.round(graded.reduce((s, e) => s + (e.final_grade / e.max_grade) * 100, 0) / graded.length)
      : null;

    return Response.json({
      classroom: { id: classroom.id, name: classroom.name, code: classroom.code, teacher_name: classroom.teacher_name || '' },
      approved: approved.map((m) => ({
        id: m.id,
        student_id: m.student_id,
        student_name: m.student_name,
        student_email: m.student_email,
        essays: classEssays.filter((e) => e.created_by_id === m.student_id).length,
      })),
      pending: pending.map((m) => ({ id: m.id, student_name: m.student_name, student_email: m.student_email })),
      essaysCount: classEssays.length,
      avgPercent,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});