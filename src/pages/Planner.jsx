import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, ChevronRight, RefreshCw, CalendarRange, ListChecks } from 'lucide-react';
import { deriveStudySubjects } from '@/lib/studySubjects';
import SubjectBoard from '@/components/planner/SubjectBoard';
import PlannerPreferences from '@/components/planner/PlannerPreferences';
import WeeklyPlanGrid from '@/components/planner/WeeklyPlanGrid';
import PlanSummary from '@/components/planner/PlanSummary';

const STEPS = ['Perfil', 'Preferências', 'Plano'];

export default function Planner() {
  const [essays, setEssays] = useState(null);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState([]);
  const [prefs, setPrefs] = useState({ hoursPerDay: 2, daysPerWeek: 5, sessionsPerDay: 3, minutesPerSession: 35, peakTime: 'Manhã', days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] });
  const [plan, setPlan] = useState(null);
  const [planMeta, setPlanMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.Essay.filter({ status: 'completed' }, '-created_date', 100)
      .then(setEssays)
      .catch(() => setEssays([]));
    base44.auth.me()
      .then((me) => {
        const saved = me?.planner_plan;
        if (saved?.plan) {
          setPlan(saved.plan);
          setPlanMeta({ peakTime: saved.peakTime, subjects: saved.subjects, createdAt: saved.createdAt });
          setStep(2);
        }
      })
      .catch(() => {});
  }, []);

  const subjects = useMemo(() => deriveStudySubjects(essays || []), [essays]);
  const subjectBanca = useMemo(() => {
    const m = {};
    (planMeta?.subjects || []).forEach((s) => { m[s.name] = (s.bancas && s.bancas[0]) || ''; });
    return m;
  }, [planMeta]);

  // Pré-popula a caixa com as matérias sugeridas pelo planejador (foco,
  // reforço e revisão) — o aluno não começa do zero e não esquece revisões.
  useEffect(() => {
    if (subjects.length && box.length === 0) {
      setBox(subjects.filter((s) => s.suggested).map((s) => s.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const generate = async () => {
    if (plan && !window.confirm('Você já tem um plano ativo. Criar um novo vai sobrescrevê-lo. Continuar?')) return;
    setError('');
    setLoading(true);
    setPlan(null);
    try {
      const res = await base44.functions.invoke('generateStudyPlan', {
        preferences: prefs,
        selectedSubjectNames: box,
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      const meta = { peakTime: prefs.peakTime, subjects: data.subjects, createdAt: new Date().toISOString() };
      await base44.auth.updateMe({ planner_plan: { plan: data.plan, ...meta } });
      setPlan(data.plan);
      setPlanMeta(meta);
      setStep(2);
    } catch (e) {
      setError(e?.message || 'Erro ao gerar o plano.');
    } finally {
      setLoading(false);
    }
  };

  if (essays === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">IArgumento</p>
        <h1 className="font-display text-xl font-extrabold tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Planner de estudos</h1>
        <p className="text-sm text-muted-foreground mt-1">Monte sua rotina semanal com base nas suas redações. O agente prioriza o que você mais erra.</p>
      </div>

      {step < 2 && (
        <div className="flex items-center gap-2 text-xs font-semibold">
          {STEPS.slice(0, 2).map((s, i) => (
            <span key={s} className={`rounded-full px-3 py-1 ${step === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}. {s}</span>
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-1"><CalendarRange className="w-4 h-4 text-primary" /> Monte sua caixa de matérias</h2>
            <p className="text-xs text-muted-foreground mb-4">Arraste as matérias para "Minhas matérias". As marcadas como <span className="font-semibold text-primary">sugeridas</span> já começam na caixa — incluindo revisões, pra você não focar só no que erra mais.</p>
            <SubjectBoard subjects={subjects} value={box} onChange={setBox} />
          </Card>
          <div className="flex justify-end">
            <Button disabled={!box.length} onClick={() => setStep(1)}>Continuar <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-5 space-y-1">
            <h2 className="font-semibold text-sm flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" /> Preferências de estudo</h2>
            <p className="text-xs text-muted-foreground">Toque nas opções para montar sua rotina.</p>
          </Card>
          <PlannerPreferences prefs={prefs} setPrefs={setPrefs} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
            <Button onClick={generate} disabled={loading || !box.length}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Montando seu plano…' : 'Gerar plano'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && plan && (
        <div className="space-y-5">
          {planMeta?.createdAt && (
            <p className="text-xs text-muted-foreground">Plano ativo · gerado em {new Date(planMeta.createdAt).toLocaleDateString('pt-BR')}.</p>
          )}
          <PlanSummary plan={plan} />
          <div>
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-primary" /> Cronograma da semana</h2>
            <WeeklyPlanGrid days={plan.days} peakTime={planMeta?.peakTime} subjectBanca={subjectBanca} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><RefreshCw className="w-4 h-4" /> Ajustar preferências</Button>
            <Button onClick={generate} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {loading ? 'Remontando…' : 'Gerar novamente'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}