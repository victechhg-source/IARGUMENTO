import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAccountGrant } from '../../shared/accountGrant.ts';

// Professor altera só nome ou arquivo da própria turma.
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

    const body = await req.json().catch(() => ({}));
    const classId = body.classId;
    if (!classId) {
      return Response.json({ error: 'classId é obrigatório.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const classroom = (await svc.Classroom.filter({ id: classId }))[0];
    if (!classroom) {
      return Response.json({ error: 'Turma não encontrada.' }, { status: 404 });
    }
    if (classroom.teacher_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Você não pode alterar esta turma.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) {
        return Response.json({ error: 'Informe o nome da turma.' }, { status: 400 });
      }
      updates.name = name;
    }
    if (typeof body.archived === 'boolean') updates.archived = body.archived;
    if (!Object.keys(updates).length) {
      return Response.json({ error: 'Nada para atualizar.' }, { status: 400 });
    }

    const updated = await svc.Classroom.update(classId, updates);
    return Response.json({ classroom: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
