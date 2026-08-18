import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Exporta um resumo CSV da escola do diretor: turma, professor, aluno, email,
// banca, nota, nota_max, data. Sem transcription, sem imagem, sem CPF.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const me = await base44.auth.me();
    if (me.account_type !== 'director' && me.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a diretores.' }, { status: 403 });
    }
    if (!me.school_id) return Response.json({ error: 'Nenhuma escola vinculada à sua conta.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const [classes, memberships, essays] = await Promise.all([
      svc.Classroom.filter({ school_id: me.school_id }, '-created_date', 500),
      svc.ClassMembership.filter({ school_id: me.school_id, status: 'approved' }, '-created_date', 2000),
      svc.Essay.filter({ school_ids: me.school_id, status: 'completed' }, '-created_date', 1000),
    ]);

    const classById = new Map(classes.map((c) => [c.id, c]));
    const memberByStudent = new Map(memberships.map((m) => [m.student_id, m]));

    const rows = essays
      .filter((e) => typeof e.final_grade === 'number' && e.max_grade && memberByStudent.has(e.created_by_id))
      .map((e) => {
        const m = memberByStudent.get(e.created_by_id);
        const c = classById.get(m.class_id);
        return {
          turma: c?.name || '',
          professor: c?.teacher_name || m.teacher_name || '',
          aluno: m.student_name || '',
          email: m.student_email || '',
          banca: e.banca || '',
          nota: e.final_grade,
          nota_max: e.max_grade,
          data: e.created_date ? new Date(e.created_date).toISOString().slice(0, 10) : '',
        };
      });

    return Response.json({ rows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});