import React from 'react';
import SessionCard from '@/components/planner/SessionCard';

const START = { Manhã: 8, Tarde: 14, Noite: 19 };
const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// Calcula o horário de cada bloco do dia a partir do pico de concentração,
// somando duração + pausa. Devolve um range "HH:MM–HH:MM" por bloco.
function timesForDay(sessions, peakTime) {
  let h = START[peakTime] ?? 8;
  let m = 0;
  return (sessions || []).map((s) => {
    const dur = s.duration_min || 30;
    const brk = s.break_min || 5;
    const sH = h, sM = m;
    let eH = h, eM = m + dur;
    while (eM >= 60) { eM -= 60; eH += 1; }
    const range = `${fmt(sH, sM)}–${fmt(eH, eM)}`;
    let nH = eH, nM = eM + brk;
    while (nM >= 60) { nM -= 60; nH += 1; }
    h = nH; m = nM;
    return range;
  });
}

// Grade semanal compacta: uma coluna por dia, blocos expansíveis.
export default function WeeklyPlanGrid({ days, peakTime, subjectBanca = {} }) {
  if (!days || !days.length) return null;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid auto-cols-[minmax(12rem,1fr)] grid-flow-col gap-3 min-w-min">
        {days.map((d, di) => {
          const sessions = d.sessions || [];
          const times = timesForDay(sessions, peakTime);
          return (
            <div key={di} className="rounded-3xl border border-border bg-card p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display font-extrabold tracking-tight">{d.day}</h3>
                <span className="text-[11px] font-semibold text-muted-foreground">{sessions.length} blocos</span>
              </div>
              {sessions.map((s, si) => (
                <SessionCard key={si} block={s} time={times[si]} banca={subjectBanca[s.subject]} />
              ))}
              {sessions.length === 0 && <p className="text-xs text-muted-foreground px-1 py-2">Descanso / revisão livre.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}