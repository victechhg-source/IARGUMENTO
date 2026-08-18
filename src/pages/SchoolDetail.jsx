import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, RefreshCw, Copy, Check, Users, GraduationCap, School as SchoolIcon, KeyRound, ShieldAlert } from 'lucide-react';

const CODE_FIELDS = [
  { label: 'Aluno', field: 'student_code', prefix: 'ALU' },
  { label: 'Professor', field: 'teacher_code', prefix: 'PRO' },
  { label: 'Diretor', field: 'director_code', prefix: 'DIR' },
];

export default function SchoolDetail() {
  const { id } = useParams();
  const [school, setSchool] = useState(null);
  const [counts, setCounts] = useState({ teachers: 0, students: 0, classes: 0 });
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [rotating, setRotating] = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, teachers, memberships, classes] = await Promise.all([
      base44.entities.School.get(id),
      base44.entities.User.filter({ school_id: id, account_type: 'teacher' }),
      base44.entities.ClassMembership.filter({ school_id: id, status: 'approved' }, '-created_date', 2000),
      base44.entities.Classroom.filter({ school_id: id }),
    ]);
    setSchool(s);
    setNameDraft(s.name || '');
    const uniqueStudents = new Set(memberships.map((m) => m.student_id));
    setCounts({ teachers: teachers.length, students: uniqueStudents.size, classes: classes.length });
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const saveName = async () => {
    setSavingName(true);
    try {
      await base44.entities.School.update(id, { name: nameDraft.trim() });
      setSchool((prev) => ({ ...prev, name: nameDraft.trim() }));
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setSavingName(false);
    }
  };

  const toggleStatus = async () => {
    const next = school.status === 'inactive' ? 'active' : 'inactive';
    const verb = next === 'inactive' ? 'inativar' : 'ativar';
    if (!window.confirm(`Tem certeza que deseja ${verb} esta escola? ${next === 'inactive' ? 'Quem já está logado continuará usando, mas novos cadastros com os códigos atuais serão bloqueados.' : '' }`)) return;
    setToggling(true);
    try {
      await base44.entities.School.update(id, { status: next });
      setSchool((prev) => ({ ...prev, status: next }));
    } finally {
      setToggling(false);
    }
  };

  const rotateCode = async (field, label) => {
    if (!window.confirm(`Gerar um novo código de ${label}? Quem tiver o código antigo não consegue mais cadastrar.`)) return;
    setRotating(field);
    try {
      const res = await base44.functions.invoke('rotateSchoolCode', { schoolId: id, field });
      setSchool((prev) => ({ ...prev, [field]: res.data.code }));
    } finally {
      setRotating(null);
    }
  };

  const copyCode = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // fallback silencioso
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Escola não encontrada.</p>
        <Link to="/admin"><Button variant="outline">Voltar</Button></Link>
      </div>
    );
  }

  const isActive = school.status === 'active';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-foreground/25 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Link to="/admin"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">IArgumento</p>
            <h1 className="font-display text-xl font-extrabold tracking-tight">Ficha da escola</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 py-8 space-y-6">
        {/* Nome + status */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground">Nome da escola</label>
              <div className="flex gap-2 mt-1">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="h-10" />
                <Button onClick={saveName} disabled={savingName || nameDraft.trim() === school.name}>
                  {nameSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-muted-foreground">Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>

          <Button variant={isActive ? 'destructive' : 'default'} onClick={toggleStatus} disabled={toggling}>
            <ShieldAlert className="w-4 h-4" />
            {isActive ? 'Inativar escola' : 'Ativar escola'}
          </Button>
        </Card>

        {/* Contagens */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 flex flex-col items-center gap-1">
            <Users className="w-5 h-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{counts.teachers}</p>
            <p className="text-xs text-muted-foreground">Professores</p>
          </Card>
          <Card className="p-4 flex flex-col items-center gap-1">
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{counts.students}</p>
            <p className="text-xs text-muted-foreground">Alunos aprovados</p>
          </Card>
          <Card className="p-4 flex flex-col items-center gap-1">
            <SchoolIcon className="w-5 h-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{counts.classes}</p>
            <p className="text-xs text-muted-foreground">Turmas</p>
          </Card>
        </div>

        {/* Diretor */}
        <Card className="p-5 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Diretor vinculado</p>
          <p className="font-medium">{school.director_email || 'Sem diretor vinculado'}</p>
        </Card>

        {/* Códigos de acesso */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Códigos de acesso</h2>
          </div>
          <div className="space-y-3">
            {CODE_FIELDS.map(({ label, field, prefix }) => (
              <div key={field} className="flex items-center gap-3 flex-wrap">
                <div className="w-24 text-sm font-medium">{label}</div>
                <code className="flex-1 min-w-[140px] rounded-lg bg-muted px-3 py-2 text-sm font-bold tracking-wider">
                  {school[field] || `— (${prefix}-XXXXXX)`}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyCode(field, school[field])} disabled={!school[field]}>
                  {copied === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === field ? 'Copiado' : 'Copiar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotateCode(field, label)} disabled={rotating === field}>
                  {rotating === field ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Novo código
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Código institucional (ESC): <code className="font-bold">{school.institutional_code}</code></p>
        </Card>
      </main>
    </div>
  );
}