import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Alunos aprovados sem redação (concluída) no recorte definido pelos filtros.
export default function NoEssayStudents({ students }) {
  if (!students.length) return null;
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" />Sem redação no período</h2>
      <div className="flex flex-wrap gap-2">
        {students.map((s) => (
          <span key={s.id} className="text-sm bg-muted px-3 py-1.5 rounded-full">{s.name}</span>
        ))}
      </div>
    </Card>
  );
}