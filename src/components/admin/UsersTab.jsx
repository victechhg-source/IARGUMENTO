import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Settings2 } from 'lucide-react';
import UserActionsDialog from '@/components/admin/UserActionsDialog';

const ROLE_OPTIONS = [
  { value: 'all', label: 'Todos os papéis' },
  { value: 'admin', label: 'Administrador' },
  { value: 'director', label: 'Diretor' },
  { value: 'teacher', label: 'Professor' },
  { value: 'student', label: 'Aluno' },
];

// Papel efetivo: admin → 'admin'; senão account_type. Fonte única dos badges.
function effectiveRole(u) {
  if (u.role === 'admin') return 'admin';
  return u.account_type || 'student';
}

function badgeFor(u) {
  if (u.role === 'admin') return { label: 'Administrador', cls: 'bg-primary/15 text-primary' };
  if (u.account_type === 'director') return { label: 'Diretor', cls: 'bg-purple-100 text-purple-800' };
  if (u.account_type === 'teacher') return { label: 'Professor', cls: 'bg-amber-100 text-amber-800' };
  return { label: 'Aluno', cls: 'bg-blue-100 text-blue-800' };
}

export default function UsersTab({ users = [], schools = [], currentUserId = null, onChanged }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [actionUser, setActionUser] = useState(null);

  const schoolName = (id) => (schools.find((s) => s.id === id)?.name) || '—';

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => {
        if (role !== 'all' && effectiveRole(u) !== role) return false;
        if (schoolFilter !== 'all' && (u.school_id || '') !== schoolFilter) return false;
        if (!term) return true;
        const hay = [u.display_name, u.full_name, u.email, u.registered_id]
          .map((v) => String(v || '').toLowerCase()).join(' ');
        return hay.includes(term);
      })
      .sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
  }, [users, q, role, schoolFilter]);

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-1">Contas</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Todas as contas registradas no app. Alterações de papel, escola e situação passam pelo servidor.
      </p>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou ID" className="pl-9 h-9" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Papel" /></SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
              <TableHead className="w-[150px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[130px]">Papel</TableHead>
              <TableHead>Instituição</TableHead>
              <TableHead className="w-[110px]">Situação</TableHead>
              <TableHead className="w-[130px]">Criado em</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const isMe = u.id === currentUserId;
              const badge = badgeFor(u);
              return (
                <TableRow key={u.id} className={isMe ? 'bg-accent/40' : ''}>
                  <TableCell className="font-mono text-xs">{u.registered_id || '—'}</TableCell>
                  <TableCell className="font-medium">{u.display_name || u.full_name || '—'}{isMe && <span className="ml-2 text-xs text-primary">(você)</span>}</TableCell>
                  <TableCell className="text-sm">{u.email || '—'}</TableCell>
                  <TableCell><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span></TableCell>
                  <TableCell className="text-sm">{u.role === 'admin' ? '—' : schoolName(u.school_id)}</TableCell>
                  <TableCell>
                    {u.suspended
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Suspensa</span>
                      : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Ativa</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.created_date ? new Date(u.created_date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setActionUser(u)} disabled={u.role === 'admin' && u.id === currentUserId}>
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!filtered.length && (
              <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Nenhuma conta encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {actionUser && (
        <UserActionsDialog
          user={actionUser}
          schools={schools}
          onClose={() => setActionUser(null)}
          onDone={() => { setActionUser(null); onChanged && onChanged(); }}
        />
      )}
    </Card>
  );
}