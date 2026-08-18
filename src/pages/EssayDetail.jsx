import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, PenLine, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function EssayDetail() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [mine, setMine] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([base44.entities.Essay.get(id).catch(() => null), base44.auth.me().catch(() => null)])
      .then(([loaded, me]) => {
        setEssay(loaded);
        if (loaded && me) setMine(loaded.created_by_id === me.id);
      })
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

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(18);
    doc.text(`Redação ${banca?.name || ''}`, 14, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Data: ${date}`, 14, y); y += 6;
    doc.text(`Nota: ${essay.final_grade ?? '—'} / ${essay.max_grade ?? banca?.max_grade ?? 100}`, 14, y); y += 10;

    doc.setFontSize(14);
    doc.text('Competências', 14, y); y += 8;
    doc.setFontSize(10);
    for (const c of (essay.corrections || [])) {
      if (y > 270) { doc.addPage(); y = 16; }
      doc.setFont(undefined, 'bold');
      doc.text(`${c.stage || 'Etapa'} — ${c.score ?? '—'}/${c.max_score ?? '—'}`, 14, y); y += 6;
      doc.setFont(undefined, 'normal');
      if (c.summary) { doc.text(doc.splitTextToSize(c.summary, 180), 14, y); y += 6; }
      for (const f of (c.findings || [])) {
        if (y > 265) { doc.addPage(); y = 16; }
        const label = f.type === 'error' ? 'Erro' : f.type === 'warning' ? 'Atenção' : 'OK';
        doc.text(doc.splitTextToSize(`${label}: ${f.excerpt || ''}`, 178), 16, y); y += 5;
        if (f.explanation) { doc.text(doc.splitTextToSize(f.explanation, 178), 16, y); y += 5; }
        if (f.suggestion) { doc.text(doc.splitTextToSize(`Sugestão: ${f.suggestion}`, 178), 16, y); y += 5; }
      }
      y += 4;
    }

    const sugs = [...(essay.writing_suggestions || []), ...(essay.study_suggestions || [])];
    if (sugs.length) {
      if (y > 250) { doc.addPage(); y = 16; }
      doc.setFontSize(14);
      doc.text('Sugestões', 14, y); y += 8;
      doc.setFontSize(10);
      for (const s of sugs) {
        if (y > 270) { doc.addPage(); y = 16; }
        doc.text(doc.splitTextToSize(`• ${s}`, 180), 14, y); y += 6;
      }
    }

    doc.save(`redacao-${banca?.id || 'enem'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20 bg-background/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/historico">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca?.color }}>
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Redação {banca?.name}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
          {mine && (
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="w-4 h-4" /> Baixar PDF
            </Button>
          )}
        </div>
      </header>
      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        {essay.teacher_note ? (
          <Card className="p-4 border-primary/30 bg-accent/40">
            <h2 className="font-semibold text-sm mb-1 flex items-center gap-2"><PenLine className="w-4 h-4 text-primary" />Recado do professor</h2>
            <p className="text-sm whitespace-pre-wrap">{essay.teacher_note}</p>
          </Card>
        ) : null}
        <CorrectionResults correction={correction} banca={banca} transcription={essay.transcription} />
      </div>
    </div>
  );
}