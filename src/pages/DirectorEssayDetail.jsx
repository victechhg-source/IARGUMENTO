import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PenLine, ShieldAlert } from 'lucide-react';

// Visualização somente leitura de uma redação pelo diretor.
// Guarda: essay.school_ids contém me.school_id (RLS já reforça).
export default function DirectorEssayDetail() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    Promise.all([base44.entities.Essay.get(id), base44.auth.me()])
      .then(([loaded, me]) => {
        const belongs = (loaded.school_ids || []).includes(me.school_id) || me.role === 'admin';
        if (!belongs) setDenied(true);
        setEssay(loaded);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (!essay) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Redação não encontrada.</p>
        <Link to="/diretor"><Button variant="outline">Voltar</Button></Link>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <ShieldAlert className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sem permissão</p>
        <p className="text-sm text-muted-foreground">Esta redação não pertence à sua escola.</p>
        <Link to={`/diretor/aluno/${essay.created_by_id}`}><Button variant="outline">Voltar ao aluno</Button></Link>
      </div>
    );
  }

  const banca = BANCAS.find((b) => b.id === essay.banca);
  const correction = {
    annotated_text: essay.annotated_text,
    memorable_strengths: essay.memorable_strengths || [],
    stages: essay.corrections || [],
    final_grade: essay.final_grade,
    max_grade: essay.max_grade,
    writing_suggestions: essay.writing_suggestions || [],
    study_suggestions: essay.study_suggestions || [],
  };
  const date = new Date(essay.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-6 flex items-center gap-3">
        <Link to={`/diretor/aluno/${essay.created_by_id}`}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca?.color }}>
          <PenLine className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Redação {banca?.name}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <CorrectionResults correction={correction} banca={banca} transcription={essay.transcription} />
      </div>
    </div>
  );
}