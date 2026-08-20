import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { logAdminAction } from '../../shared/auditLog.ts';

// Ações administrativas sobre contas e escolas. Somente admin.
// O cliente NUNCA faz update direto de account_type/suspended/school — passa aqui.
const VALID_ACCOUNT_TYPES = ['student', 'teacher', 'director'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (user.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { userId, action, schoolId, accountType, status } = body;

    // Ação de escola (não exige userId).
    if (action === 'school_status') {
      if (!schoolId) return Response.json({ error: 'schoolId é obrigatório.' }, { status: 400 });
      if (!['active', 'inactive'].includes(status)) return Response.json({ error: 'status inválido.' }, { status: 400 });
      await base44.asServiceRole.entities.School.update(schoolId, { status });
      await logAdminAction(base44, {
        actor_id: user.id, actor_email: user.email, action: 'school_status',
        target_type: 'school', target_id: schoolId, detail: `status=${status}`,
      });
      return Response.json({ ok: true });
    }

    if (!userId || !action) return Response.json({ error: 'userId e action são obrigatórios.' }, { status: 400 });

    const targets = await base44.asServiceRole.entities.User.filter({ id: userId });
    const target = targets[0];
    if (!target) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    // Contas admin não podem ser alteradas por esta via (suspend/unsuspend/
    // set_account_type/attach_school/detach_school).
    if (target.role === 'admin') {
      return Response.json({ error: 'Não é possível alterar a conta de um administrador.' }, { status: 403 });
    }

    let updates = {};
    let detail = '';
    let auditSchoolId = target.school_id || null;

    if (action === 'attach_school') {
      const schools = await base44.asServiceRole.entities.School.filter({ id: schoolId });
      const school = schools[0];
      if (!school) return Response.json({ error: 'Escola não encontrada.' }, { status: 404 });
      updates = { school_id: school.id, school_name: school.name };
      detail = `escola=${school.name}`;
      auditSchoolId = school.id;
    } else if (action === 'detach_school') {
      updates = { school_id: '', school_name: '' };
      detail = 'desvinculado';
      auditSchoolId = null;
    } else if (action === 'set_account_type') {
      if (!VALID_ACCOUNT_TYPES.includes(accountType)) return Response.json({ error: 'accountType inválido.' }, { status: 400 });
      if (target.role === 'admin') return Response.json({ error: 'Não é possível alterar o papel de um administrador.' }, { status: 403 });
      if (target.id === user.id) return Response.json({ error: 'Não é possível alterar o papel da própria conta.' }, { status: 403 });
      updates = { account_type: accountType };
      detail = `account_type=${accountType}`;
    } else if (action === 'suspend') {
      updates = { suspended: true };
      detail = 'suspenso';
    } else if (action === 'unsuspend') {
      updates = { suspended: false };
      detail = 'reativado';
    } else {
      return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(userId, updates);
    await logAdminAction(base44, {
      actor_id: user.id, actor_email: user.email, action,
      target_type: 'user', target_id: userId, school_id: auditSchoolId, detail,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}