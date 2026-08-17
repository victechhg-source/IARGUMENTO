import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, Layers, FileText, Clock, TrendingUp } from 'lucide-react';

const ITEMS = [
  { key: 'students', label: 'Alunos ativos', icon: Users },
  { key: 'teachers', label: 'Professores', icon: GraduationCap },
  { key: 'classes', label: 'Turmas', icon: Layers },
  { key: 'essays', label: 'Redações', icon: FileText },
  { key: 'pending', label: 'Solicitações', icon: Clock },
  { key: 'avgPercent', label: 'Média geral', icon: TrendingUp, suffix: '%' },
];

export default function SchoolMetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {ITEMS.map(({ key, label, icon: Icon, suffix }) => {
        const value = metrics?.[key];
        return (
          <Card key={key} className="p-4">
            <Icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {value === null || value === undefined ? '—' : `${value}${suffix || ''}`}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        );
      })}
    </div>
  );
}