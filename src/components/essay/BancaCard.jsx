import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ArrowRight, Award } from 'lucide-react';

export default function BancaCard({ banca }) {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-2"
      onClick={() => navigate(`/correcao?banca=${banca.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: banca.color }}>
          <span className="text-white font-bold text-sm">{banca.name.slice(0, 3)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
          <Award className="w-3 h-3" />
          Nota máx: {banca.max_grade}
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1">{banca.name}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{banca.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{banca.theme}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  );
}