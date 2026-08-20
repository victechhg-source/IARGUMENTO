import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { upsertAccountGrant } from '../../shared/accountGrant.ts';
import { generateRegisteredId } from '../../shared/signupCodes.ts';
import { logAdminAction } from '../../shared/auditLog.ts';

// Conclui o convite enviado por e-mail: vincula escola, define account_type e
// gera registered_id se ainda não existir. Somente admin. Não há update de
// perfil no cliente — tudo pelo servidor.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (user.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { userId, schoolId, accountType } = body;
    if (!userId || !schoolId || !accountType) return Response.json({ error: 'userId, schoolId e accountType são obrigatórios.' }, { status: 400 });
    if (!['student', 'teacher', 'director'].includes(accountType)) return Response.json({ error: 'accountType inválido.' }, { status: 400 });

    const schools = await base44.asServiceRole.entities.School.filter({ id: schoolId });
    const school = schools[0];
    if (!school) return Response.json({ error: 'Escola não encontrada.' }, { status: 404 });

    const updates = { school_id: school.id, school_name: school.name, account_type: accountType };

    const targets = await base44.asServiceRole.entities.User.filter({ id: userId });
    const target = targets[0];
    if (!target) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    // Contas admin não podem ter papel/escola alterados por esta via.
    if (target.role === 'admin') {
      return Response.json({ error: 'Não é possível alterar a conta de um administrador.' }, { status: 403 });
    }

    let registeredId = target.registered_id || null;
    if (!registeredId) {
      registeredId = await generateRegisteredId(base44, target.role, accountType);
      updates.registered_id = registeredId;
    }

    await base44.asServiceRole.entities.User.update(userId, updates);
    await upsertAccountGrant(base44, {
      user_id: userId,
      account_type: accountType,
      school_id: school.id,
      school_name: school.name,
    });
    await logAdminAction(base44, {
      actor_id: user.id, actor_email: user.email, action: 'invite',
      target_type: 'user', target_id: userId, school_id: school.id,
      detail: `account_type=${accountType}${registeredId ? ` registered_id=${registeredId}` : ''}`,
    });

    return Response.json({ ok: true, registered_id: registeredId });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}