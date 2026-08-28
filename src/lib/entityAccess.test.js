import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unwrapEntity,
  authUserId,
  ownsEssay,
  legacyOwnsEssay,
} from './entityAccess.js';

/**
 * Forma real depois do create via service role: created_by_id não é o
 * aluno; student_id / campos da redação estão em data. OCR e
 * confirm_transcription já usavam ownsEssay; o corretor ainda usava
 * created_by_id !== user.id e devolvia 404 no print.
 */
const productionEssay = {
  id: 'essay-1',
  created_by_id: 'acct_service_role',
  data: {
    student_id: 'user_aluno',
    banca: 'ENEM',
    status: 'correcting',
    transcription: 'A casa de Joana é bonita.',
  },
};

const student = { id: 'user_aluno', email: 'a@b.c', data: { account_type: 'student' } };

test('caso do print: gate antigo do corretor recusa a redação do aluno', () => {
  const userId = authUserId(student);
  assert.equal(userId, 'user_aluno');
  assert.equal(legacyOwnsEssay(productionEssay, userId), false);
});

test('caso do print: gate único (created_by_id OU student_id) aceita', () => {
  const essay = unwrapEntity(productionEssay);
  const userId = authUserId(student);
  assert.equal(ownsEssay(essay, userId), true);
  assert.equal(essay.status, 'correcting');
  assert.equal(essay.transcription, 'A casa de Joana é bonita.');
  assert.equal(essay.banca, 'ENEM');
});

test('outro aluno não passa no gate', () => {
  assert.equal(
    ownsEssay(unwrapEntity(productionEssay), 'user_outro'),
    false,
  );
});

test('dono clássico (created_by_id no topo) continua válido', () => {
  const essay = unwrapEntity({
    id: 'essay-2',
    created_by_id: 'user_aluno',
    banca: 'FUVEST',
    status: 'reviewing',
    transcription: 'Texto',
  });
  assert.equal(ownsEssay(essay, 'user_aluno'), true);
  assert.equal(legacyOwnsEssay(essay, 'user_aluno'), true);
});
