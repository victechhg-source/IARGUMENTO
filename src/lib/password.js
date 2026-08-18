// Política mínima de senha, usada em todas as telas que definem senha.
export function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 10) return 'A senha precisa ter ao menos 10 caracteres.';
  if (!/[a-zà-ÿ]/.test(value)) return 'A senha precisa conter ao menos uma letra minúscula.';
  if (!/[A-ZÀ-Ÿ]/.test(value)) return 'A senha precisa conter ao menos uma letra maiúscula.';
  if (!/[0-9]/.test(value)) return 'A senha precisa conter ao menos um número.';
  if (!/[^A-Za-zÀ-ÿ0-9]/.test(value)) return 'A senha precisa conter ao menos um caractere especial.';
  return null;
}