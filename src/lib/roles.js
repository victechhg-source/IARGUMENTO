// Rótulos e destinos por papel — fonte única para telas e guards de rota.
export const ROLE_LABELS = {
  student: 'Aluno',
  teacher: 'Professor',
  director: 'Diretor',
};

export function roleLabel(accountType) {
  return ROLE_LABELS[accountType] || 'Aluno';
}

// Home de cada papel após login/cadastro.
export function homePathFor(user) {
  if (!user) return '/login';
  // Admin sem papel de teste assumido vai para a administração.
  if (user.role === 'admin' && !user.school_id) return '/admin';
  if (user.account_type === 'director') return '/diretor';
  if (user.account_type === 'teacher') return '/professor';
  if (user.role === 'admin') return '/admin';
  return '/correcao';
}

// Chaves de cadastro pendente (usadas para pré-preencher a tela de conclusão).
const PENDING_KEYS = ['pendingAccessCode', 'pendingClassCode', 'pendingFullName'];

export function savePendingSignup({ accessCode, classCode, fullName }) {
  localStorage.setItem('pendingAccessCode', accessCode || '');
  localStorage.setItem('pendingClassCode', classCode || '');
  localStorage.setItem('pendingFullName', fullName || '');
}

export function readPendingSignup() {
  return {
    accessCode: localStorage.getItem('pendingAccessCode') || '',
    classCode: localStorage.getItem('pendingClassCode') || '',
    fullName: localStorage.getItem('pendingFullName') || '',
  };
}

export function clearPendingSignup() {
  PENDING_KEYS.forEach((k) => localStorage.removeItem(k));
  // Limpa também as chaves do fluxo antigo.
  ['pendingAccountType', 'pendingSchoolCode', 'pendingBirthDate', 'pendingCpf'].forEach((k) => localStorage.removeItem(k));
}