import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function SchoolBancaChart({ bancas = [] }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" /> Média por banca
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={bancas}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="banca" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="avg" fill="#E9861A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {!bancas.length && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Nenhuma redação concluída na escola ainda.
        </p>
      )}
    </Card>
  );
}