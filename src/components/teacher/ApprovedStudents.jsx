import React from 'react';
import StudentRow from '@/components/teacher/StudentRow';
import { UserMinus } from 'lucide-react';

// Lista de alunos aprovados ordenada, com ação de remover (status 'removed').
export default function ApprovedStudents({ students, onRemove }) {
  return (
    <section>
      <h2 className="font-semibold mb-3">Alunos da turma</h2>
      <div className="space-y-2">
        {students.map(({ membership, essays }) => (
          <div key={membership.id} className="relative group">
            <StudentRow membership={membership} essays={essays} />
            <button
              type="button"
              onClick={() => onRemove(membership.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
              aria-label="Remover aluno"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!students.length && <p className="text-sm text-muted-foreground">Nenhum aluno aprovado nesta turma.</p>}
      </div>
    </section>
  );
}