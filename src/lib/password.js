// Política mínima de senha, usada em todas as telas que definem senha.
export function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 8) return 'A senha precisa ter ao menos 8 caracteres.';
  if (!/[A-Za-zÀ-ÿ]/.test(value)) return 'A senha precisa conter ao menos uma letra.';
  if (!/[0-9]/.test(value)) return 'A senha precisa conter ao menos um número.';
  return null;
}