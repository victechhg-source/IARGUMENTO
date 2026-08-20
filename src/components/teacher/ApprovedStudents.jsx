import React, { useState } from 'react';
import StudentRow from '@/components/teacher/StudentRow';
import { UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Lista de alunos aprovados ordenada, com ação de remover (status 'removed').
export default function ApprovedStudents({ students, onRemove }) {
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const remove = async (membership) => {
    if (busyId) return;
    if (!window.confirm(`Remover ${membership.student_name || 'este aluno'} da turma? Ele perderá o vínculo com você.`)) return;
    setBusyId(membership.id);
    try {
      await onRemove(membership.id);
    } catch {
      toast({ title: 'Não foi possível remover o aluno. Tente novamente.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <h2 className="font-semibold mb-3">Alunos da turma</h2>
      <div className="space-y-2">
        {students.map(({ membership, essays }) => (
          <div key={membership.id} className="relative group">
            <StudentRow membership={membership} essays={essays} />
            <button
              type="button"
              onClick={() => remove(membership)}
              disabled={!!busyId}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 disabled:opacity-50"
              aria-label="Remover aluno"
            >
              {busyId === membership.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            </button>
          </div>
        ))}
        {!students.length && <p className="text-sm text-muted-foreground">Nenhum aluno aprovado nesta turma.</p>}
      </div>
    </section>
  );
}
