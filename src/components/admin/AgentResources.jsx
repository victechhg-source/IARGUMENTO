import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TYPE_LABEL = { file: 'Arquivo', corrected_example: 'Exemplo corrigido', banca_base: 'Base da banca' };

// Base de RAG (AgentTrainingResource) de um agente do banco.
export default function AgentResources({ agent }) {
  const { toast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState({ title: '', type: 'corrected_example', content: '' });

  const load = async () => {
    if (!agent) return;
    setLoading(true);
    try {
      setResources(await base44.entities.AgentTrainingResource.filter({ agent_id: agent.id }, '-created_date'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [agent?.id]);

  const addResource = async () => {
    if (!res.title || !res.content) return;
    try {
      await base44.entities.AgentTrainingResource.create({ ...res, agent_id: agent.id, banca: agent.banca });
      setRes({ title: '', type: 'corrected_example', content: '' });
      await load();
    } catch (e) {
      toast({ title: 'Não foi possível adicionar.', description: e?.message, variant: 'destructive' });
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.AgentTrainingResource.create({ agent_id: agent.id, banca: agent.banca, type: 'file', title: file.name, file_url });
      await load();
    } catch (err) {
      toast({ title: 'Falha no envio do arquivo.', description: err?.message, variant: 'destructive' });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remover este material da base?')) return;
    await base44.entities.AgentTrainingResource.delete(id);
    await load();
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Base de RAG (materiais de referência)</h3>
        <p className="text-sm text-muted-foreground">Arquivos, exemplos corrigidos e bases da banca usados como contexto na correção.</p>
      </div>
      <label className="inline-flex min-h-11 items-center gap-2 border rounded-md px-4 cursor-pointer hover:bg-muted">
        <Upload className="w-4 h-4" /> Adicionar arquivo
        <input type="file" className="sr-only" onChange={upload} />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input value={res.title} onChange={(e) => setRes({ ...res, title: e.target.value })} placeholder="Título do conteúdo" />
        <Select value={res.type} onValueChange={(v) => setRes({ ...res, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="corrected_example">Exemplo corrigido</SelectItem>
            <SelectItem value="banca_base">Base da banca</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea value={res.content} onChange={(e) => setRes({ ...res, content: e.target.value })} placeholder="Cole a redação corrigida, critérios ou dados de referência" className="min-h-28" />
      <Button onClick={addResource} disabled={!res.title || !res.content}>Adicionar à base</Button>

      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : resources.length ? (
          resources.map((r) => (
            <div key={r.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[r.type] || r.type}{r.file_url ? ' · arquivo' : ''}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Remover"><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>
        )}
      </div>
    </Card>
  );
}