import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import MetricCards from '@/components/teacher/MetricCards';
import Insights from '@/components/teacher/Insights';
import ClassToolbar from '@/components/teacher/ClassToolbar';
import ClassFilters from '@/components/teacher/ClassFilters';
import NoEssayStudents from '@/components/teacher/NoEssayStudents';
import PendingRequests from '@/components/teacher/PendingRequests';
import ApprovedStudents from '@/components/teacher/ApprovedStudents';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DAY = 86400000;

function inPeriod(dateStr, period) {
  if (period === 'all') return true;
  const days = period === '7d' ? 7 : 30;
  return Date.now() - new Date(dateStr).getTime() <= days * DAY;
}

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [essays, setEssays] = useState([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banca, setBanca] = useState('all');
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('completed');
  const [sort, setSort] = useState('avg');
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoadError(false);
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [c, m, e] = await Promise.all([
        base44.entities.Classroom.filter({ teacher_id: me.id }, '-created_date'),
        base44.entities.ClassMembership.filter({ teacher_id: me.id }, '-created_date'),
        base44.entities.Essay.filter({ teacher_ids: me.id }, '-created_date', 500),
      ]);
      setClasses(c);
      setMembers(m);
      setEssays(e);
      setSelected((s) => s || c.find((cl) => !cl.archived)?.id || c[0]?.id || '');
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const timer = setInterval(() => { reloadClass(); }, 45000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const reloadClass = async () => {
    try {
      const me = user || (await base44.auth.me());
      const [c, m, e] = await Promise.all([
        base44.entities.Classroom.filter({ teacher_id: me.id }, '-created_date'),
        base44.entities.ClassMembership.filter({ teacher_id: me.id }, '-created_date'),
        base44.entities.Essay.filter({ teacher_ids: me.id }, '-created_date', 500),
      ]);
      setClasses(c);
      setMembers(m);
      setEssays(e);
    } catch {
      toast({ title: 'Não foi possível atualizar os dados da turma.', variant: 'destructive' });
    }
  };

  const createClass = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // O código da turma é gerado no servidor.
      await base44.functions.invoke('createClassroom', { name });
      setName('');
      await load();
    } catch {
      toast({ title: 'Não foi possível criar a turma. Tente novamente.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const review = async (id, decision) => {
    await base44.functions.invoke('reviewClassJoin', { membershipId: id, decision });
    await reloadClass();
  };

  const renameClass = async (newName) => {
    if (!selected || !newName?.trim()) return;
    setBusy(true);
    try { await base44.functions.invoke('updateClassroom', { classId: selected, name: newName.trim() }); await reloadClass(); } finally { setBusy(false); }
  };

  const regenerateCode = async () => {
    setBusy(true);
    try { await base44.functions.invoke('teacherRotateClassCode', { classId: selected }); await reloadClass(); } finally { setBusy(false); }
  };

  const toggleArchive = async () => {
    const cc = classes.find((c) => c.id === selected);
    if (!cc) return;
    setBusy(true);
    try { await base44.functions.invoke('updateClassroom', { classId: selected, archived: !cc.archived }); await reloadClass(); } finally { setBusy(false); }
  };

  const currentClass = classes.find((c) => c.id === selected);
  const approved = members.filter((m) => m.class_id === selected && m.status === 'approved');
  const pending = members.filter((m) => m.class_id === selected && m.status === 'pending');
  const studentIds = approved.map((m) => m.student_id);
  const classEssays = essays.filter((e) => studentIds.includes(e.created_by_id));

  const slice = useMemo(() => classEssays.filter((e) =>
    (banca === 'all' || e.banca === banca) &&
    inPeriod(e.created_date, period) &&
    (status === 'all' || e.status === status)
  ), [classEssays, banca, period, status]);

  const completedSlice = useMemo(() => slice.filter((e) => e.status === 'completed'), [slice]);

  const studentsWithData = useMemo(() => approved.map((m) => {
    const sEssays = slice.filter((e) => e.created_by_id === m.student_id);
    // Média apenas de redações concluídas com nota numérica — mesma base da ordenação.
    const graded = sEssays.filter((e) => e.status === 'completed' && typeof e.final_grade === 'number' && e.max_grade);
    const avg = graded.length ? Math.round(graded.reduce((s, e) => s + (e.final_grade / e.max_grade) * 100, 0) / graded.length) : 0;
    const last = [...sEssays].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    return { membership: m, essays: sEssays, avg, last, count: sEssays.length };
  }), [approved, slice]);

  const sorted = useMemo(() => {
    const arr = [...studentsWithData];
    arr.sort((a, b) => {
      if (sort === 'last') {
        const ad = a.last ? new Date(a.last.created_date).getTime() : 0;
        const bd = b.last ? new Date(b.last.created_date).getTime() : 0;
        return bd - ad;
      }
      return b.avg - a.avg;
    });
    return arr;
  }, [studentsWithData, sort]);

  const noEssay = useMemo(() => studentsWithData.filter((s) => s.count === 0).map((s) => ({ id: s.membership.id, name: s.membership.student_name })), [studentsWithData]);

  const reportCSV = () => {
    const headers = ['aluno', 'n_redacoes', 'media_percent', 'ultima_banca', 'ultima_data'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = studentsWithData.map((s) => [
      s.membership.student_name,
      s.count,
      `${s.avg}%`,
      s.last?.banca || '',
      s.last ? new Date(s.last.created_date).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${currentClass?.name || 'turma'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Não foi possível carregar o painel do professor.</p>
          <Button variant="outline" onClick={() => { setLoading(true); load(); }}>Tentar novamente</Button>
        </Card>
      </div>
    );
  }
  if (user?.account_type !== 'teacher') return <div className="min-h-screen flex items-center justify-center"><Card className="p-6 text-center"><p className="mb-4">Este painel é exclusivo para professores.</p><Link to="/professor"><Button>Voltar</Button></Link></Card></div>;
  if (!user?.school_id) return <div className="min-h-screen flex items-center justify-center"><Card className="p-6 text-center"><p className="mb-2 font-semibold">Vínculo institucional necessário</p><p className="text-sm text-muted-foreground mb-4">Cadastre-se com o código fornecido pela escola para criar turmas.</p><Link to="/professor"><Button>Voltar</Button></Link></Card></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <h1 className="font-semibold">Painel do professor</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o desempenho das suas turmas</p>
      </div>
      <main className="max-w-5xl mx-auto p-4 py-6 space-y-6">
        <Card className="p-4">
          <form onSubmit={createClass} className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova turma" aria-label="Nome da nova turma" required />
            <Button disabled={busy}><Plus className="w-4 h-4 mr-2" />Criar turma</Button>
          </form>
        </Card>
        {members.filter((m) => m.status === 'pending').length > 0 && (
          <Card className="p-4 border-primary/40 bg-accent/40">
            <p className="text-sm font-medium">
              {members.filter((m) => m.status === 'pending').length} solicitação(ões) de entrada aguardando sua aprovação.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Selecione a turma correspondente para aprovar ou recusar.</p>
          </Card>
        )}
        {classes.length ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {classes.map((c) => (
                <Button key={c.id} variant={selected === c.id ? 'default' : 'outline'} onClick={() => setSelected(c.id)}>
                  {c.name}{c.archived ? ' (arq.)' : ''}
                </Button>
              ))}
            </div>
            {currentClass && (
              <ClassToolbar classroom={currentClass} onRename={renameClass} onRegenerate={regenerateCode} onArchive={toggleArchive} onReport={reportCSV} busy={busy} />
            )}
            <PendingRequests pending={pending} onReview={review} />
            <ClassFilters banca={banca} period={period} status={status} sort={sort} setBanca={setBanca} setPeriod={setPeriod} setStatus={setStatus} setSort={setSort} />
            <MetricCards students={approved} essays={completedSlice} />
            <Insights essays={completedSlice} />
            <NoEssayStudents students={noEssay} />
            <ApprovedStudents students={sorted} onRemove={(id) => review(id, 'removed')} />
          </>
        ) : (
          <Card className="p-8 text-center space-y-2">
            <p className="font-medium">Crie sua primeira turma</p>
            <p className="text-sm text-muted-foreground">Gere um código, envie aos alunos e aprove as solicitações por aqui.</p>
          </Card>
        )}
      </main>
    </div>
  );
}