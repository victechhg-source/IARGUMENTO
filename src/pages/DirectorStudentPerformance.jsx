import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import MetricCards from '@/components/teacher/MetricCards';
import Insights from '@/components/teacher/Insights';
import EssayListItem from '@/components/essay/EssayListItem';

// Desempenho de um aluno — modo somente leitura pelo diretor (sem excluir).
export default function DirectorStudentPerformance() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [essays, setEssays] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoadError(false);
    setEssays(null);
    try {
      const me = await base44.auth.me();
      const memberships = await base44.entities.ClassMembership.filter({ student_id: studentId, school_id: me.school_id, status: 'approved' });
      setMember(memberships[0] || null);
      const visible = await base44.entities.Essay.filter({ created_by_id: studentId, status: 'completed' }, '-created_date', 200);
      setEssays(visible);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [studentId]);

  // Volta para a tela de origem (turma ou painel); fallback quando não há histórico.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/diretor');
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Não foi possível carregar os dados do aluno.</p>
          <Button variant="outline" onClick={load}>Tentar novamente</Button>
        </Card>
      </div>
    );
  }
  if (essays === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (!member) {
    return <div className="flex items-center justify-center py-24"><Card className="p-6">Aluno não encontrado nesta escola.</Card></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={goBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="font-semibold">{member.student_name}</h1>
          <p className="text-sm text-muted-foreground">{member.student_email}</p>
        </div>
      </div>

      <MetricCards students={[member]} essays={essays} />
      <Insights essays={essays} />

      <section>
        <h2 className="font-semibold mb-3">Correções do aluno</h2>
        <div className="space-y-2">
          {essays.map((e) => <EssayListItem key={e.id} essay={e} href={`/diretor/redacao/${e.id}`} showDelete={false} />)}
          {!essays.length && <p className="text-sm text-muted-foreground">Este aluno ainda não possui redações corrigidas.</p>}
        </div>
      </section>
    </div>
  );
}