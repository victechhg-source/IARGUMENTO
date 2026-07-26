import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function PerformanceRanking({ title, description, items }) {
  const measured = items.filter(item => item.average !== null).sort((a, b) => a.average - b.average);
  const benchmark = measured.length
    ? Math.round(measured.reduce((sum, item) => sum + item.average, 0) / measured.length)
    : null;

  return <Card className="overflow-hidden">
    <header className="border-b border-card-foreground/15 p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-card-foreground/65">{description}</p>
    </header>
    <div className="space-y-5 p-5">
      {measured.length === 0 && <p className="py-8 text-center text-sm text-card-foreground/60">Ainda não há redações corrigidas para comparar.</p>}
      {measured.map(item => <article key={item.id}>
        <div className="mb-2 flex items-start justify-between gap-4">
          <div><h3 className="font-semibold">{item.name}</h3><p className="text-xs text-card-foreground/60">{item.essays} {item.essays === 1 ? 'redação' : 'redações'}</p></div>
          <strong className="text-xl tabular-nums">{item.average}%</strong>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/10" aria-label={`Média de ${item.average}%`}><div className="h-full rounded-full bg-card-foreground" style={{ width: `${item.average}%` }} /></div>
        <p className={`mt-2 flex items-center gap-1.5 text-xs ${item.average < benchmark ? 'font-semibold text-destructive' : 'text-card-foreground/60'}`}>
          {item.average < benchmark && <AlertTriangle className="h-3.5 w-3.5" />}Reforçar: {item.weakest}
        </p>
      </article>)}
    </div>
    {benchmark !== null && <footer className="border-t border-card-foreground/15 px-5 py-3 text-xs text-card-foreground/60">Média do grupo: <strong className="text-card-foreground">{benchmark}%</strong></footer>}
  </Card>;
}