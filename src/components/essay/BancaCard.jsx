import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';

export default function BancaCard({ banca }) {
  const navigate = useNavigate();
  const openBanca = () => navigate(`/correcao?banca=${banca.id}`);

  return (
    <article className="banca-card group" onClick={openBanca} onKeyDown={(event) => event.key === 'Enter' && openBanca()} role="button" tabIndex={0}>
      <div className="flex items-start justify-between gap-4">
        <div className="banca-mark" style={{ backgroundColor: banca.color }}>{banca.name.slice(0, 3)}</div>
        <div className="banca-grade"><MapPin className="h-3 w-3" />Nota máx: {banca.max_grade}</div>
      </div>
      <div className="mt-5">
        <h3 className="font-display text-2xl font-extrabold tracking-tight">{banca.name}</h3>
        <p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{banca.description}</p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <span className="text-xs text-card-foreground/70">{banca.theme}</span>
        <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </article>
  );
}