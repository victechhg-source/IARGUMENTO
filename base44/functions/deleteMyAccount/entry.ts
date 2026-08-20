import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAccountGrant } from '../../shared/accountGrant.ts';

// Encerramento da conta do aluno: apaga redações e vínculos, anonimiza o perfil.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role === 'admin') {
      return Response.json(
        { error: 'Contas administrativas não podem ser encerradas por aqui.' },
        { status: 403 },
      );
    }

    const access = await requireAccountGrant(base44, user, ['student']);
    if (!access.ok) {
      return Response.json(
        { error: 'Professores e diretores devem pedir o encerramento à administração.' },
        { status: 403 },
      );
    }

    const svc = base44.asServiceRole.entities;
    const essays = await svc.Essay.filter({ created_by_id: user.id }, '-created_date', 500);
    for (const essay of essays) {
      await svc.Essay.delete(essay.id);
    }
    const memberships = await svc.ClassMembership.filter({ student_id: user.id });
    for (const membership of memberships) {
      await svc.ClassMembership.delete(membership.id);
    }

    const grants = await svc.AccountGrant.filter({ user_id: user.id });
    for (const grant of grants) {
      await svc.AccountGrant.delete(grant.id);
    }

    await svc.User.update(user.id, {
      display_name: 'Conta encerrada',
      school_id: '',
      school_name: '',
      suspended: true,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
