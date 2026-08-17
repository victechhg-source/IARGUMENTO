import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Star, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BANCAS } from '@/data/bancas';

export default function HistoryOverview({ essays }) {
  const counts = BANCAS.map(b => ({
    name: b.name,
    total: essays.filter(e => e.banca === b.id).length,
  }));
  const top = counts.reduce((a, b) => (b.total > a.total ? b : a), counts[0] || { name: '—', total: 0 });

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
    </div>
  );
}