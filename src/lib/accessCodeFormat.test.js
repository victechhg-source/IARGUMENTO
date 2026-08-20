import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accountTypeFromAccessCode,
  isAccessCodeFormat,
  isClassCodeFormat,
} from './accessCodeFormat.js';

test('prefixo ALU e ESC são aluno', () => {
  assert.equal(accountTypeFromAccessCode('ALU-ABC123'), 'student');
  assert.equal(accountTypeFromAccessCode('esc-zzzzzz'), 'student');
});

test('prefixo PRO e DIR', () => {
  assert.equal(accountTypeFromAccessCode('PRO-ABC123'), 'teacher');
  assert.equal(accountTypeFromAccessCode('DIR-ABC123'), 'director');
});

test('formato do código de acesso', () => {
  assert.equal(isAccessCodeFormat('ALU-ABC123'), true);
  assert.equal(isAccessCodeFormat('ALU-AB'), false);
  assert.equal(isAccessCodeFormat('XYZ-ABC123'), false);
});

test('formato do código da turma', () => {
  assert.equal(isClassCodeFormat('AB12CD'), true);
  assert.equal(isClassCodeFormat('ab'), false);
});
