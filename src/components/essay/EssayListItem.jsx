import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { BANCAS } from '@/data/bancas';
import { Image } from '@/components/ui/image';

const FALLBACK_LOGO = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/8aa46b329_image.png';

export default function EssayListItem({ essay, onDelete }) {
  const navigate = useNavigate();
  const banca = BANCAS.find((b) => b.id === essay.banca);
  const maxGrade = essay.max_grade || banca?.max_grade || 100;
  const percentage = essay.final_grade ? Math.round(essay.final_grade / maxGrade * 100) : 0;
  const date = new Date(essay.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const open = () => navigate(`/historico/${essay.id}`);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!window.confirm('Excluir esta redação do histórico? Esta ação não pode ser desfeita.')) return;
    onDelete?.(essay.id);
  };

  return (
    <Card onClick={open} className="p-0 overflow-hidden cursor-pointer transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-accent ring-1 ring-border">
          <Image src={banca?.logo_url || FALLBACK_LOGO} alt={`Logo ${banca?.name}`} fittingType="fit" className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{banca?.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {date}
          </p>
        </div>
        <div className="text-right">
          {essay.status === 'completed' ?
          <>
              <p className="font-bold text-sm bg-[#ffffff]" style={{ color: banca?.color }}>{essay.final_grade}/{maxGrade}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </> :

          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium">Em andamento</span>
          }
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <button
          type="button"
          onClick={handleDelete}
          title="Excluir redação"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>);

}