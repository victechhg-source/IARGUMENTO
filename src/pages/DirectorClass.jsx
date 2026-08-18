import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, TrendingUp, FileText } from 'lucide-react';

// Visão somente leitura de uma turma pelo diretor.
// Pendentes aparecem sem botões de aprovar/recusar (isso é do professor).
export default function DirectorClass() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getDirectorClass', { classId: id });
        setData(res);
      } catch (err) {
        setError(err?.data?.error || err?.message || 'Não foi possível carregar a turma.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="p-6 text-center max-w-sm">
          <p className="mb-4">{error}</p>
          <Link to="/diretor"><Button variant="outline">Voltar</Button></Link>
        </Card>
      </div>
    );
  }

  const cls = data?.classroom || {};

  return (
    <div className="max-w-4xl mx-auto p-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/diretor"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="font-semibold">{cls.name}</h1>
          <p className="text-sm text-muted-foreground">Professor: {cls.teacher_name || '—'}</p>
        </div>
        <code className="text-sm font-bold tracking-widest bg-muted px-3 py-2 rounded">{cls.code}</code>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><TrendingUp className="w-4 h-4" />Média da turma</div>
          <p className="text-2xl font-bold tabular-nums">{data?.avgPercent === null || data?.avgPercent === undefined ? '—' : `${data.avgPercent}%`}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><FileText className="w-4 h-4" />Redações concluídas</div>
          <p className="text-2xl font-bold tabular-nums">{data?.essaysCount ?? 0}</p>
        </Card>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Alunos aprovados</h2>
        <div className="space-y-2">
          {(data?.approved || []).map((m) => (
            <Link key={m.id} to={`/diretor/aluno/${m.student_id}`} className="block">
              <Card className="p-4 flex justify-between gap-3 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium">{m.student_name}</p>
                  <p className="text-sm text-muted-foreground">{m.student_email}</p>
                </div>
                <span className="text-sm text-muted-foreground">{m.essays} redação(ões)</span>
              </Card>
            </Link>
          ))}
          {!data?.approved?.length && <p className="text-sm text-muted-foreground">Nenhum aluno aprovado nesta turma.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Solicitações pendentes</h2>
        <div className="space-y-2">
          {(data?.pending || []).map((m) => (
            <Card key={m.id} className="p-4 flex justify-between gap-3 opacity-70">
              <div>
                <p className="font-medium">{m.student_name}</p>
                <p className="text-sm text-muted-foreground">{m.student_email}</p>
              </div>
              <span className="text-sm text-muted-foreground">Aguardando aprovação do professor</span>
            </Card>
          ))}
          {!data?.pending?.length && <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}
        </div>
      </section>
    </div>
  );
}