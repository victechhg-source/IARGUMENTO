import React from 'react';
import PerformanceRanking from '@/components/admin/PerformanceRanking';
import { classPerformance, schoolPerformance } from '@/components/admin/performanceData';

export default function PerformanceComparison({ schools, memberships, classes, essays }) {
  const schoolItems = schoolPerformance(schools, essays);
  const classItems = classPerformance(classes, memberships, essays);

  return <section>
    <header className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">Desempenho acadêmico</p>
      <h2 className="mt-1 font-display text-2xl font-bold">Comparativo de resultados</h2>
      <p className="mt-2 max-w-2xl text-sm text-foreground/65">As notas são convertidas para uma escala de 0 a 100 para permitir a comparação entre diferentes bancas.</p>
    </header>
    <div className="grid gap-5 lg:grid-cols-2">
      <PerformanceRanking title="Escolas" description="Prioridades aparecem primeiro." items={schoolItems} />
      <PerformanceRanking title="Turmas" description="Prioridades aparecem primeiro." items={classItems} />
    </div>
  </section>;
}