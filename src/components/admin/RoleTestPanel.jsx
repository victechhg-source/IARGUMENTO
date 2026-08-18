import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserCog, GraduationCap, Users, Building2 } from 'lucide-react';

const ROLES = [
  { id: 'director', label: 'Diretor', icon: Building2, path: '/diretor' },
  { id: 'teacher', label: 'Professor', icon: GraduationCap, path: '/professor' },
  { id: 'student', label: 'Aluno', icon: Users, path: '/minhas-turmas' },
];

// Permite que o admin assuma temporariamente cada papel (account_type + escola)
// na própria conta, sem precisar de contas separadas. O papel de plataforma
// continua "admin", então o acesso a /admin nunca é perdido.
export default function RoleTestPanel({ user, schools, onChange }) {
  const [schoolId, setSchoolId] = useState(user?.school_id || schools[0]?.id || '');
  const [saving, setSaving] = useState('');

  const assume = async (accountType) => {
    setSaving(accountType);
    await base44.auth.updateMe({ account_type: accountType, school_id: schoolId });
    await onChange();
    setSaving('');
  };

  const reset = async () => {
    setSaving('reset');
    await base44.auth.updateMe({ account_type: 'student', school_id: '' });
    await onChange();
    setSaving('');
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Altera a SUA conta admin para simular um papel. Não use em produção para gerir escolas.
      </div>
      <div className="flex items-start gap-3">
        <UserCog className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h2 className="font-semibold">Modo de teste por papel</h2>
          <p className="text-sm text-muted-foreground">
            Assuma um papel na sua própria conta para percorrer cada painel. Papel atual:{' '}
            <strong>{user?.account_type || 'admin'}</strong>
            {user?.school_id ? ` · escola vinculada: ${schools.find(s => s.id === user.school_id)?.name || user.school_id}` : ' · sem escola vinculada'}
          </p>
        </div>
      </div>

      <div className="max-w-sm">
        <Select value={schoolId} onValueChange={setSchoolId}>
          <SelectTrigger aria-label="Escola de teste"><SelectValue placeholder="Selecione a escola de teste" /></SelectTrigger>
          <SelectContent>
            {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.institutional_code})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map(({ id, label, icon: Icon }) => (
          <Button key={id} onClick={() => assume(id)} disabled={!schoolId || !!saving} variant={user?.account_type === id ? 'default' : 'outline'}>
            {saving === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            Testar como {label}
          </Button>
        ))}
        <Button variant="ghost" onClick={reset} disabled={!!saving}>Voltar a admin</Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {ROLES.map(({ id, label, path }) => (
          <Link key={id} to={path}><Button variant="outline" size="sm">Abrir painel do {label.toLowerCase()}</Button></Link>
        ))}
        <Link to="/correcao"><Button variant="outline" size="sm">Abrir correção</Button></Link>
        <Link to="/historico"><Button variant="outline" size="sm">Abrir histórico</Button></Link>
      </div>

      {!schools.length && (
        <p className="text-sm text-destructive">Cadastre uma escola na aba “Escolas” antes de testar os papéis.</p>
      )}
    </Card>
  );
}