import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SchoolMetricCards from '@/components/director/SchoolMetricCards';
import SchoolBancaChart from '@/components/director/SchoolBancaChart';
import { directorVisibleSchool } from '@/lib/directorCodes';
import { Loader2, Copy, Check, Download, KeyRound, ArrowRight } from 'lucide-react';

const CODE_FIELDS = [
  { label: 'Aluno', field: 'student_code' },
];

export default function DirectorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getSchoolOverview', {});
        const payload = res?.data ?? res;
        if (payload?.school) {
          payload.school = { ...payload.school, ...directorVisibleSchool(payload.school) };
        }
        setData(payload);
      } catch (err) {
        setError(err?.data?.error || err?.message || 'Não foi possível carregar o painel.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyCode = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // fallback silencioso
    }
  };

  const downloadCSV = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('exportSchoolSummary', {});
      const payload = res?.data ?? res;
      const rows = payload?.rows || [];
      const headers = ['turma', 'professor', 'aluno', 'email', 'banca', 'nota', 'nota_max', 'data'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resumo-escola.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto p-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-semibold">Painel da escola</h1>
          <p className="text-sm text-muted-foreground">{data?.school?.name || 'Sua escola'}</p>
        </div>
        <Button variant="outline" onClick={downloadCSV} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar CSV
        </Button>
      </div>

      <SchoolMetricCards metrics={data?.metrics} />
      <SchoolBancaChart bancas={data?.bancas || []} />

      {/* Códigos de cadastro — somente leitura (rotação é admin) */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Códigos de cadastro</h2>
        </div>
        <div className="space-y-3">
          {CODE_FIELDS.map(({ label, field }) => (
            <div key={field} className="flex items-center gap-3 flex-wrap">
              <div className="w-24 text-sm font-medium">{label}</div>
              <code className="flex-1 min-w-[140px] rounded-lg bg-muted px-3 py-2 text-sm font-bold tracking-wider">
                {data?.school?.[field] || '—'}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyCode(field, data?.school?.[field])} disabled={!data?.school?.[field]}>
                {copied === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === field ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Códigos de professor e diretor ficam com a administração da plataforma.</p>
      </Card>

      {/* Turmas clicáveis */}
      <section>
        <h2 className="font-semibold mb-3">Turmas da escola</h2>
        <div className="space-y-2">
          {(data?.classes || []).map((c) => (
            <Link key={c.id} to={`/diretor/turma/${c.id}`} className="block">
              <Card className="p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {c.name}
                    {c.archived === true && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Arquivada</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Professor: {c.teacher_name || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{c.students} aluno(s)</span>
                  <code className="text-sm font-bold tracking-widest bg-muted px-2 py-1 rounded">{c.code}</code>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            </Link>
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
    </div>
  );
}