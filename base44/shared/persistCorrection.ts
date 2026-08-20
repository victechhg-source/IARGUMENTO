// Campos gravados na Essay após a correção. O cliente NÃO pode enviar nota.
// Usado por runCorrectionAgent (persistência autoritativa).

export function asStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : [];
}

export function persistFieldsFromResult(result) {
  const stages = Array.isArray(result?.stages) ? result.stages : [];
  const finalGrade = typeof result?.final_grade === 'number' &&
    !Number.isNaN(result.final_grade)
    ? result.final_grade
    : 0;
  const maxGrade = typeof result?.max_grade === 'number' &&
    !Number.isNaN(result.max_grade)
    ? result.max_grade
    : undefined;

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
  if (maxGrade !== undefined) fields.max_grade = maxGrade;
  return fields;
}

export function resultFromEssay(essay) {
  return {
    annotated_text: essay.annotated_text || '',
    memorable_strengths: essay.memorable_strengths || [],
    stages: essay.corrections || [],
    final_grade: essay.final_grade,
    max_grade: essay.max_grade,
    writing_suggestions: essay.writing_suggestions || [],
    study_suggestions: essay.study_suggestions || [],
  };
}

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    annotated_text: { type: 'string' },
    memorable_strengths: { type: 'array', items: { type: 'string' } },
    stages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stage: { type: 'string' },
          score: { type: 'number' },
          max_score: { type: 'number' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                excerpt: { type: 'string' },
                explanation: { type: 'string' },
                suggestion: { type: 'string' },
                video_suggestion: { type: 'string' },
              },
            },
          },
        },
      },
    },
    final_grade: { type: 'number' },
    max_grade: { type: 'number' },
    writing_suggestions: { type: 'array', items: { type: 'string' } },
    study_suggestions: { type: 'array', items: { type: 'string' } },
  },
};
