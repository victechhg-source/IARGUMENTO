/**
 * Inferência local de papel pelo prefixo do código. Não consulta o servidor —
 * só decide se o campo de turma aparece na tela de registro (ainda sem sessão).
 */
export function accountTypeFromAccessCode(raw) {
  const code = String(raw || '').trim().toUpperCase();
  if (code.startsWith('DIR-')) return 'director';
  if (code.startsWith('PRO-')) return 'teacher';
  if (code.startsWith('ALU-') || code.startsWith('ESC-')) return 'student';
  return null;
}

export function isAccessCodeFormat(raw) {
  const code = String(raw || '').trim().toUpperCase();
  return /^(ALU|PRO|DIR|ESC)-[A-Z0-9]{6,}$/.test(code);
}

export function isClassCodeFormat(raw) {
  const code = String(raw || '').trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(code);
}
