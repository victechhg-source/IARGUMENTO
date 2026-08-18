import React from 'react';
import { BANCAS } from '@/data/bancas';
import { Button } from '@/components/ui/button';

const PERIODS = [
  { id: 'all', label: 'Tudo' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
];

export default function ClassFilters({ banca, period, status, sort, setBanca, setPeriod, setStatus, setSort }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={banca} onChange={(e) => setBanca(e.target.value)} className="h-9 rounded-sm border border-input bg-transparent px-3 text-sm">
        <option value="all">Todas as bancas</option>
        {BANCAS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <Button key={p.id} variant={period === p.id ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p.id)}>{p.label}</Button>
        ))}
      </div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-sm border border-input bg-transparent px-3 text-sm">
        <option value="all">Todos status</option>
        <option value="completed">Concluídas</option>
        <option value="correcting">Em correção</option>
        <option value="reviewing">Em revisão</option>
        <option value="transcribing">Transcrevendo</option>
      </select>
      <div className="ml-auto flex gap-1">
        <Button variant={sort === 'avg' ? 'default' : 'outline'} size="sm" onClick={() => setSort('avg')}>Média</Button>
        <Button variant={sort === 'last' ? 'default' : 'outline'} size="sm" onClick={() => setSort('last')}>Última entrega</Button>
      </div>
    </div>
  );
}