import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Clock, CalendarDays, Layers, Timer, Sun, Ban, Flag, AlertTriangle } from 'lucide-react';

const HOURS = [1, 2, 3, 4, 5, 6];
const DAYS_WEEK = [3, 4, 5, 6, 7];
const SESSIONS = [1, 2, 3, 4, 5, 6];
const MINUTES = [25, 35, 45, 50];
const PEAKS = ['Manhã', 'Tarde', 'Noite', 'Não sei'];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function ChipGroup({ icon: Icon, options, value, onSelect, suffix }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = String(value) === String(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
          >
            {o}{suffix ? ` ${suffix}` : ''}
          </button>
        );
      })}
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="w-4 h-4 text-primary" />{label}</p>
      {children}
    </div>
  );
}

// Coleta as preferências por botões de opções fixas (não por chat).
export default function PlannerPreferences({ prefs, setPrefs }) {
  const set = (k) => (v) => setPrefs({ ...prefs, [k]: v });
  const toggleDay = (d) => {
    const cur = new Set(prefs.days || []);
    cur.has(d) ? cur.delete(d) : cur.add(d);
    setPrefs({ ...prefs, days: [...cur] });
  };

  const studyMin = (prefs.hoursPerDay || 0) * 60;
  const needMin = (prefs.sessionsPerDay || 0) * (prefs.minutesPerSession || 0);
  const inconsistent = studyMin > 0 && needMin > 0 && needMin > studyMin;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field icon={Clock} label="Horas por dia">
          <ChipGroup options={HOURS} value={prefs.hoursPerDay} onSelect={set('hoursPerDay')} suffix="h" />
        </Field>
        <Field icon={Layers} label="Blocos por dia (1 bloco = 1 matéria)">
          <ChipGroup options={SESSIONS} value={prefs.sessionsPerDay} onSelect={set('sessionsPerDay')} />
        </Field>
        <Field icon={Timer} label="Minutos por bloco">
          <ChipGroup options={MINUTES} value={prefs.minutesPerSession} onSelect={set('minutesPerSession')} suffix="min" />
        </Field>
        <Field icon={CalendarDays} label="Dias por semana">
          <ChipGroup options={DAYS_WEEK} value={prefs.daysPerWeek} onSelect={set('daysPerWeek')} />
        </Field>
      </div>

      <Field icon={CalendarDays} label="Quais dias? (opcional)">
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const active = (prefs.days || []).includes(d);
            return (
              <button key={d} type="button" onClick={() => toggleDay(d)} className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>{d}</button>
            );
          })}
        </div>
      </Field>

      <Field icon={Sun} label="Pico de concentração">
        <ChipGroup options={PEAKS} value={prefs.peakTime} onSelect={set('peakTime')} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field icon={Ban} label="Horários indisponíveis (opcional)">
          <Input value={prefs.unavailable || ''} onChange={(e) => set('unavailable')(e.target.value)} placeholder="Ex.: 14h–16h (trabalho)" />
        </Field>
        <Field icon={Flag} label="Data da prova/objetivo (opcional)">
          <Input type="date" value={prefs.examDate || ''} onChange={(e) => set('examDate')(e.target.value)} />
        </Field>
      </div>

      <Field icon={Flag} label="Observações de prioridade (opcional)">
        <Textarea value={prefs.priorityNotes || ''} onChange={(e) => set('priorityNotes')(e.target.value)} placeholder="Ex.: prova de FUVEST em 30 dias, priorizar Norma Padrão" className="min-h-20" />
      </Field>

      {inconsistent && (
        <Card className="p-4 flex items-start gap-2 border-amber-300 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {needMin} min de estudo ({prefs.sessionsPerDay} blocos × {prefs.minutesPerSession} min) excedem as {studyMin} min ({prefs.hoursPerDay}h) por dia. O agente vai ajustar automaticamente e explicar a mudança.
          </p>
        </Card>
      )}
    </div>
  );
}