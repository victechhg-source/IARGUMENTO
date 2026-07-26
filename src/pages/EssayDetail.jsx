import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';

export default function EssayDetail() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Essay.get(id)
      .then(setEssay)
      .finally(() => setLoading(false));
  }, [id]);

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
        <Link to="/historico"><Button variant="outline">Voltar ao histórico</Button></Link>
      </div>
    );
  }

  const banca = BANCAS.find(b => b.id === essay.banca);
  const correction = {
    annotated_text: essay.annotated_text,
    stages: essay.corrections || [],
    final_grade: essay.final_grade,
    max_grade: essay.max_grade,
    writing_suggestions: essay.writing_suggestions || [],
    study_suggestions: essay.study_suggestions || [],
  };
  const date = new Date(essay.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/historico">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca?.color }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Redação {banca?.name}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <CorrectionResults correction={correction} banca={banca} />
      </div>
    </div>
  );
}