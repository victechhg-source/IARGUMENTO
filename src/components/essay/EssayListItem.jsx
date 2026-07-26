import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronRight, Calendar } from 'lucide-react';
import { BANCAS } from '@/data/bancas';

export default function EssayListItem({ essay }) {
  const banca = BANCAS.find(b => b.id === essay.banca);
  const maxGrade = essay.max_grade || banca?.max_grade || 100;
  const percentage = essay.final_grade ? Math.round((essay.final_grade / maxGrade) * 100) : 0;
  const date = new Date(essay.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Link to={`/historico/${essay.id}`}>
      <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: banca?.color }}>
          <span className="text-white font-bold text-xs">{banca?.name.slice(0, 3)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{banca?.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {date}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: banca?.color }}>{essay.final_grade}/{maxGrade}</p>
          <p className="text-xs text-muted-foreground">{percentage}%</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </Card>
    </Link>
  );
}