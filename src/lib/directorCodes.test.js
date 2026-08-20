import test from 'node:test';
import assert from 'node:assert/strict';
import { directorVisibleSchool } from './directorCodes.js';

test('diretor só recebe código de aluno', () => {
  const visible = directorVisibleSchool({
    id: 's1',
    name: 'Escola A',
    institutional_code: 'ESC-1',
    student_code: 'ALU-AAAAAA',
    teacher_code: 'PRO-SECRET',
    director_code: 'DIR-SECRET',
  });
  assert.equal(visible.student_code, 'ALU-AAAAAA');
  assert.equal(visible.code, 'ESC-1');
  assert.equal(visible.teacher_code, undefined);
  assert.equal(visible.director_code, undefined);
});

test('escola vazia não quebra', () => {
  const visible = directorVisibleSchool(null);
  assert.equal(visible.student_code, '');
});
