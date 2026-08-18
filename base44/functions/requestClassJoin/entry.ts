import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeCode } from '../../shared/signupCodes.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (!user.school_id) return Response.json({ error: 'Conclua seu cadastro antes de entrar em uma turma.' }, { status: 403 });
    if ((user.account_type || 'student') !== 'student') {
      return Response.json({ error: 'Apenas contas de aluno podem solicitar entrada em turmas.' }, { status: 403 });
    }

    const { code } = await req.json();
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) return Response.json({ error: 'Informe o código da turma.' }, { status: 400 });

    const classes = await base44.asServiceRole.entities.Classroom.filter({ code: normalizedCode });
    const classroom = classes[0];
    if (!classroom) return Response.json({ error: 'Turma não encontrada. Confira o código.' }, { status: 404 });

    // Aluno só entra em turma da própria escola.
    if (classroom.school_id && classroom.school_id !== user.school_id) {
      return Response.json({ error: 'Esta turma não pertence à sua escola.' }, { status: 403 });
    }
    if (classroom.archived) {
      return Response.json({ error: 'Esta turma não aceita novos alunos.' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.ClassMembership.filter({ class_id: classroom.id, student_id: user.id });
    if (existing.length) return Response.json({ error: 'Você já solicitou entrada nesta turma.' }, { status: 409 });

    const membership = await base44.asServiceRole.entities.ClassMembership.create({
      class_id: classroom.id,
      class_name: classroom.name,
      class_code: classroom.code,
      teacher_id: classroom.teacher_id,
      teacher_name: classroom.teacher_name,
      school_id: classroom.school_id || user.school_id,
      student_id: user.id,
      student_name: user.display_name || user.full_name || user.email,
      student_email: user.email,
      status: 'pending'
    });
    return Response.json({ membership });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}