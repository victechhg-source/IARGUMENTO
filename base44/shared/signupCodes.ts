// Regras autoritativas de cadastro: o PAPEL é consequência do código digitado,
// nunca de uma escolha do cliente. Usado por validateSignupCodes e completeSignup.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

export function prefixForAccountType(accountType) {
  if (accountType === 'director') return 'DIR';
  if (accountType === 'teacher') return 'PRO';
  return 'ALU';
}

// Procura o código entre os códigos por papel de todas as escolas ativas.
// Retorna { school, accountType } ou null.
export async function resolveAccessCode(base44, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const byField = [
    ['director_code', 'director'],
    ['teacher_code', 'teacher'],
    ['student_code', 'student'],
    ['institutional_code', 'student'],
  ];

  for (const [field, accountType] of byField) {
    const matches = await base44.asServiceRole.entities.School.filter({ [field]: code, status: 'active' });
    if (matches.length) return { school: matches[0], accountType };
  }
  return null;
}

// Turma válida E pertencente à escola do código de acesso.
export async function resolveClassroom(base44, rawCode, school) {
  const code = normalizeCode(rawCode);
  if (!code) return { error: 'Informe o código da turma.', status: 400 };

  const matches = await base44.asServiceRole.entities.Classroom.filter({ code });
  const classroom = matches[0];
  if (!classroom) return { error: 'Turma não encontrada. Confira o código.', status: 404 };
  if (classroom.school_id && classroom.school_id !== school.id) {
    return { error: 'A turma informada não pertence à escola deste código de acesso.', status: 400 };
  }
  return { classroom };
}

// ID público único, gerado no servidor com verificação de colisão.
export async function generateRegisteredId(base44, role, accountType) {
  const prefix = role === 'admin' ? 'ADM' : prefixForAccountType(accountType);
  for (let attempt = 0; attempt < 12; attempt++) {
    let suffix = '';
    for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const candidate = `${prefix}-${suffix}`;
    const taken = await base44.asServiceRole.entities.User.filter({ registered_id: candidate });
    if (!taken.length) return candidate;
  }
  throw new Error('Não foi possível gerar um ID de conta único. Tente novamente.');
}