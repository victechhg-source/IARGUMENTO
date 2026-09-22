import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, ListChecks, Info } from 'lucide-react';

// Resumo do plano: lógica aplicada, checklist semanal e observações.
export default function PlanSummary({ plan }) {
  if (!plan) return null;
  return (
    <div className="space-y-4">
      {plan.summary && (
        <Card className="p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="w-4 h-4 text-primary" /> Lógica do plano</h3>
          <p className="text-sm text-foreground/80">{plan.summary}</p>
          {plan.principles_applied?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.principles_applied.map((p, i) => (
                <span key={i} className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">{p}</span>
              ))}
            </div>
          )}
        </Card>
      )}
      {plan.weekly_review_checklist?.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="w-4 h-4 text-primary" /> Checklist de revisão semanal</h3>
          <ul className="space-y-2">
            {plan.weekly_review_checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-4 w-4 shrink-0 rounded border border-border" />
                <span className="text-foreground/80">{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {plan.notes && (
        <Card className="p-5 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">{plan.notes}</p>
        </Card>
      )}
    </div>
  );
}