import React from 'react';
import { Card } from '@/components/ui/card';

// Acesso completo do admin: lista todas as turmas (Classroom) e seus membros.
// Buckets: approved / pending; rejected e removed contam apenas como "inativos".
export default function ClassesTab({ classes = [], memberships = [] }) {
  const byClass = {};
  memberships.forEach((m) => {
    (byClass[m.class_id] ||= { approved: [], pending: [], inactive: 0 });
    if (m.status === 'approved') byClass[m.class_id].approved.push(m);
    else if (m.status === 'pending') byClass[m.class_id].pending.push(m);
    else byClass[m.class_id].inactive += 1;
  });

  if (!classes.length) return <Card className="p-5 text-sm text-muted-foreground">Nenhuma turma criada ainda.</Card>;

  return (
    <div className="space-y-4">
      {classes.map((c) => {
        const m = byClass[c.id] || { approved: [], pending: [], inactive: 0 };
        const all = [...m.approved, ...m.pending];
        return (
          <Card key={c.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm">{c.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Código: <span className="font-mono">{c.code}</span> · Professor: {c.teacher_name || '—'}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold text-blue-800">{m.approved.length} aprovados</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">{m.pending.length} pendentes</span>
                {m.inactive > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600">{m.inactive} inativos</span>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {all.map((mem) => (
                <div key={mem.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                  <span className="truncate">{mem.student_name || mem.student_email || '—'}</span>
                  <span className={mem.status === 'approved' ? 'font-semibold text-blue-700' : 'font-semibold text-amber-700'}>
                    {mem.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </span>
                </div>
              ))}
              {!all.length && <p className="text-xs text-muted-foreground">Sem alunos nesta turma.</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}