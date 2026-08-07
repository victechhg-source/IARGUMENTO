import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Lista de contas com ID único (ADM-/PRO-/ALU-), papel e instituição — painel admin.
export default function UsersTab({ users = [], schools = [] }) {
  const schoolName = (id) => (schools.find((s) => s.id === id)?.name) || '—';
  const sorted = [...users].sort((a, b) =>
    String(b.created_date || '').localeCompare(String(a.created_date || ''))
  );

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-1">Contas</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Todas as contas registradas no app, com ID único (ADM-/PRO-/ALU-XXXXXX), papel e instituição.
      </p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[130px]">Papel</TableHead>
              <TableHead>Instituição</TableHead>
              <TableHead className="w-[130px]">Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((u) => {
              const isTeacher = u.role !== 'admin' && u.account_type === 'teacher';
              const badge = u.role === 'admin'
                ? 'bg-primary/15 text-primary'
                : isTeacher
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800';
              const label = u.role === 'admin' ? 'Administrador' : isTeacher ? 'Professor' : 'Aluno';
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.registered_id || '—'}</TableCell>
                  <TableCell className="font-medium">{u.display_name || u.full_name || '—'}</TableCell>
                  <TableCell className="text-sm">{u.email || '—'}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>{label}</span>
                  </TableCell>
                  <TableCell className="text-sm">{u.role === 'admin' ? '—' : schoolName(u.school_id)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}