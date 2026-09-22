import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, CalendarRange, BookMarked, History, ArrowRight } from 'lucide-react';

// Tela inicial — design minimalista inspirado na Apple: muito respiro,
// tipografia pesada, superfícies limpas e um único acento laranja da marca.
const TOOLS = [
  { to: '/nova-redacao', icon: Plus, title: 'Nova redação', subtitle: 'Envie sua redação e receba a correção completa da banca.' },
  { to: '/planner', icon: CalendarRange, title: 'Planner', subtitle: 'Monte sua rotina de estudos com base nos seus erros.' },
  { to: '/exam-guides', icon: BookMarked, title: 'Bancas', subtitle: 'Critérios e arquitetura de correção de cada banca.' },
  { to: '/historico', icon: History, title: 'Histórico', subtitle: 'Suas redações, notas e evolução por banca.' },
];

export default function StudentHome() {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    base44.auth.me()
      .then((u) => setFirstName((u?.display_name || u?.full_name || '').split(' ')[0]))
      .catch(() => {});
  }, []);

  return (
    <div className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      {/* brilho suave de fundo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-accent/60 to-transparent blur-2xl" />

      <header className="mb-10 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">IArgumento</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {firstName ? `Olá, ${firstName}.` : 'Bem-vindo.'}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          Pronto para evoluir sua redação? Escolha por onde começar.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group relative flex min-h-[200px] flex-col justify-between rounded-[1.75rem] border border-border/60 bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(140deg, #FBBF24 0%, #F97316 100%)' }}
              >
                <t.icon className="h-7 w-7" strokeWidth={1.6} />
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <div className="mt-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                {t.title}
              </h2>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}