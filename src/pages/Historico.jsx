import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import EssayListItem from '@/components/essay/EssayListItem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, TrendingUp, Award, Target, FileText, BarChart3 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function bancaConfig(bancaId) {
  return BANCAS.find(b => b.id === bancaId);
}

function maxGradeFor(bancaId) {
  return bancaConfig(bancaId)?.max_grade || 100;
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card text-card-foreground border border-card/20 rounded-sm p-3 text-xs">
      <p className="font-semibold">{p.banca}</p>
      <p className="text-muted-foreground">{p.date}</p>
      <p className="mt-1"><strong>{p.grade}</strong> / {p.maxGrade} ({p.percentage}%)</p>
    </div>
  );
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'in_progress', label: 'Em andamento' },
];

export default function Historico() {
  const [essays, setEssays] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    base44.entities.Essay.list('-created_date', 100).then(setEssays);
  }, []);

  if (essays === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const completed = essays.filter(e => e.status === 'completed' && e.final_grade != null);

  if (completed.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="font-semibold text-sm flex-1">Meu histórico</h1>
            <Link to="/"><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova redação</Button></Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Nenhuma redação corrigida ainda</h2>
          <p className="text-sm text-muted-foreground mb-6">Envie sua primeira redação para começar a acompanhar sua progressão.</p>
          <Link to="/"><Button>Corrigir primeira redação</Button></Link>
        </div>
      </div>
    );
  }

  const totalEssays = completed.length;
  const avgPct = Math.round(completed.reduce((sum, e) => {
    const mg = e.max_grade || maxGradeFor(e.banca);
    return sum + (e.final_grade / mg) * 100;
  }, 0) / totalEssays);
  const best = completed.reduce((best, e) => {
    const mg = e.max_grade || maxGradeFor(e.banca);
    const pct = (e.final_grade / mg) * 100;
    return pct > best.pct ? { pct } : best;
  }, { pct: 0 });
  const bancaCounts = {};
  completed.forEach(e => { bancaCounts[e.banca] = (bancaCounts[e.banca] || 0) + 1; });
  const mostUsedBanca = Object.entries(bancaCounts).sort((a, b) => b[1] - a[1])[0][0];

  const bancasPresent = [...new Set(completed.map(e => e.banca))];
  const scatterData = bancasPresent.map(bancaId => ({
    bancaId,
    name: bancaConfig(bancaId)?.name || bancaId,
    color: bancaConfig(bancaId)?.color || '#888',
    data: completed
      .filter(e => e.banca === bancaId)
      .map(e => ({
        timestamp: new Date(e.created_date).getTime(),
        percentage: Math.round((e.final_grade / (e.max_grade || maxGradeFor(bancaId))) * 100),
        grade: e.final_grade,
        maxGrade: e.max_grade || maxGradeFor(bancaId),
        date: formatShortDate(e.created_date),
        banca: bancaConfig(bancaId)?.name || bancaId,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }));

  const allTimestamps = completed.map(e => new Date(e.created_date).getTime());
  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const padding = (maxTime - minTime) * 0.05 || 86400000;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-sm flex-1">Meu histórico</h1>
          <Link to="/"><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova redação</Button></Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Redações</span>
            </div>
            <p className="text-2xl font-bold">{totalEssays}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Nota média</span>
            </div>
            <p className="text-2xl font-bold">{avgPct}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Melhor nota</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(best.pct)}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Banca frequente</span>
            </div>
            <p className="text-2xl font-bold">{mostUsedBanca}</p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Progressão das notas por banca
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="timestamp"
                domain={[minTime - padding, maxTime + padding]}
                tickFormatter={(t) => formatShortDate(new Date(t).toISOString())}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="percentage"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                unit="%"
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              {scatterData.map(s => (
                <Scatter
                  key={s.bancaId}
                  name={s.name}
                  data={s.data}
                  fill={s.color}
                  line={{ stroke: s.color, strokeWidth: 1, strokeOpacity: 0.3 }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* List */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">Minhas redações</h3>
            <div className="flex gap-1" role="group" aria-label="Filtrar por status">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === f.id ? 'border-foreground/60 bg-card text-card-foreground' : 'border-transparent text-foreground/60 hover:text-foreground'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {essays
              .filter(e => statusFilter === 'all' ? true : statusFilter === 'completed' ? e.status === 'completed' : e.status !== 'completed')
              .map(essay => (
                <EssayListItem key={essay.id} essay={essay} />
              ))}
            {essays.filter(e => statusFilter === 'in_progress' && e.status !== 'completed').length === 0 && statusFilter === 'in_progress' && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma redação em andamento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}