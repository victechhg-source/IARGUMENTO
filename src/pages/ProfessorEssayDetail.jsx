import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PenLine, ShieldAlert, Save, Loader2, Check } from 'lucide-react';

export default function ProfessorEssayDetail() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([base44.entities.Essay.get(id), base44.auth.me()])
      .then(([loaded, me]) => {
        const belongs = (loaded.teacher_ids || []).includes(me.id) || me.role === 'admin';
        if (!belongs) {
          setDenied(true);
          setEssay(loaded);
        } else {
          setEssay(loaded);
          setNote(loaded.teacher_note || '');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const saveNote = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('teacherSetNote', { essayId: id, note });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Redação não encontrada.</p>
        <Link to="/professor"><Button variant="outline">Voltar</Button></Link>
      </div>
    );
  }

  const backTo = `/professor/aluno/${essay.created_by_id}`;

  if (denied) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link to={backTo}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="flex-1"><p className="font-semibold text-sm">Redação</p></div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto w-full px-4 py-10 flex flex-col items-center justify-center text-center gap-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold">Sem permissão</p>
          <p className="text-sm text-muted-foreground">Esta redação não foi atribuída a você para correção.</p>
          <Link to={backTo}><Button variant="outline">Voltar ao aluno</Button></Link>
        </div>
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={backTo}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca?.color }}>
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Redação {banca?.name}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-2">Recado para o aluno</h2>
          <Textarea value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} placeholder="Deixe um comentário sobre esta redação..." rows={3} className="mb-3" />
          <Button onClick={saveNote} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando' : saved ? 'Salvo' : 'Salvar recado'}
          </Button>
        </Card>
        <CorrectionResults correction={correction} banca={banca} transcription={essay.transcription} />
      </div>
    </div>
  );
}