import test from 'node:test';
import assert from 'node:assert/strict';

function asStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : [];
}

function persistFieldsFromResult(result) {
  const stages = Array.isArray(result?.stages) ? result.stages : [];
  const finalGrade = typeof result?.final_grade === 'number' &&
    !Number.isNaN(result.final_grade)
    ? result.final_grade
    : 0;
  const fields = {
    status: 'completed',
    annotated_text: typeof result?.annotated_text === 'string'
      ? result.annotated_text
      : '',
    memorable_strengths: asStringArray(result?.memorable_strengths),
    corrections: stages,
    final_grade: finalGrade,
    writing_suggestions: asStringArray(result?.writing_suggestions),
    study_suggestions: asStringArray(result?.study_suggestions),
  };
  if (typeof result?.max_grade === 'number') fields.max_grade = result.max_grade;
  return fields;
}

test('grava só campos do resultado e ignora extra do cliente', () => {
  const fields = persistFieldsFromResult({
    stages: [{ stage: 'C1', score: 160 }],
    final_grade: 800,
    max_grade: 1000,
    annotated_text: 'texto',
    teacher_note: 'não deve ir',
    status: 'transcribing',
  });
  assert.equal(fields.status, 'completed');
  assert.equal(fields.final_grade, 800);
  assert.equal(fields.corrections[0].score, 160);
  assert.equal(fields.teacher_note, undefined);
});

test('nota inválida vira 0', () => {
  const fields = persistFieldsFromResult({ stages: [] });
  assert.equal(fields.final_grade, 0);
});
