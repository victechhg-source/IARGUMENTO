import React, { useState } from 'react';
import { Clock, Coffee, ChevronDown, Flame, BookOpen, TrendingUp } from 'lucide-react';

const PRIORITY = {
  alta: { bar: 'border-l-primary', chip: 'text-primary', icon: Flame, label: 'Alta' },
  media: { bar: 'border-l-chart-2', chip: 'text-chart-2', icon: BookOpen, label: 'Média' },
  baixa: { bar: 'border-l-violet-500', chip: 'text-violet-600', icon: TrendingUp, label: 'Revisão' },
};
const norm = (p) => (typeof p === 'string' ? p.toLowerCase() : '');

// Cartão de bloco: compacto por padrão (horário, tema, banca, prioridade),
// expansível ao clicar para ver foco, divisão de atividade e pausa.
export default function SessionCard({ block, time, banca }) {
  const [open, setOpen] = useState(false);
  const pr = PRIORITY[norm(block.priority)] || PRIORITY.media;
  const Icon = pr.icon;
  return (
    <div className={`rounded-2xl border border-border border-l-4 ${pr.bar} bg-card shadow-sm`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground">{time}</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${pr.chip}`}><Icon className="w-3 h-3" />{pr.label}</span>
        </div>
        <p className="mt-1 font-semibold leading-tight line-clamp-2">{block.subject}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {banca && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{banca}</span>}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" />{block.duration_min}min</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5 text-xs text-foreground/80">
          {block.focus && <p><span className="font-semibold">Foco:</span> {block.focus}</p>}
          {block.activity_split && <p className="flex items-center gap-1"><Coffee className="w-3 h-3" />{block.activity_split}</p>}
          {block.break_min ? <p><span className="font-semibold">Pausa:</span> {block.break_min} min</p> : null}
        </div>
      )}
    </div>
  );
}