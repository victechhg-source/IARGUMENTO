/**
 * Mesma regra de dono usada nas functions (entityAccess.ts).
 * Espelhada em JS para o cliente e para testar o caso real do pipeline.
 */

export function unwrapEntity(res) {
  if (!res || typeof res !== 'object') return null;
  const nested = res.data && typeof res.data === 'object' && !Array.isArray(res.data)
    ? res.data
    : null;

  if (typeof res.id === 'string' && res.id.trim()) {
    if (!nested) return res;
    return { ...nested, ...res, id: res.id.trim() };
  }
  if (nested && typeof nested.id === 'string' && nested.id.trim()) {
    return { ...res, ...nested, id: nested.id.trim() };
  }
  return res;
}

export function authUserId(user) {
  const row = unwrapEntity(user);
  if (!row) return '';
  if (typeof row.id === 'string' && row.id.trim()) return row.id.trim();
  if (typeof row.user_id === 'string' && row.user_id.trim()) return row.user_id.trim();
  return '';
}

function stringField(entity, key) {
  if (!entity) return '';
  const direct = entity[key];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const data = entity.data;
  if (data && typeof data === 'object') {
    const nested = data[key];
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return '';
}

export function ownsEssay(essay, userId) {
  if (!essay || !userId) return false;
  return stringField(essay, 'created_by_id') === userId
    || stringField(essay, 'student_id') === userId;
}

/**
 * Gate antigo do runCorrectionAgent: só created_by_id no topo.
 * É exatamente o 404 do print após "Transcrição confirmada".
 */
export function legacyOwnsEssay(essay, userId) {
  return Boolean(essay) && essay.created_by_id === userId;
}
