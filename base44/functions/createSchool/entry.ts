import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateAccessCode } from '../../shared/signupCodes.ts';
import { logAdminAction } from '../../shared/auditLog.ts';

// Cria uma escola com todos os códigos gerados no servidor (unicidade
// verificada). Somente admin. Body: { name }. Responde { school }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return Response.json({ error: 'Informe o nome da escola.' }, { status: 400 });

    const institutionalCode = await generateAccessCode(base44, 'ESC', 'institutional_code');
    const studentCode = await generateAccessCode(base44, 'ALU', 'student_code');
    const teacherCode = await generateAccessCode(base44, 'PRO', 'teacher_code');
    const directorCode = await generateAccessCode(base44, 'DIR', 'director_code');

    const school = await base44.asServiceRole.entities.School.create({
      name,
      institutional_code: institutionalCode,
      student_code: studentCode,
      teacher_code: teacherCode,
      director_code: directorCode,
      status: 'active',
    });

    await logAdminAction(base44, {
      actor_id: user.id, actor_email: user.email, action: 'create_school',
      target_type: 'school', target_id: school.id, school_id: school.id,
      detail: `name=${name}`,
    });

    return Response.json({ school });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
