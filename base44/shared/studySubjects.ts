// Deriva as "matérias" de estudo do aluno a partir das correções das suas
// redações. Cada competência (stage) vira uma matéria, com prioridade baseada
// na razão erro/acerto. Sugestões de estudo/escrita das redações com erro na
// competência viram focos sugeridos. Usado por generateStudyPlan (backend).

export interface StudySubject {
  name: string;
  essays: number;
  bancas: string[];
  errors: number;
  corrects: number;
  warnings: number;
  priority: 'alta' | 'media' | 'baixa';
  suggestions: string[];
}

export function deriveStudySubjects(essays: any[]): StudySubject[] {
  const map: Record<string, {
    name: string; essays: Set<string>; bancas: Set<string>;
    errors: number; corrects: number; warnings: number; suggestions: string[];
  }> = {};

  for (const e of essays) {
    if (!e || e.status !== 'completed') continue;
    const stages = Array.isArray(e.corrections) ? e.corrections : [];
    for (const st of stages) {
      const name = st?.stage || 'Geral';
      if (!map[name]) map[name] = { name, essays: new Set(), bancas: new Set(), errors: 0, corrects: 0, warnings: 0, suggestions: [] };
      const s = map[name];
      s.essays.add(e.id);
      if (e.banca) s.bancas.add(e.banca);
      for (const f of (st?.findings || [])) {
        if (f?.type === 'error') s.errors++;
        else if (f?.type === 'correct') s.corrects++;
        else if (f?.type === 'warning') s.warnings++;
      }
    }
    for (const st of stages) {
      const name = st?.stage || 'Geral';
      const hadError = (st?.findings || []).some((f: any) => f?.type === 'error');
      if (!hadError) continue;
      const s = map[name];
      for (const sug of (Array.isArray(e.study_suggestions) ? e.study_suggestions : [])) {
        if (typeof sug === 'string' && !s.suggestions.includes(sug)) s.suggestions.push(sug);
      }
      for (const sug of (Array.isArray(e.writing_suggestions) ? e.writing_suggestions : [])) {
        if (typeof sug === 'string' && !s.suggestions.includes(sug)) s.suggestions.push(sug);
      }
    }
  }

  const subjects = Object.values(map).map((s) => {
    const total = s.errors + s.corrects + s.warnings;
    const ratio = total ? s.errors / total : 0;
    let priority: 'alta' | 'media' | 'baixa';
    if (s.errors >= 2 && ratio >= 0.5) priority = 'alta';
    else if (s.errors >= 1 && ratio >= 0.25) priority = 'media';
    else priority = 'baixa';
    return {
      name: s.name,
      essays: s.essays.size,
      bancas: [...s.bancas],
      errors: s.errors,
      corrects: s.corrects,
      warnings: s.warnings,
      priority,
      suggestions: s.suggestions.slice(0, 4),
    };
  });

  const order = { alta: 0, media: 1, baixa: 2 };
  subjects.sort((a, b) => order[a.priority] - order[b.priority] || b.errors - a.errors);
  return subjects;
}