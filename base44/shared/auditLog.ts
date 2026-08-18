// Gravação de auditoria das ações administrativas. Sempre via asServiceRole
// (bypassa RLS da entidade AdminAuditLog). Nunca derruba a ação principal:
// falhas de log são silenciosas.
export async function logAdminAction(base44, entry) {
  try {
    await base44.asServiceRole.entities.AdminAuditLog.create({
      actor_id: entry.actor_id || null,
      actor_email: entry.actor_email || null,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      school_id: entry.school_id || null,
      detail: entry.detail || null,
    });
  } catch {
    // silencioso
  }
}