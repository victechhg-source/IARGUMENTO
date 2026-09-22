import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, CalendarRange, BookMarked, History, ArrowUpRight } from 'lucide-react';

// Tela inicial do aluno: bento arrojado com 4 blocos gigantes em degradê laranja.
const TOOLS = [
  {
    to: '/nova-redacao',
    icon: Plus,
    title: 'Nova redação',
    subtitle: 'Envie e receba a correção da banca',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #E9861A 55%, #B45309 100%)',
  },
  {
    to: '/planner',
    icon: CalendarRange,
    title: 'Planner',
    subtitle: 'Monte sua rotina de estudos',
    gradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  },
  {
    to: '/exam-guides',
    icon: BookMarked,
    title: 'Bancas',
    subtitle: 'Critérios e arquitetura de correção',
    gradient: 'linear-gradient(135deg, #E9861A 0%, #9A3412 100%)',
  },
  {
    to: '/historico',
    icon: History,
    title: 'Histórico',
    subtitle: 'Suas redações, notas e evolução',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #C2410C 100%)',
  },
];

export default function StudentHome() {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    base44.auth.me()
      .then((u) => setFirstName((u?.display_name || u?.full_name || '').split(' ')[0]))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col gap-3 px-4 pt-5 pb-4 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">IArgumento</p>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            {firstName ? `Olá, ${firstName}` : 'Bem-vindo'}
          </h1>
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground">Escolha por onde começar</p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-3xl p-7 text-white shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-0"
            style={{ background: t.gradient }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
            <div className="relative flex items-start justify-between">
              <t.icon className="h-10 w-10" strokeWidth={1.5} />
              <ArrowUpRight className="h-6 w-6 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-90" strokeWidth={1.75} />
            </div>
            <div className="relative">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t.title}</h2>
              <p className="mt-1 text-sm text-white/80">{t.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}