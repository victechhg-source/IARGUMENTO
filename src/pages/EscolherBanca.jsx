import React from 'react';
import { Link } from 'react-router-dom';
import { BANCAS } from '@/data/bancas';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Escolha de banca do aluno — substitui a vitrine pública para usuários logados.
export default function EscolherBanca() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Escolha sua prova</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Cada banca pede uma estratégia.</h1>
        <p className="mt-2 text-muted-foreground">Selecione a sua e comece uma correção alinhada ao que o vestibular realmente avalia.</p>
      </div>
      <div className="banca-grid">
        {BANCAS.map((b) => (
          <Link key={b.id} to={`/correcao?banca=${b.id}`} className="banca-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <Image src={b.logo_url} alt={`Logo ${b.name}`} fittingType="fit" className="h-11 w-11" />
              </div>
              <div className="banca-grade"><Sparkles className="h-3 w-3" />Nota máx: {b.max_grade}</div>
            </div>
            <div className="mt-5">
              <h3 className="font-display text-2xl font-extrabold tracking-tight">{b.name}</h3>
              <p className="mt-2 max-w-sm text-sm leading-snug text-card-foreground/75">{b.description}</p>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <span className="text-xs text-card-foreground/70">{b.theme}</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}