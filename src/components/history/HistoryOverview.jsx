import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Star, BarChart3, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BANCAS } from '@/data/bancas';

function shortDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function avgPct(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, e) => s + (e.final_grade / (e.max_grade || 100)) * 100, 0) / arr.length);
}

export default function HistoryOverview({ essays }) {
  const counts = BANCAS.map((b) => ({ name: b.name, total: essays.filter((e) => e.banca === b.id).length }));
  const top = counts.reduce((a, b) => (b.total > a.total ? b : a), counts[0] || { name: '—', total: 0 });

  const completed = essays
    .filter((e) => e.status === 'completed' && typeof e.final_grade === 'number' && e.max_grade)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const evolution = completed.map((e) => ({
    date: shortDate(e.created_date),
    percentage: Math.round((e.final_grade / e.max_grade) * 100),
  }));

  // Tendência geral: média da 1ª metade vs 2ª metade das concluídas.
  let trend = '—';
  if (completed.length >= 2) {
    const half = Math.max(1, Math.floor(completed.length / 2));
    const firstAvg = avgPct(completed.slice(0, half));
    const secondAvg = avgPct(completed.slice(half));
    const diff = secondAvg - firstAvg;
    trend = Math.abs(diff) < 3 ? 'Estável' : diff > 0 ? 'Em alta' : 'Em queda';
  }

  // Competência (stage) com mais findings type=error nas últimas 5 concluídas.
  const recent = completed.slice(-5);
  const errorByStage = {};
  for (const e of recent) {
    for (const c of (e.corrections || [])) {
      const errs = (c.findings || []).filter((f) => f.type === 'error').length;
      if (errs) errorByStage[c.stage] = (errorByStage[c.stage] || 0) + errs;
    }
  }
  const worstStage = Object.entries(errorByStage).sort((a, b) => b[1] - a[1])[0];
  const worstLabel = worstStage ? worstStage[0] : '—';

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total de redações</span></div>
          <p className="text-2xl font-bold">{essays.length}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2"><Star className="w-4 h-4 text-[#E9861A]" /><span className="text-xs text-muted-foreground">Banca mais frequente</span></div>
          <p className="pt-1 text-lg font-bold">{top.total > 0 ? top.name : '—'}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Tendência geral</span></div>
          <p className="text-lg font-bold">{trend}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2"><Target className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Competência a revisar</span></div>
          <p className="pt-1 text-sm font-bold leading-tight">{worstLabel}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="w-4 h-4" /> Distribuição por banca
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={counts}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" name="Redações" fill="#E9861A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {evolution.length >= 2 && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" /> Evolução das notas
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="percentage" name="Nota" stroke="#E9861A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}