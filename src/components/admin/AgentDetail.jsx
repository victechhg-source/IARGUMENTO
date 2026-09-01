import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Save, Cpu, Layers, FileText, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MODELS, OCR_AGENT, OCR_RECOGNIZER_PROMPTS, architectureFor } from '@/data/agentArchitectures';
import AgentUsagePanel from '@/components/admin/AgentUsagePanel';
import AgentResources from '@/components/admin/AgentResources';

// Painel de detalhe do agente selecionado.
// agent === OCR_AGENT → agente de sistema (somente leitura).
// agent === null → novo agente (formulário em branco).
// Caso contrário → agente do banco, editável.
export default function AgentDetail({ agent, onChanged }) {
  const { toast } = useToast();
  const isOcr = agent?.id === OCR_AGENT.id;
  const isNew = !agent;
  const arch = isOcr ? OCR_AGENT : architectureFor(agent?.banca || 'ENEM');
  const editable = !isOcr;

  const [form, setForm] = useState(() => ({
    name: agent?.name || '',
    banca: agent?.banca || 'ENEM',
    model: agent?.model || 'automatic',
    system_prompt: agent?.system_prompt || '',
  }));

  // reseta o form quando o agente selecionado muda
  const [key, setKey] = useState(agent?.id || 'new');
  if ((agent?.id || 'new') !== key) {
    setKey(agent?.id || 'new');
    setForm({
      name: agent?.name || '',
      banca: agent?.banca || 'ENEM',
      model: agent?.model || 'automatic',
      system_prompt: agent?.system_prompt || '',
    });
  }

  const save = async (e) => {
    e.preventDefault();
    try {
      if (agent?.id) {
        await base44.entities.CorrectionAgent.update(agent.id, form);
      } else {
        const saved = await base44.entities.CorrectionAgent.create({ ...form, active: false, version: 1, status: 'draft' });
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
    if (!window.confirm('Treinar e ativar este agente? Ele passará a ser o agente ativo da banca, substituindo o atual.')) return;
    try {
      await base44.entities.CorrectionAgent.update(agent.id, { version: (agent.version || 1) + 1, status: 'ready', trained_at: new Date().toISOString() });
      await base44.entities.CorrectionAgent.updateMany({ banca: agent.banca, active: true }, { $set: { active: false } });
      await base44.entities.CorrectionAgent.update(agent.id, { active: true });
      toast({ title: 'Agente treinado e ativado.' });
      onChanged();
    } catch (err) {
      toast({ title: 'Erro ao treinar.', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight">{isOcr ? OCR_AGENT.name : (agent?.name || 'Novo agente')}</h2>
            <p className="text-xs text-muted-foreground">
              Banca: <span className="font-medium">{agent?.banca || '—'}</span>
              {agent?.version ? ` · v${agent.version}` : ''}
              {agent?.active ? ' · Ativo' : agent?.status === 'ready' ? ' · Pronto' : agent?.status === 'draft' ? ' · Rascunho' : ''}
            </p>
          </div>
          {isOcr && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold"><Lock className="w-3 h-3" /> Fixo no sistema</span>}
        </div>
      </Card>

      {/* Arquitetura */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> Arquitetura</h3>
        <p className="text-sm text-foreground/80">{isOcr ? OCR_AGENT.architecture : arch.architecture}</p>
        {arch.specialists?.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {arch.specialists.map((s) => (
              <li key={s.name} className="flex gap-2"><span className="font-medium min-w-44">{s.name}</span><span className="text-muted-foreground">{s.role}</span></li>
            ))}
          </ul>
        )}
        {arch.maxGrade != null && <p className="text-xs text-muted-foreground">Nota máxima: {arch.maxGrade}</p>}
      </Card>

      {/* Prompts */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Prompts</h3>
        {isOcr ? (
          <div className="space-y-3">
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Reconhecedor primário</p><pre className="whitespace-pre-wrap text-xs bg-muted rounded-lg p-3">{OCR_RECOGNIZER_PROMPTS.primary}</pre></div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Reconhecedor secundário</p><pre className="whitespace-pre-wrap text-xs bg-muted rounded-lg p-3">{OCR_RECOGNIZER_PROMPTS.secondary}</pre></div>
          </div>
        ) : (
          <>
            {arch.fixed && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Os prompts especialistas desta banca são fixos no corretor. O campo abaixo é uma camada de instruções adicionais anexada ao prompt base — já aplicada ao vivo para UNICAMP/UNIFESP; para ENEM/FUVEST/UFG não altera os especialistas (decisão: sem mexer no corretor).
              </p>
            )}
            <Textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} placeholder="Instruções adicionais, tom e regras do agente (anexadas ao prompt base)" className="min-h-40" disabled={!editable} />
          </>
        )}
      </Card>

      {/* Modelo + uso */}
      {!isOcr && (
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Cpu className="w-4 h-4" /> Modelo</h3>
          <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })} disabled={!editable}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">O modelo ativo é o do agente marcado como ativo na banca (ou “automatic” se não houver).</p>
        </Card>
      )}
      <AgentUsagePanel agentId={agent?.id && !isOcr ? agent.id : ''} banca={agent?.banca || 'OCR'} />

      {/* Edição + RAG + ações */}
      {editable && (
        <>
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Identificação</h3>
            <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do agente" required disabled={!editable} />
              <Select value={form.banca} onValueChange={(v) => setForm({ ...form, banca: v })} disabled={!!agent?.id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['ENEM','FUVEST','UNICAMP','UNIFESP','UFG'].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </form>
          </Card>
          {agent?.id && <AgentResources agent={agent} />}
          <div className="flex gap-2">
            <Button onClick={save}><Save className="w-4 h-4" />{agent?.id ? 'Salvar alterações' : 'Criar agente'}</Button>
            {agent?.id && <Button variant="outline" onClick={train}><RefreshCw className="w-4 h-4" /> Treinar e ativar</Button>}
          </div>
        </>
      )}
    </div>
  );
}