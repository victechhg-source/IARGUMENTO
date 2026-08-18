import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Loader2, UserPlus, Mail } from 'lucide-react';

// Convite do admin: envia o convite por e-mail (plataforma) e conclui o vínculo
// (escola + account_type + registered_id) via completeAdminInvite no servidor.
// Nenhum update de User acontece no cliente.
export default function InviteUser({ schools = [], onInvited }) {
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('student');
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setMsg('');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) { setErr('Informe o e-mail.'); return; }
    if (!schoolId) { setErr('Selecione a escola.'); return; }
    setLoading(true);
    try {
      const result = await base44.auth.inviteUser(cleanEmail, 'user');
      const uid = result?.id || result?.user?.id;
      if (uid) {
        await base44.functions.invoke('completeAdminInvite', { userId: uid, schoolId, accountType: tipo });
        setMsg(`Convite enviado para ${cleanEmail}. A pessoa ativa a conta pelo link no e-mail; escola e papel já estão definidos.`);
        setEmail(''); setSchoolId(''); setTipo('student');
      } else {
        setMsg(`Convite enviado para ${cleanEmail}. Após a ativação pelo e-mail, ajuste escola e papel na aba Contas.`);
      }
      onInvited && onInvited();
    } catch (e) {
      setErr(e?.data?.message || e?.message || 'Falha ao convidar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 p-5">
      <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" />Adicionar conta (convite do admin)</h4>
      <p className="mb-4 text-xs text-muted-foreground">O admin convida por e-mail e a pessoa ativa a conta pelo link recebido. Escola e papel são definidos aqui pelo servidor.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-school">Escola</Label>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger id="invite-school" className="h-10"><SelectValue placeholder="Selecionar escola" /></SelectTrigger>
            <SelectContent>
              {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <button type="button" onClick={() => setTipo('student')} className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Aluno</button>
          <button type="button" onClick={() => setTipo('teacher')} className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Professor</button>
          <button type="button" onClick={() => setTipo('director')} className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo === 'director' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Diretor</button>
        </div>
        <Button type="button" size="sm" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 h-4" />}
          Enviar convite
        </Button>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
    </Card>
  );
}