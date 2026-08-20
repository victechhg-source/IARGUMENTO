import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BancaHistoryPanel from '@/components/history/BancaHistoryPanel';
import HistoryOverview from '@/components/history/HistoryOverview';

export default function Historico() {
  const [essays, setEssays] = useState(null);
  const [hasApprovedClass, setHasApprovedClass] = useState(true);
  const [activeBanca, setActiveBanca] = useState(BANCAS[0]?.id);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.Essay.list('-created_date', 100)
      .then(setEssays)
      .catch(() => {
        setEssays([]);
        toast({ title: 'Não foi possível carregar seu histórico. Tente novamente mais tarde.', variant: 'destructive' });
      });
    (async () => {
      try {
        const me = await base44.auth.me();
        if ((me.account_type || 'student') === 'student') {
          const memberships = await base44.entities.ClassMembership.filter({ student_id: me.id, status: 'approved' });
          setHasApprovedClass(memberships.length > 0);
        }
      } catch {
        // ignora — não bloqueia o histórico
      }
    })();
  }, []);

  async function handleDelete(id) {
    try {
      await base44.entities.Essay.delete(id);
      setEssays((prev) => (prev || []).filter((e) => e.id !== id));
      toast({ title: 'Redação excluída do histórico.' });
    } catch (err) {
      toast({ title: 'Erro ao excluir redação.', variant: 'destructive' });
    }
  }

  if (essays === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const activeBancaData = BANCAS.find((b) => b.id === activeBanca) || BANCAS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-semibold text-sm">Meu histórico</h1>
        <Link to="/nova-redacao"><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova redação</Button></Link>
      </div>

      {!hasApprovedClass && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-accent/40 p-4">
          <AlertCircle className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm flex-1 min-w-[200px]">Entre em uma turma para seu professor ver as correções.</p>
          <Link to="/minhas-turmas"><Button size="sm" variant="outline">Ver turmas</Button></Link>
        </div>
      )}

      <HistoryOverview essays={essays} />

      <div className="flex flex-wrap gap-2 border-b border-border pb-3 mb-4">
        {BANCAS.map((b) => {
          const isActive = b.id === activeBanca;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveBanca(b.id)}
              className={
                'rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ' +
                (isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground')
              }
            >
              {b.name}
            </button>
          );
        })}
      </div>

      <BancaHistoryPanel
        key={activeBancaData.id}
        banca={activeBancaData}
        essays={essays.filter((e) => e.banca === activeBancaData.id)}
        onDelete={handleDelete}
      />
    </div>
  );
}