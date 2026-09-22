import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Save, Cpu, Layers, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MODELS, PLANNER_AGENT } from '@/data/agentArchitectures';
import AgentUsagePanel from '@/components/admin/AgentUsagePanel';

// Detalhe do agente Planejador de Estudos (editável: nome, modelo, prompt).
export default function PlannerAgentDetail({ agent, onChanged }) {
  const { toast } = useToast();
  const isNew = !agent;

  const [form, setForm] = useState(() => ({
    name: agent?.name || '',
    model: agent?.model || 'automatic',
    system_prompt: agent?.system_prompt || '',
  }));
  const [key, setKey] = useState(agent?.id || 'new');
  if ((agent?.id || 'new') !== key) {
    setKey(agent?.id || 'new');
    setForm({ name: agent?.name || '', model: agent?.model || 'automatic', system_prompt: agent?.system_prompt || '' });
  }

  const save = async (e) => {
    e.preventDefault();
    try {
      if (agent?.id) {
        await base44.entities.PlannerAgent.update(agent.id, form);
      } else {
        const saved = await base44.entities.PlannerAgent.create({ ...form, active: false, version: 1, status: 'draft' });
        onChanged(saved);
      }
      toast({ title: 'Agente salvo.' });
      onChanged();
    } catch (err) {
      toast({ title: 'Erro ao salvar.', description: err?.message, variant: 'destructive' });
    }
  };

  const train = async () => {
    if (!agent?.id) return;
    if (!window.confirm('Treinar e ativar este planejador? Ele passará a ser o agente ativo, substituindo o atual.')) return;
    try {
      await base44.entities.PlannerAgent.update(agent.id, { version: (agent.version || 1) + 1, status: 'ready', trained_at: new Date().toISOString() });
      await base44.entities.PlannerAgent.updateMany({ active: true }, { $set: { active: false } });
      await base44.entities.PlannerAgent.update(agent.id, { active: true });
      toast({ title: 'Planejador treinado e ativado.' });
      onChanged();
    } catch (err) {
      toast({ title: 'Erro ao treinar.', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{agent?.name || 'Novo planejador'}</h2>
            <p className="text-xs text-muted-foreground">
              Agente de organização de estudos
              {agent?.version ? ` · v${agent.version}` : ''}
              {agent?.active ? ' · Ativo' : agent?.status === 'ready' ? ' · Pronto' : agent?.status === 'draft' ? ' · Rascunho' : ' · sem agente cadastrado'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> Arquitetura</h3>
        <p className="text-sm text-foreground/80">{PLANNER_AGENT.architecture}</p>
        <ul className="space-y-1.5 text-sm">
          {PLANNER_AGENT.specialists.map((s) => (
            <li key={s.name} className="flex gap-2"><span className="font-medium min-w-44">{s.name}</span><span className="text-muted-foreground">{s.role}</span></li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Prompt do agente</h3>
        <Textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} placeholder="Prompt do planejador (persona, princípios científicos, formato do plano)" className="min-h-56" />
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Cpu className="w-4 h-4" /> Modelo</h3>
        <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
          <SelectContent>{MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      <AgentUsagePanel agentId={agent?.id || ''} banca="PLANNER" />

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm">Identificação</h3>
        <form onSubmit={save} className="flex flex-col sm:flex-row gap-3">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do planejador" required />
        </form>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save}><Save className="w-4 h-4" />{agent?.id ? 'Salvar alterações' : 'Criar planejador'}</Button>
        {agent?.id && <Button variant="outline" onClick={train}><RefreshCw className="w-4 h-4" /> Treinar e ativar</Button>}
      </div>
    </div>
  );
}