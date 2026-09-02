import React, { useState } from 'react';
import { BANCAS } from '@/data/bancas';
import { Image } from '@/components/ui/image';
import BancaGuide from '@/components/bancas/BancaGuide';
import { BookMarked, ChevronRight } from 'lucide-react';

// Guia de Bancas: página de referência com critérios, pesos e manuais de
// correção de cada banca vestibular (ENEM, FUVEST, UFU, UniRV, etc.) para
// consulta rápida dos alunos. Acessível a todos os perfis autenticados.
export default function GuiaBancas() {
  const [selectedId, setSelectedId] = useState(BANCAS[0].id);
  const selected = BANCAS.find((b) => b.id === selectedId) || BANCAS[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-start gap-3">
        <div className="kinetic-icon shrink-0">
          <BookMarked className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Guia de Bancas</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Consulte os critérios oficiais, pesos, manuais de correção e a grade específica
            aplicada pela Escola Argumento em cada banca vestibular.
          </p>
        </div>
      </header>

      {/* Cards selecionáveis por banca */}
      <div className="banca-grid mt-8">
        {BANCAS.map((b) => {
          const active = b.id === selectedId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedId(b.id)}
              aria-pressed={active}
              className={`banca-card text-left ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={b.logo_url}
                  alt={b.name}
                  fittingType="fit"
                  className="h-12 w-12 rounded-xl border border-border bg-white p-1"
                />
                <div className="min-w-0">
                  <h3 className="font-display font-bold tracking-tight truncate">{b.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{b.full_name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="banca-grade">Nota máx. {b.max_grade}</span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${active ? 'translate-x-0.5' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhe da banca selecionada */}
      <div className="mt-10">
        <BancaGuide banca={selected} />
      </div>
    </main>
  );
}