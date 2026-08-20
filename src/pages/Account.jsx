import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Save, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLE_LABEL = { student: 'Aluno', teacher: 'Professor', director: 'Diretor', admin: 'Administrador' };

export default function Account() {
  const [me, setMe] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoadError(false);
    try {
      const user = await base44.auth.me();
      setMe(user);
      setName(user.display_name || user.full_name || '');
      if ((user.account_type || 'student') === 'student') {
        const m = await base44.entities.ClassMembership.filter({ student_id: user.id }, '-created_date');
        setMemberships(m);
      }
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({ display_name: name.trim() });
      const updated = await base44.auth.me();
      setMe(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      toast({ title: 'Não foi possível salvar o nome. Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar os dados da sua conta.</p>
        <Button variant="outline" onClick={load}>Tentar novamente</Button>
      </div>
    );
  }

  if (!me) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const roleLabel = ROLE_LABEL[me.account_type] || ROLE_LABEL[me.role] || '—';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-semibold">Minha conta</h1>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-sm">Perfil</h2>
        <form onSubmit={saveName} className="space-y-2">
          <label className="text-xs text-muted-foreground">Nome de exibição</label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Seu nome" />
            <Button type="submit" size="icon" disabled={saving || !name.trim()} aria-label="Salvar nome">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
          {saved && <p className="text-xs text-green-600">Nome atualizado.</p>}
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="text-sm font-medium break-all">{me.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ID público</p>
            <p className="text-sm font-medium">{me.registered_id || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Escola</p>
            <p className="text-sm font-medium">{me.school_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Perfil</p>
            <p className="text-sm font-medium">{roleLabel}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">A escola e o perfil são definidos pelo código institucional e não podem ser alterados aqui.</p>
      </Card>

      {(me.account_type || 'student') === 'student' && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-sm">Minhas turmas</h2>
            <Link to="/minhas-turmas"><Button variant="outline" size="sm">Gerenciar</Button></Link>
          </div>
          <div className="space-y-2">
            {memberships.map((m) => (
              <div key={m.id} className="flex justify-between gap-3 border rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.class_name}</p>
                  <p className="text-xs text-muted-foreground truncate">Professor: {m.teacher_name}</p>
                </div>
                <span className="text-xs font-medium shrink-0 text-muted-foreground">
                  {m.status === 'approved' ? 'Aprovado' : m.status === 'rejected' ? 'Recusado' : 'Aguardando'}
                </span>
              </div>
            ))}
            {!memberships.length && <p className="text-sm text-muted-foreground">Você ainda não entrou em nenhuma turma.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}