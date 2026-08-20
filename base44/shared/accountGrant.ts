// Vínculo institucional autoritativo. auth.updateMe NÃO escreve aqui.
// Functions de papel leem AccountGrant via service role, não user.account_type.

const VALID_TYPES = ['student', 'teacher', 'director'];

export async function upsertAccountGrant(base44, payload) {
  const userId = payload.user_id;
  const accountType = payload.account_type;
  if (!userId || !VALID_TYPES.includes(accountType)) return null;

  const body = {
    user_id: userId,
    account_type: accountType,
    school_id: payload.school_id || '',
    school_name: payload.school_name || '',
  };
  const existing = await base44.asServiceRole.entities.AccountGrant.filter({
    user_id: userId,
  });
  if (existing[0]) {
    return base44.asServiceRole.entities.AccountGrant.update(
      existing[0].id,
      body,
    );
  }
  return base44.asServiceRole.entities.AccountGrant.create(body);
}

export async function requireAccountGrant(base44, user, allowed) {
  if (user?.role === 'admin') {
    return {
      ok: true,
      isAdmin: true,
      grant: null,
      school_id: user.school_id || '',
    };
  }

  const rows = await base44.asServiceRole.entities.AccountGrant.filter({
    user_id: user.id,
  });
  let grant = rows[0] || null;

  // Snapshot único para contas anteriores ao AccountGrant.
  if (!grant && user.account_type && user.school_id) {
    grant = await upsertAccountGrant(base44, {
      user_id: user.id,
      account_type: user.account_type,
      school_id: user.school_id,
      school_name: user.school_name,
    });
  }

  if (!grant) {
    return {
      ok: false,
      status: 403,
      error: 'Conclua seu cadastro institucional.',
    };
  }
  if (Array.isArray(allowed) && !allowed.includes(grant.account_type)) {
    return {
      ok: false,
      status: 403,
      error: 'Acesso não permitido para este perfil.',
    };
  }
  return {
    ok: true,
    isAdmin: false,
    grant,
    school_id: grant.school_id,
  };
}

export function sanitizeDisplayName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Informe um nome.' };
  if (name.length > 80) {
    return { ok: false, error: 'O nome deve ter no máximo 80 caracteres.' };
  }
  return { ok: true, name };
}
