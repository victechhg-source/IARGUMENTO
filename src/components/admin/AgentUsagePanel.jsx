import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Mostra o uso atual (correções, tokens, último uso, modelo registrado) de um
// agente. Para agentes fixos/sem registro no banco, filtra por banca.
export default function AgentUsagePanel({ agentId, banca }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await base44.entities.AgentUsage.list('-created_date', 1000);
        const filtered = agentId
          ? all.filter((r) => r.agent_id === agentId)
          : all.filter((r) => r.banca === banca);
        if (active) setRows(filtered);
      } catch {
        if (active) setRows([]);
      }
    })();
    return () => { active = false; };
  }, [agentId, banca]);

  if (!rows) {
    return (
      <Card className="p-5 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando uso…
      </Card>
    );
  }

  const totalTokens = rows.reduce((n, r) => n + (r.total_tokens || 0), 0);
  const last = rows[0];
  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <Card className="p-5 space-y-3">
      <h3 className="font-semibold text-sm">Uso atual</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="text-xs text-muted-foreground">correções</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{fmt(totalTokens)}</p>
          <p className="text-xs text-muted-foreground">tokens</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{last ? new Date(last.created_date).toLocaleDateString('pt-BR') : '—'}</p>
          <p className="text-xs text-muted-foreground">último uso</p>
        </div>
      </div>
      {last?.model && (
        <p className="text-xs text-muted-foreground text-center">
          Modelo registrado: <span className="font-medium">{last.model}</span>
        </p>
      )}
      {!rows.length && (
        <p className="text-xs text-muted-foreground text-center">Ainda sem execuções registradas.</p>
      )}
    </Card>
  );
}