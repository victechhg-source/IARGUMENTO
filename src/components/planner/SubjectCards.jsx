import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, AlertOctagon, ThumbsUp, BookOpen } from 'lucide-react';
import { PRIORITY_META } from '@/lib/studySubjects';

// Exibe as matérias derivadas das redações com prioridade (erro vs acerto)
// e permite ao aluno selecionar quais incluir no plano.

export default function SubjectCards({ subjects, selected, onToggle }) {
  if (!subjects.length) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Nenhuma redação corrigida ainda. Corrija redações para que o planejador derive suas matérias e prioridades automaticamente.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {subjects.map((s) => {
        const meta = PRIORITY_META[s.priority];
        const on = selected.has(s.name);
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onToggle(s.name)}
            className={`text-left rounded-3xl border p-4 transition-all ${on ? 'border-primary bg-accent/50 shadow-sm' : 'border-border bg-card hover:border-foreground/30'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold leading-tight">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.bancas.join(' · ') || 'Geral'} · {s.essays} redação(ões)</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.chip}`}>{meta.label}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-destructive"><AlertOctagon className="w-3.5 h-3.5" />{s.errors} erros</span>
              <span className="inline-flex items-center gap-1 text-green-600"><ThumbsUp className="w-3.5 h-3.5" />{s.corrects} acertos</span>
            </div>
            {s.suggestions.length > 0 && (
              <p className="mt-2 text-xs text-foreground/70 flex items-start gap-1.5"><BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" />{s.suggestions[0]}</p>
            )}
            <div className="mt-3 flex items-center justify-end">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${on ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent'}`}>
                {on && <Check className="w-4 h-4" />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}