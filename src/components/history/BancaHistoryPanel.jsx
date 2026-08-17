import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Award, FileText, Calendar, BarChart3 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EssayListItem from '@/components/essay/EssayListItem';

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatLongDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'in_progress', label: 'Em andamento' },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-3 text-xs shadow-sm">
      <p className="font-semibold">{p.date}</p>
      <p className="mt-1"><strong>{p.grade}</strong> / {p.maxGrade} ({p.percentage}%)</p>
    </div>
  );
}

export default function BancaHistoryPanel({ banca, essays, onDelete }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const maxGrade = banca.max_grade;
  const completed = essays.filter(e => e.status === 'completed' && e.final_grade != null);

  const totalEssays = essays.length;
  const avgPct = completed.length
    ? Math.round(completed.reduce((s, e) => s + (e.final_grade / (e.max_grade || maxGrade)) * 100, 0) / completed.length)
    : null;
  const bestPct = completed.length
    ? Math.max(...completed.map(e => (e.final_grade / (e.max_grade || maxGrade)) * 100))
    : null;
  const lastEssay = essays.length
    ? [...essays].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]
    : null;

  const scatterData = completed
    .map(e => ({
      timestamp: new Date(e.created_date).getTime(),
      percentage: Math.round((e.final_grade / (e.max_grade || maxGrade)) * 100),
      grade: e.final_grade,
      maxGrade: e.max_grade || maxGrade,
      date: formatShortDate(e.created_date),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const filteredEssays = essays.filter(e =>
    statusFilter === 'all' ? true : statusFilter === 'completed' ? e.status === 'completed' : e.status !== 'completed'
  );

  const hasData = scatterData.length > 0;
  const timestamps = scatterData.map(d => d.timestamp);
  const minTime = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0;
  const padding = timestamps.length > 1 ? (maxTime - minTime) * 0.05 || 86400000 : 86400000;

  return (
    <div className="space-y-6 pt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Redações</span></div>
          <p className="text-2xl font-bold">{totalEssays}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Nota média</span></div>
          <p className="text-2xl font-bold">{avgPct == null ? '—' : `${avgPct}%`}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Award className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">Melhor nota</span></div>
          <p className="text-2xl font-bold">{bestPct == null ? '—' : `${Math.round(bestPct)}%`}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Última redação</span></div>
          <p className="text-sm font-bold pt-1">{lastEssay ? formatLongDate(lastEssay.created_date) : '—'}</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Progressão das notas — {banca.name}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="timestamp"
              domain={hasData ? [minTime - padding, maxTime + padding] : ['auto', 'auto']}
              tickFormatter={(t) => (hasData ? formatShortDate(new Date(t).toISOString()) : '')}
              tick={{ fontSize: 11 }}
            />
            <YAxis type="number" dataKey="percentage" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Scatter
              data={scatterData}
              fill="#E9861A"
              line={{ stroke: "#E9861A", strokeWidth: 1.5, strokeOpacity: 0.5 }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        {!hasData && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Nenhuma redação concluída para {banca.name} ainda.
          </p>
        )}
      </Card>

      {/* List */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">Redações de {banca.name}</h3>
          <div className="flex gap-1" role="group" aria-label="Filtrar por status">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f.id ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent text-foreground/60 hover:text-foreground'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredEssays.map(essay => (
            <EssayListItem key={essay.id} essay={essay} onDelete={onDelete} />
          ))}
          {filteredEssays.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma redação neste filtro.</p>
          )}
        </div>
      </div>
    </div>
  );
}