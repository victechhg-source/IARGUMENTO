import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const ACTION_LABELS = {
  rotate_school_code: 'Rotacionar código',
  school_status: 'Status da escola',
  attach_school: 'Vincular escola',
  detach_school: 'Desvincular escola',
  set_account_type: 'Definir papel',
  suspend: 'Suspender',
  unsuspend: 'Reativar',
  invite: 'Convite',
};

export default function AuditLogTab({ logs = [], schools = [] }) {
  const [actionFilter, setActionFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');

  const schoolName = (id) => (id ? (schools.find((s) => s.id === id)?.name || id) : '—');

  const actions = [...new Set(logs.map((l) => l.action))].sort();
  const filtered = logs
    .filter((l) => actionFilter === 'all' || l.action === actionFilter)
    .filter((l) => schoolFilter === 'all' || (l.school_id || '') === schoolFilter)
    .sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-1">Auditoria</h3>
      <p className="mb-4 text-xs text-muted-foreground">Registro somente leitura das ações administrativas.</p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 sm:max-w-md">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Escola" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as escolas</SelectItem>
            {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Detalhe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground">{l.created_date ? new Date(l.created_date).toLocaleString('pt-BR') : '—'}</TableCell>
                <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{ACTION_LABELS[l.action] || l.action}</span></TableCell>
                <TableCell className="text-sm">{l.target_type === 'school' ? 'Escola' : 'Conta'} · <span className="font-mono text-xs">{l.target_id?.slice(-8)}</span></TableCell>
                <TableCell className="text-sm">{schoolName(l.school_id)}</TableCell>
                <TableCell className="text-sm">{l.actor_email || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.detail || '—'}</TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum registro.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}