import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BancaHistoryPanel from '@/components/history/BancaHistoryPanel';
import HistoryOverview from '@/components/history/HistoryOverview';

export default function Historico() {
  const [essays, setEssays] = useState(null);
  const [activeBanca, setActiveBanca] = useState(BANCAS[0]?.id);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.Essay.list('-created_date', 100).then(setEssays);
  }, []);

  async function handleDelete(id) {
    try {
      await base44.entities.Essay.delete(id);
      setEssays(prev => (prev || []).filter(e => e.id !== id));
      toast({ title: 'Redação excluída do histórico.' });
    } catch (err) {
      toast({ title: 'Erro ao excluir redação.', variant: 'destructive' });
    }
  }

  if (essays === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const activeBancaData = BANCAS.find(b => b.id === activeBanca) || BANCAS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-sm flex-1">Meu histórico</h1>
          <Link to="/"><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova redação</Button></Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <HistoryOverview essays={essays} />

        {/* Aba por banca */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3 mb-4">
          {BANCAS.map(b => {
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
          essays={essays.filter(e => e.banca === activeBancaData.id)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}