import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BANCAS } from '@/data/bancas';
import { PenLine, ArrowRight, Search } from 'lucide-react';

const STATUS = {
  transcribing: 'Transcrevendo',
  reviewing: 'Revisão',
  correcting: 'Corrigindo',
  completed: 'Concluída',
};

const STATUS_TONE = {
  transcribing: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-amber-100 text-amber-700',
  correcting: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
};

// Lista todas as redações do sistema (admin) com filtros e atalho para o
// detalhe do pipeline de correção.
export default function AdminEssaysTab({ essays }) {
  const [banca, setBanca] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () =>
      essays.filter((e) => {
        const matchBanca = banca === 'all' || e.banca === banca;
        const matchStatus = status === 'all' || e.status === status;
        const needle = q.toLowerCase();
        const matchQ = !needle || (e.transcription || '').toLowerCase().includes(needle) || (e.created_by_id || '').includes(needle) || (e.student_id || '').includes(needle);
        return matchBanca && matchStatus && matchQ;
      }),
    [essays, banca, status, q],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={banca} onValueChange={setBanca}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Banca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as bancas</SelectItem>
            {BANCAS.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por trecho da redação ou aluno" className="pl-9" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} de {essays.length}</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma redação encontrada.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const bancaMeta = BANCAS.find((b) => b.id === e.banca);
            return (
              <Link key={e.id} to={`/admin/redacao/${e.id}`} className="block">
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bancaMeta?.color || '#999' }}>
                    <PenLine className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{bancaMeta?.name || e.banca}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(e.created_date).toLocaleString('pt-BR')} · aluno {(e.student_id || e.created_by_id || '').slice(-6)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[e.status] || 'bg-muted text-muted-foreground'}`}>{STATUS[e.status] || e.status}</span>
                  {e.status === 'completed' && typeof e.final_grade === 'number' && (
                    <span className="text-sm font-bold">{e.final_grade}/{e.max_grade || bancaMeta?.max_grade}</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}