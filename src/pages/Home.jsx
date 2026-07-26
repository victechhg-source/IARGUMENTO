import React from 'react';
import { BANCAS } from '@/data/bancas';
import BancaCard from '@/components/essay/BancaCard';
import KineticFeatureGrid from '@/components/home/KineticFeatureGrid';
import { PenLine, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import AccountNav from '@/components/account/AccountNav';

export default function Home() {
  const orderedBancas = [BANCAS[0], BANCAS[1], BANCAS[3], BANCAS[2], BANCAS[4]];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 text-center md:px-12 md:pt-12">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/60 px-4 py-1.5 text-xs font-medium">
          <PenLine className="h-3.5 w-3.5" />
          Critério de banca, leitura de verdade
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-[-0.055em] md:text-6xl">RedaçãoPro</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-xl">
          Sua redação manuscrita, analisada com os critérios de cada vestibular. Revise a transcrição e receba orientações claras para avançar.
        </p>
        <nav className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2" aria-label="Atalhos da conta">
          <Link to="/historico" className="kinetic-link"><History className="h-4 w-4" />Ver meu histórico</Link>
          <AccountNav />
        </nav>
        <KineticFeatureGrid />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-12">
        <header className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Escolha sua banca</h2>
          <p className="mt-2 text-sm text-foreground/70 md:text-base">Cada banca tem critérios próprios. Selecione a sua para começar.</p>
        </header>
        <div className="banca-grid">
          {orderedBancas.map((banca) => <BancaCard key={banca.id} banca={banca} />)}
        </div>
      </section>
    </main>
  );
}