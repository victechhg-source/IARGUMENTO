import React from 'react';
import { Sparkles, X, AlertOctagon, ThumbsUp } from 'lucide-react';
import { PRIORITY_META, SUGGESTION_META } from '@/lib/studySubjects';

// Cartão de matéria usado nas áreas de arrastar-soltar. Mostra prioridade,
// badge de "sugerido" (foco/reforço/revisão) e contagem erro×acerto.
export default function SubjectChip({ subject, inBox, dragging, onRemove }) {
  const meta = PRIORITY_META[subject.priority];
  const sug = subject.suggested && subject.suggestionTag ? SUGGESTION_META[subject.suggestionTag] : null;
  return (
    <div className={`relative rounded-2xl border p-3 transition-shadow ${inBox ? 'border-primary/40 bg-card' : 'border-border bg-card'} ${dragging ? 'shadow-lg ring-2 ring-primary/40' : ''} ${sug ? 'ring-1 ring-primary/30' : ''}`}>
      {onRemove && (
        <button type="button" onClick={onRemove} className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remover da caixa">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="pr-6">
        <p className="font-semibold leading-tight">{subject.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subject.bancas.join(' · ') || 'Geral'} · {subject.essays} red.</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}>{meta.label}</span>
        {sug && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${sug.chip}`}>
            <Sparkles className="w-3 h-3" />{sug.label}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1 text-destructive"><AlertOctagon className="w-3 h-3" />{subject.errors} erros</span>
        <span className="inline-flex items-center gap-1 text-green-600"><ThumbsUp className="w-3 h-3" />{subject.corrects} acertos</span>
      </div>
    </div>
  );
}