import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Retorna as métricas da escola do diretor autenticado (escopo restrito à
// própria school_id). Usa service role porque a RLS das entidades não
// contempla o papel de diretor.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const me = await base44.auth.me();
    const isDirector = me.account_type === 'director' || me.role === 'admin';
    if (!isDirector) return Response.json({ error: 'Acesso restrito a diretores.' }, { status: 403 });
    if (!me.school_id) return Response.json({ error: 'Nenhuma escola vinculada à sua conta.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const [schools, classes, memberships, users] = await Promise.all([
      svc.School.filter({ id: me.school_id }),
      svc.Classroom.filter({ school_id: me.school_id }, '-created_date', 500),
      svc.ClassMembership.filter({ school_id: me.school_id }, '-created_date', 2000),
      svc.User.filter({ school_id: me.school_id }, '-created_date', 2000),
    ]);

    const approved = memberships.filter((m) => m.status === 'approved');
    const studentIds = [...new Set(approved.map((m) => m.student_id))];
    const essays = await svc.Essay.filter({ school_ids: me.school_id, status: 'completed' }, '-created_date', 1000);

    const graded = essays.filter((e) => typeof e.final_grade === 'number' && e.max_grade);
    const avgPercent = graded.length
      ? Math.round(graded.reduce((s, e) => s + (e.final_grade / e.max_grade) * 100, 0) / graded.length)
      : null;

    const byBanca = {};
    for (const e of graded) {
      byBanca[e.banca] = byBanca[e.banca] || { banca: e.banca, count: 0, sum: 0 };
      byBanca[e.banca].count += 1;
      byBanca[e.banca].sum += (e.final_grade / e.max_grade) * 100;
    }

    return Response.json({
      school: schools[0] ? { id: schools[0].id, name: schools[0].name, code: schools[0].institutional_code, student_code: schools[0].student_code, teacher_code: schools[0].teacher_code, director_code: schools[0].director_code } : null,
      metrics: {
        students: studentIds.length,
        teachers: users.filter((u) => u.account_type === 'teacher').length,
        classes: classes.length,
        essays: essays.length,
        pending: memberships.filter((m) => m.status === 'pending').length,
        avgPercent,
      },
      bancas: Object.values(byBanca).map((b) => ({ banca: b.banca, count: b.count, avg: Math.round(b.sum / b.count) })),
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        teacher_name: c.teacher_name || '',
        students: approved.filter((m) => m.class_id === c.id).length,
      })),
      teachers: users
        .filter((u) => u.account_type === 'teacher')
        .map((u) => ({ id: u.id, name: u.full_name || u.display_name || u.email, email: u.email })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});