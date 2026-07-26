const scoreOf = essay => {
  const score = Number(essay.final_grade);
  const max = Number(essay.max_grade);
  return essay.status === 'completed' && Number.isFinite(score) && max > 0
    ? Math.round((score / max) * 100)
    : null;
};

const summarize = (id, name, essays) => {
  const scores = essays.map(scoreOf).filter(score => score !== null);
  const criteria = {};
  essays.forEach(essay => (essay.corrections || []).forEach(item => {
    if (!item.stage || !Number(item.max_score)) return;
    const values = criteria[item.stage] || [];
    values.push((Number(item.score) / Number(item.max_score)) * 100);
    criteria[item.stage] = values;
  }));
  const weakest = Object.entries(criteria)
    .map(([label, values]) => ({ label, average: values.reduce((sum, value) => sum + value, 0) / values.length }))
    .sort((a, b) => a.average - b.average)[0];
  return {
    id,
    name,
    average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    essays: scores.length,
    weakest: weakest?.label || 'Sem critério identificado'
  };
};

export const schoolPerformance = (schools, essays) => schools.map(school =>
  summarize(school.id, school.name, essays.filter(essay => (essay.school_ids || []).includes(school.id)))
);

export const classPerformance = (classes, memberships, essays) => classes.map(classroom => {
  const students = new Set(memberships
    .filter(item => item.class_id === classroom.id && item.status === 'approved')
    .map(item => item.student_id));
  return summarize(classroom.id, classroom.name, essays.filter(essay => students.has(essay.created_by_id)));
});