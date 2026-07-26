import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, FileText, TrendingUp } from 'lucide-react';

export default function MetricCards({ students, essays }) {
  const average = essays.length ? Math.round(essays.reduce((sum, e) => sum + (e.final_grade / (e.max_grade || 100)) * 100, 0) / essays.length) : 0;
  const metrics = [
    { label: 'Alunos', value: students.length, icon: Users },
    { label: 'Redações', value: essays.length, icon: FileText },
    { label: 'Média da turma', value: `${average}%`, icon: TrendingUp },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{metrics.map(({ label, value, icon: Icon }) => (
    <Card key={label} className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Icon className="w-4 h-4" />{label}</div><p className="text-2xl font-bold tabular-nums">{value}</p></Card>
  ))}</div>;
}