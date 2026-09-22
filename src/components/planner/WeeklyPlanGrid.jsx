import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Coffee, Flame, TrendingUp, BookOpen } from 'lucide-react';

const PRIORITY_STYLE = {
  alta: { ring: 'border-l-primary', chip: 'text-primary', label: 'Alta' },
  media: { ring: 'border-l-chart-2', chip: 'text-chart-2', label: 'Média' },
  baixa: { ring: 'border-l-muted-foreground', chip: 'text-muted-foreground', label: 'Revisão' },
};
const normPriority = (p) => (typeof p === 'string' ? p.toLowerCase() : '');

// Grade visual semanal: uma coluna por dia, sessões como blocos coloridos por
// prioridade. Layout responsivo (scroll horizontal no mobile).
export default function WeeklyPlanGrid({ days }) {
  if (!days || !days.length) return null;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 min-w-min">
        {days.map((d, di) => (
          <div key={di} className="rounded-3xl border border-border bg-card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display font-extrabold tracking-tight">{d.day}</h3>
              <span className="text-[11px] font-semibold text-muted-foreground">{(d.sessions || []).length} sessões</span>
            </div>
            {(d.sessions || []).map((s, si) => {
              const style = PRIORITY_STYLE[normPriority(s.priority)] || PRIORITY_STYLE.media;
              return (
                <div key={si} className={`rounded-2xl border border-border border-l-4 ${style.ring} bg-background p-3 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">Sessão {s.session ?? si + 1}</span>
                    {s.priority && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${style.chip}`}>
                        {normPriority(s.priority) === 'alta' ? <Flame className="w-3 h-3" /> : normPriority(s.priority) === 'baixa' ? <TrendingUp className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        {style.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold leading-tight">{s.subject}</p>
                  {s.focus && <p className="mt-0.5 text-xs text-foreground/70">{s.focus}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_min} min</span>
                    {s.break_min ? <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3" />{s.break_min} min pausa</span> : null}
                  </div>
                  {s.activity_split && <p className="mt-1.5 text-[11px] text-foreground/60">{s.activity_split}</p>}
                </div>
              );
            })}
            {!(d.sessions || []).length && <p className="text-xs text-muted-foreground px-1 py-2">Descanso / revisão livre.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}