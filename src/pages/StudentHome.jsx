import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Plus, CalendarRange, BookMarked, History, ArrowRight, Sparkles } from 'lucide-react';
import { BANCAS } from '@/data/bancas';

const TOOLS = [
  { to: '/nova-redacao', icon: Plus, title: 'Nova redação', desc: 'Envie uma redação e receba a correção completa da banca escolhida.', accent: 'bg-primary text-primary-foreground' },
  { to: '/planner', icon: CalendarRange, title: 'Planner de estudos', desc: 'Monte sua rotina semanal com base nos seus erros.', accent: 'bg-chart-2 text-white' },
  { to: '/exam-guides', icon: BookMarked, title: 'Bancas', desc: 'Consulte critérios e a arquitetura de correção de cada banca.', accent: 'bg-chart-3 text-white' },
  { to: '/historico', icon: History, title: 'Histórico', desc: 'Revise suas redações, notas e evolução por banca.', accent: 'bg-chart-5 text-white' },
];

// Tela inicial do aluno: convidativa, com grandes botões para as ferramentas.
export default function StudentHome() {
  const [me, setMe] = useState(null);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setMe(u); if (u?.planner_plan?.plan) setHasPlan(true); })
      .catch(() => {});
  }, []);

  const firstName = (me?.display_name || me?.full_name || '').split(' ')[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">IArgumento</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{firstName ? `Olá, ${firstName}` : 'Bem-vindo'}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">Pronto para evoluir sua redação? Escolha por onde começar.</p>
      </section>

      {hasPlan && (
        <Link to="/planner" className="block">
          <Card className="p-5 flex items-center gap-3 border-primary/30 bg-accent/40 hover:shadow-md transition-shadow">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Você tem um plano de estudos ativo</p>
              <p className="text-xs text-muted-foreground">Continue de onde parou no planner.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </Card>
        </Link>
      )}

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => (
            <Link key={t.to} to={t.to}>
              <Card className="group p-6 min-h-44 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.accent}`}><t.icon className="w-6 h-6" /></div>
                <div className="mt-4">
                  <h2 className="font-display text-lg font-extrabold tracking-tight flex items-center gap-2">
                    {t.title}
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-snug max-w-xs">{t.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Bancas disponíveis</p>
        <div className="flex flex-wrap gap-2">
          {BANCAS.slice(0, 6).map((b) => (
            <Link key={b.id} to="/exam-guides" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-foreground/30 transition-colors">{b.name}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}