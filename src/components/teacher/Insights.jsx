import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

function rankStages(essays, type) {
  const counts = {};
  essays.forEach(e => (e.corrections || []).forEach(stage => {
    const count = (stage.findings || []).filter(f => f.type === type).length;
    if (count) counts[stage.stage] = (counts[stage.stage] || 0) + count;
  }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

export default function Insights({ essays }) {
  const groups = [
    { title: 'Pontos positivos', items: rankStages(essays, 'correct'), icon: CheckCircle2, tone: 'text-green-700 bg-green-50 border-green-200' },
    { title: 'Pontos a melhorar', items: rankStages(essays, 'error'), icon: AlertTriangle, tone: 'text-amber-800 bg-amber-50 border-amber-200' },
  ];
  return <div className="grid md:grid-cols-2 gap-3">{groups.map(({ title, items, icon: Icon, tone }) => <Card key={title} className={`p-4 border ${tone}`}><h3 className="font-semibold flex items-center gap-2 mb-3"><Icon className="w-4 h-4" />{title}</h3>{items.length ? <ul className="space-y-2 text-sm">{items.map(([name, count]) => <li key={name} className="flex justify-between gap-3"><span>{name}</span><span className="font-semibold tabular-nums">{count} ocorrências</span></li>)}</ul> : <p className="text-sm">Ainda não há dados suficientes.</p>}</Card>)}</div>;
}