import React from 'react';
import { KeyRound } from 'lucide-react';

const ITEMS = [
  ['Aluno', 'student_code'],
  ['Professor', 'teacher_code'],
  ['Diretor', 'director_code'],
];

// Códigos de acesso por papel: é o código digitado que define o perfil no cadastro.
export default function SchoolCodes({ school }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {ITEMS.map(([label, field]) => (
        <div key={field} className="rounded-2xl bg-muted px-3 py-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <KeyRound className="h-3 w-3" />
            {label}
          </p>
          <code className="text-sm font-bold tracking-wider">{school[field] || '—'}</code>
        </div>
      ))}
    </div>
  );
}