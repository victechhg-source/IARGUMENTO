import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import BancaHistoryPanel from '@/components/history/BancaHistoryPanel';

export default function Historico() {
  const [essays, setEssays] = useState(null);
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

  const allBancas = BANCAS;

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
        <Tabs defaultValue={allBancas[0]?.id}>
          <TabsList className="flex w-full flex-wrap h-auto justify-start gap-2 bg-transparent p-1 border-b border-border rounded-none">
            {allBancas.map(b => (
              <TabsTrigger key={b.id} value={b.id} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-muted-foreground shadow-sm hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-none">
                {b.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {allBancas.map(b => (
            <TabsContent key={b.id} value={b.id}>
              <BancaHistoryPanel
                banca={b}
                essays={essays.filter(e => e.banca === b.id)}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}