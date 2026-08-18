import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SchoolMetricCards from '@/components/director/SchoolMetricCards';
import SchoolBancaChart from '@/components/director/SchoolBancaChart';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function DirectorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getSchoolOverview', {});
        setData(res);
      } catch (err) {
        setError(err?.data?.error || err?.message || 'Não foi possível carregar o painel.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm">
          <p className="mb-4">{error}</p>
          <Link to="/diretor"><Button>Voltar</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 pt-6 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="font-semibold">Painel da escola</h1>
          <p className="text-sm text-muted-foreground">{data?.school?.name || 'Sua escola'}</p>
        </div>
        {data?.school?.code && (
          <code className="text-sm font-bold tracking-widest bg-muted px-3 py-2 rounded">{data.school.code}</code>
        )}
      </div>

      <main className="max-w-5xl mx-auto p-4 py-6 space-y-6">
        <SchoolMetricCards metrics={data?.metrics} />
        <SchoolBancaChart bancas={data?.bancas || []} />

        <section>
          <h2 className="font-semibold mb-3">Turmas da escola</h2>
          <div className="space-y-2">
            {(data?.classes || []).map((c) => (
              <Card key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">Professor: {c.teacher_name || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{c.students} aluno(s)</span>
                  <code className="text-sm font-bold tracking-widest bg-muted px-2 py-1 rounded">{c.code}</code>
                </div>
              </Card>
            ))}
            {!data?.classes?.length && <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Professores vinculados</h2>
          <div className="space-y-2">
            {(data?.teachers || []).map((t) => (
              <Card key={t.id} className="p-4">
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.email}</p>
              </Card>
            ))}
            {!data?.teachers?.length && <p className="text-sm text-muted-foreground">Nenhum professor vinculado.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}