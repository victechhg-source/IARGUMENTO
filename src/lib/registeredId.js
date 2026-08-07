// Geração de ID público único por conta: ADM-/PRO-/ALU- + 6 caracteres.
// Alfabeto sem 0/O/1/I para evitar ambiguidade visual.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function prefixFor(role, accountType) {
  if (role === 'admin') return 'ADM';
  return accountType === 'teacher' ? 'PRO' : 'ALU';
}

export function makeRegisteredId(role = 'user', accountType = 'student') {
  const prefix = prefixFor(role, accountType);
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}-${s}`;
}