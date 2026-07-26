import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const { code } = await req.json();
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) return Response.json({ error: 'Informe o código da turma.' }, { status: 400 });

    const classes = await base44.asServiceRole.entities.Classroom.filter({ code: normalizedCode });
    const classroom = classes[0];
    if (!classroom) return Response.json({ error: 'Turma não encontrada. Confira o código.' }, { status: 404 });

    const existing = await base44.asServiceRole.entities.ClassMembership.filter({ class_id: classroom.id, student_id: user.id });
    if (existing.length) return Response.json({ error: 'Você já solicitou entrada nesta turma.' }, { status: 409 });

    const membership = await base44.asServiceRole.entities.ClassMembership.create({
      class_id: classroom.id,
      class_name: classroom.name,
      class_code: classroom.code,
      teacher_id: classroom.teacher_id,
      teacher_name: classroom.teacher_name,
      student_id: user.id,
      student_name: user.full_name || user.email,
      student_email: user.email,
      status: 'pending'
    });
    return Response.json({ membership });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});