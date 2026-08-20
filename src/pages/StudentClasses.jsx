import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const STATUS_LABEL = {
  approved: { label: 'Aprovado', className: 'text-green-600' },
  pending: { label: 'Aguardando aprovação', className: 'text-muted-foreground' },
  rejected: { label: 'Recusado pelo professor', className: 'text-destructive' },
  removed: { label: 'Removido', className: 'text-muted-foreground' },
};

export default function StudentClasses() {
  const [items, setItems] = useState([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = () =>
    base44.auth.me()
      .then((u) => base44.entities.ClassMembership.filter({ student_id: u.id }, '-created_date'))
      .then((m) => { setItems(m); setLoadError(''); })
      .catch(() => setLoadError('Não foi possível carregar suas turmas. Tente novamente mais tarde.'));
  useEffect(() => { load(); }, []);

  const join = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await base44.functions.invoke('requestClassJoin', { code });
      setCode('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err?.data?.error || 'Não foi possível solicitar a entrada.');
    } finally {
      setLoading(false);
    }
  };

  const rejected = items.filter((i) => i.status === 'rejected');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 pt-6 flex items-center gap-2">
        <Link to="/historico"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-semibold">Minhas turmas</h1>
      </div>
      <main className="max-w-2xl mx-auto p-4 py-8 space-y-6">
        {loadError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive flex-1">{loadError}</p>
            <Button size="sm" variant="outline" onClick={load}>Tentar novamente</Button>
          </div>
        )}
        {rejected.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Sua solicitação foi recusada</p>
              <p className="text-muted-foreground">Converse com o professor ou tente outro código no campo abaixo.</p>
            </div>
          </div>
        )}

        <Card className="p-5">
          <h2 className="font-semibold mb-1">Entrar em uma turma</h2>
          <p className="text-sm text-muted-foreground mb-4">Digite o código fornecido pelo professor. Sua entrada dependerá da aprovação dele.</p>
          <form onSubmit={join} className="flex gap-2">
            <Input aria-label="Código da turma" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: A7B9C2" required />
            <Button disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Solicitar entrada</Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </Card>

        <section>
          <h2 className="font-semibold mb-3">Turmas solicitadas</h2>
          <div className="space-y-2">
            {items.map((item) => {
              const st = STATUS_LABEL[item.status] || { label: item.status, className: '' };
              return (
                <Card key={item.id} className="p-4 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.class_name}</p>
                    <p className="text-sm text-muted-foreground truncate">Professor: {item.teacher_name}</p>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${st.className}`}>{st.label}</span>
                </Card>
              );
            })}
            {!items.length && <p className="text-sm text-muted-foreground">Você ainda não solicitou entrada em nenhuma turma.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}