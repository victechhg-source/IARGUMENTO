import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Check, Copy, RefreshCw, Archive, ArchiveRestore, Download, Pencil } from 'lucide-react';

// Barra de gestão da turma: renomear, copiar código, regenerar código,
// arquivar/reabrir e exportar relatório. Sem rotacionar código da escola (admin).
export default function ClassToolbar({ classroom, onRename, onRegenerate, onArchive, onReport, busy }) {
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(classroom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback silencioso
    }
  };

  const submitRename = (e) => {
    e.preventDefault();
    onRename(editName);
    setEditing(false);
    setEditName('');
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <form onSubmit={submitRename} className="flex gap-2">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Novo nome da turma" autoFocus required />
              <Button type="submit" size="icon" disabled={busy || !editName.trim()} aria-label="Salvar nome"><Check className="w-4 h-4" /></Button>
            </form>
          ) : (
            <button type="button" onClick={() => { setEditName(classroom.name); setEditing(true); }} className="flex items-center gap-2 text-left">
              <p className="font-semibold truncate">{classroom.name}</p>
              {classroom.archived && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Arquivada</span>}
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-lg font-bold tracking-widest bg-muted px-3 py-2 rounded">{classroom.code}</code>
          <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar código">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
          <Button variant="outline" size="icon" onClick={onRegenerate} disabled={busy} aria-label="Regenerar código"><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={onArchive} disabled={busy}>
            {classroom.archived ? <><ArchiveRestore className="w-4 h-4" />Reabrir</> : <><Archive className="w-4 h-4" />Arquivar</>}
          </Button>
          <Button variant="outline" size="sm" onClick={onReport}><Download className="w-4 h-4" />Relatório</Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Código para alunos entrarem na turma.</p>
    </Card>
  );
}