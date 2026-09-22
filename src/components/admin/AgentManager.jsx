import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, Cpu } from 'lucide-react';
import { OCR_AGENT, BANCA_ARCHITECTURES, PLANNER_AGENT } from '@/data/agentArchitectures';
import AgentDetail from '@/components/admin/AgentDetail';
import PlannerAgentDetail from '@/components/admin/PlannerAgentDetail';

// Lista todos os agentes do sistema: OCR (fixo) + planejador de estudos +
// agentes do banco por banca. Novos agentes adicionados ao banco aparecem
// automaticamente aqui.
export default function AgentManager() {
  const [agents, setAgents] = useState(null);
  const [planners, setPlanners] = useState(null);
  const [selectedKey, setSelectedKey] = useState(OCR_AGENT.id);

  const load = async () => {
    const list = await base44.entities.CorrectionAgent.list('-updated_date');
    setAgents(list);
    try {
      setPlanners(await base44.entities.PlannerAgent.list('-updated_date'));
    } catch {
      setPlanners([]);
    }
  };

  useEffect(() => { load(); }, []);

  if (!agents) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  // Garante que toda banca com arquitetura conhecida apareça, mesmo sem agente no banco.
  const bancasPresentes = new Set(agents.map((a) => a.banca));
  const knownBancas = Object.keys(BANCA_ARCHITECTURES);
  const placeholderBancas = knownBancas.filter((b) => !bancasPresentes.has(b));

  const selectedAgent = selectedKey === OCR_AGENT.id
    ? OCR_AGENT
    : agents.find((a) => a.id === selectedKey) || null;

  const choose = (key) => setSelectedKey(key);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      <Card className="p-3 h-fit">
        <Button className="w-full mb-3" variant="outline" onClick={() => setSelectedKey('new')}>
          <Plus className="w-4 h-4" /> Novo agente
        </Button>
        <button onClick={() => choose(OCR_AGENT.id)} className={`w-full text-left p-3 rounded-lg cursor-pointer hover:bg-muted ${selectedKey === OCR_AGENT.id ? 'bg-muted' : ''}`}>
          <span className="font-medium block">{OCR_AGENT.name}</span>
          <span className="text-xs text-muted-foreground">Sistema · fixo</span>
        </button>
        <div className="my-2 border-t border-border" />
        {planners && (
          <>
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Planejamento</p>
            {(planners || []).map((p) => (
              <button key={p.id} onClick={() => choose(p.id)} className={`w-full text-left p-3 rounded-lg cursor-pointer hover:bg-muted ${selectedKey === p.id ? 'bg-muted' : ''}`}>
                <span className="font-medium block">{p.name}</span>
                <span className="text-xs text-muted-foreground">Planejador · v{p.version || 1}{p.active ? ' · Ativo' : p.status === 'ready' ? ' · Pronto' : ' · Rascunho'}</span>
              </button>
            ))}
            <button onClick={() => choose('new-planner')} className={`w-full text-left p-3 rounded-lg cursor-pointer hover:bg-muted ${selectedKey === 'new-planner' ? 'bg-muted' : ''}`}>
              <span className="font-medium block">Novo planejador</span>
              <span className="text-xs text-muted-foreground">criar agente de estudos</span>
            </button>
            <div className="my-2 border-t border-border" />
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Correção por banca</p>
          </>
        )}
        {agents.map((a) => (
          <button key={a.id} onClick={() => choose(a.id)} className={`w-full text-left p-3 rounded-lg cursor-pointer hover:bg-muted ${selectedKey === a.id ? 'bg-muted' : ''}`}>
            <span className="font-medium block">{a.name}</span>
            <span className="text-xs text-muted-foreground">{a.banca} · v{a.version || 1}{a.active ? ' · Ativo' : a.status === 'ready' ? ' · Pronto' : ''}</span>
          </button>
        ))}
        {placeholderBancas.map((b) => (
          <button key={b} onClick={() => choose(`new-${b}`)} className={`w-full text-left p-3 rounded-lg cursor-pointer hover:bg-muted ${selectedKey === `new-${b}` ? 'bg-muted' : ''}`}>
            <span className="font-medium block">Padrão {b}</span>
            <span className="text-xs text-muted-foreground">{b} · sem agente cadastrado</span>
          </button>
        ))}
      </Card>

      <div className="space-y-4">
        {selectedKey === 'new' ? (
          <AgentDetail agent={null} onChanged={load} />
        ) : selectedKey === 'new-planner' ? (
          <PlannerAgentDetail agent={null} onChanged={load} />
        ) : selectedKey?.startsWith('new-') ? (
          <AgentDetail agent={{ banca: selectedKey.slice(4) }} onChanged={load} />
        ) : planners?.some((p) => p.id === selectedKey) ? (
          <PlannerAgentDetail agent={planners.find((p) => p.id === selectedKey)} onChanged={load} />
        ) : (
          <AgentDetail agent={selectedAgent} onChanged={load} />
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Cpu className="w-3 h-3" /> Bancas sem agente cadastrado usam o corretor padrão da banca. Crie um agente para customizar prompt, modelo e base de RAG.
        </p>
      </div>
    </div>
  );
}