import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateUniqueClassCode } from '../../shared/signupCodes.ts';
import { requireAccountGrant } from '../../shared/accountGrant.ts';

// Cria uma turma para o professor autenticado. Body: { name }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }
    const access = await requireAccountGrant(base44, user, ['teacher']);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }
    if (!access.school_id) {
      return Response.json({ error: 'Conclua seu cadastro antes de criar turmas.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return Response.json({ error: 'Informe o nome da turma.' }, { status: 400 });

    const code = await generateUniqueClassCode(base44);
    const classroom = await base44.asServiceRole.entities.Classroom.create({
      name,
      code,
      teacher_id: user.id,
      teacher_name: user.display_name || user.full_name || user.email,
      school_id: access.school_id,
    });
    return Response.json({ classroom });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
