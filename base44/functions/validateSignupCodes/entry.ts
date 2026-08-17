import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { school_code, class_code, account_type } = await req.json();

    const schoolNorm = String(school_code || '').trim().toUpperCase();
    if (!schoolNorm) return Response.json({ valid: false, error: 'Informe o código institucional da escola.' }, { status: 400 });

    const schools = await base44.asServiceRole.entities.School.filter({ institutional_code: schoolNorm, status: 'active' });
    if (!schools.length) return Response.json({ valid: false, error: 'Código institucional inválido ou inativo.' }, { status: 404 });
    const school = schools[0];

    if (account_type === 'student') {
      const classNorm = String(class_code || '').trim().toUpperCase();
      if (!classNorm) return Response.json({ valid: false, error: 'Informe o código da turma.' }, { status: 400 });
      const classes = await base44.asServiceRole.entities.Classroom.filter({ code: classNorm });
      if (!classes.length) return Response.json({ valid: false, error: 'Turma não encontrada. Confira o código.' }, { status: 404 });
      const classroom = classes[0];
      if (classroom.school_id && classroom.school_id !== school.id) {
        return Response.json({ valid: false, error: 'A turma informada não pertence à escola selecionada.' }, { status: 400 });
      }
    }

    return Response.json({ valid: true, school: { id: school.id, name: school.name } });
  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});