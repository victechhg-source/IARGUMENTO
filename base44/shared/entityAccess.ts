/**
 * Normaliza User/Essay do SDK no backend (id no topo ou em `data`).
 * Campos custom do Base44 vivem em `data`; o flatten coloca status,
 * transcription, banca e student_id no topo para o resto do fluxo.
 */

export function unwrapEntity(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== 'object') return null;
  const row = res as Record<string, unknown>;
  const nested = row.data && typeof row.data === 'object' && !Array.isArray(row.data)
    ? (row.data as Record<string, unknown>)
    : null;

  if (typeof row.id === 'string' && row.id.trim()) {
    if (!nested) return row;
    return { ...nested, ...row, id: row.id.trim() };
  }
  if (nested && typeof nested.id === 'string' && nested.id.trim()) {
    return { ...row, ...nested, id: nested.id.trim() };
  }
  return row;
}

export function authUserId(user: unknown): string {
  const row = unwrapEntity(user);
  if (!row) return '';
  if (typeof row.id === 'string' && row.id.trim()) return row.id.trim();
  if (typeof row.user_id === 'string' && row.user_id.trim()) return row.user_id.trim();
  return '';
}

export function isSuspended(user: unknown): boolean {
  const row = unwrapEntity(user);
  if (!row) return false;
  if (row.suspended === true) return true;
  const data = row.data;
  if (data && typeof data === 'object' && (data as { suspended?: unknown }).suspended === true) {
    return true;
  }
  return false;
}

function stringField(entity: Record<string, unknown> | null, key: string): string {
  if (!entity) return '';
  const direct = entity[key];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const data = entity.data;
  if (data && typeof data === 'object') {
    const nested = (data as Record<string, unknown>)[key];
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return '';
}

export function ownerIdOf(essay: Record<string, unknown> | null): string {
  return stringField(essay, 'created_by_id') || stringField(essay, 'student_id');
}

/**
 * Dono da redação: created_by_id (campo de sistema) OU student_id
 * (gravado no createEssay via service role, quando o sistema não
 * carimba o aluno em created_by_id).
 */
export function ownsEssay(essay: Record<string, unknown> | null, userId: string): boolean {
  if (!essay || !userId) return false;
  return stringField(essay, 'created_by_id') === userId
    || stringField(essay, 'student_id') === userId;
}

export function essayIdOf(essay: Record<string, unknown> | null): string {
  return stringField(essay, 'id');
}

export function essayFileUrl(essay: Record<string, unknown> | null): string {
  return stringField(essay, 'original_image_url');
}
