import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Loader2, UserPlus, Mail } from 'lucide-react';

// Caminho alternativo de criação de contas quando o auto-cadastro por OTP
// falha no backend: o admin convida por e-mail (a plataforma cria a conta e
// envia o link de ativação). Contorna o fluxo register/verifyOtp.
export default function InviteUser({ schools = [], onInvited }) {
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('student');
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setMsg('');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) { setErr('Informe o e-mail.'); return; }
    const code = schoolCode.trim().toUpperCase();
    const match = schools.find((s) => (s.institutional_code || '').toUpperCase() === code);
    if (!match) { setErr('Código institucional inválido.'); return; }
    setLoading(true);
    try {
      const result = await base44.auth.inviteUser(cleanEmail, 'user');
      const uid = result?.id || result?.user?.id;
      if (uid) {
        await base44.entities.User.update(uid, { account_type: tipo, school_id: match.id, school_name: match.name });
      }
      setMsg(uid
        ? `Convite enviado para ${cleanEmail}. A pessoa ativa a conta pelo link no e-mail; tipo/instituição já ficam definidos.`
        : `Convite enviado para ${cleanEmail}. Após a ativação pelo e-mail, ajuste tipo/instituição nesta aba.`);
      setEmail(''); setSchoolCode('');
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
      <p className="mb-4 text-xs text-muted-foreground">Caminho alternativo ao auto-cadastro: o admin convida por e-mail e a pessoa ativa a conta pelo link recebido.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-code">Código institucional</Label>
          <Input id="invite-code" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} placeholder="ESC-XXXXXX" className="h-10" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <button type="button" onClick={() => setTipo('student')} className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Aluno</button>
          <button type="button" onClick={() => setTipo('teacher')} className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Professor</button>
        </div>
        <Button type="button" size="sm" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Enviar convite
        </Button>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
    </Card>
  );
}