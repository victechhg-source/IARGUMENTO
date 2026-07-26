import React from 'react';
import { Card } from '@/components/ui/card';
import { School, Users, GraduationCap, BookOpen, Coins } from 'lucide-react';

export default function AdminMetricCards({ schools, teachers, students, classes, tokens }) {
  const items = [
    ['Escolas', schools, School], ['Professores', teachers, Users], ['Alunos', students, GraduationCap],
    ['Turmas', classes, BookOpen], ['Tokens estimados', tokens.toLocaleString('pt-BR'), Coins]
  ];
  return <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{items.map(([label, value, Icon]) => <Card key={label} className="p-4"><Icon className="w-4 h-4 text-muted-foreground mb-3" /><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-sm text-muted-foreground">{label}</p></Card>)}</div>;
}