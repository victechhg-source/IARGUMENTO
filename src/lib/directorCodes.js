/**
 * Códigos visíveis no painel do diretor. PRO/DIR ficam só com o admin.
 * @param {object|null} school
 * @returns {{ student_code: string, code: string, name: string, id: string }}
 */
export function directorVisibleSchool(school) {
  if (!school) return { id: '', name: '', code: '', student_code: '' };
  return {
    id: school.id || '',
    name: school.name || '',
    code: school.code || school.institutional_code || '',
    student_code: school.student_code || '',
  };
}
