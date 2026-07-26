import React from 'react';
import { School, Users, GraduationCap, BookOpen, Coins } from 'lucide-react';

export default function AdminMetricCards({ schools, teachers, students, classes, tokens }) {
  const items = [
    ['Escolas', schools, School], ['Professores', teachers, Users], ['Alunos', students, GraduationCap],
    ['Turmas', classes, BookOpen], ['Consumo estimado', tokens.toLocaleString('pt-BR'), Coins]
  ];
  return <div className="admin-metric-grid">
    {items.map(([label, value, Icon]) => <div key={label} className="admin-metric">
      <div className="kinetic-icon"><Icon className="h-4 w-4" aria-hidden="true" /></div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-card-foreground/65">{label}</p>
    </div>)}
  </div>;
}