import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateUniqueClassCode } from '../../shared/signupCodes.ts';
import { requireAccountGrant } from '../../shared/accountGrant.ts';

// Regenera o código de uma turma (6 chars, alfabeto restrito, unicidade).
// Somente o professor dono da turma pode regenerar.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (me.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    const access = await requireAccountGrant(base44, me, ['teacher']);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const { classId } = await req.json();
    if (!classId) return Response.json({ error: 'classId é obrigatório.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const classroom = (await svc.Classroom.filter({ id: classId }))[0];
    if (!classroom) return Response.json({ error: 'Turma não encontrada.' }, { status: 404 });
    if (classroom.teacher_id !== me.id && me.role !== 'admin') {
      return Response.json({ error: 'Você não pode alterar esta turma.' }, { status: 403 });
    }

    const code = await generateUniqueClassCode(base44);
    const updated = await svc.Classroom.update(classId, { code });
    return Response.json({ classroom: updated, code });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});