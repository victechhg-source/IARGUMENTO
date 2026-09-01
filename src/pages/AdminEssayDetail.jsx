import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PenLine, RefreshCw, Image as ImageIcon, Loader2, Save, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

// Visão admin do pipeline completo de uma redação, com re-execução do corretor.
export default function AdminEssayDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const load = async () => {
    const e = await base44.entities.Essay.get(id).catch(() => null);
    setEssay(e);
    setNote(e?.teacher_note || '');
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const rerun = async () => {
    if (!essay?.transcription) {
      toast({ title: 'Redação sem transcrição.', variant: 'destructive' });
      return;
    }
    if (!window.confirm('Re-executar o corretor? A devolutiva atual será substituída por uma nova correção.')) return;
    setRerunning(true);
    try {
      await base44.entities.Essay.update(id, {
        status: 'correcting',
        corrections: [],
        final_grade: null,
        max_grade: null,
        annotated_text: '',
        writing_suggestions: [],
        study_suggestions: [],
        memorable_strengths: [],
      });
      await base44.functions.invoke('runCorrectionAgent', { essayId: id });
      await load();
      toast({ title: 'Correção re-executada.' });
    } catch (e) {
      toast({ title: 'Falha ao re-executar.', description: e?.data?.error || e?.message, variant: 'destructive' });
    } finally {
      setRerunning(false);
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await base44.functions.invoke('teacherSetNote', { essayId: id, note });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    } catch (e) {
      toast({ title: 'Erro ao salvar recado.', description: e?.message, variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (!essay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Redação não encontrada.</p>
        <Link to="/admin"><Button variant="outline">Voltar</Button></Link>
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
  const date = new Date(essay.created_date).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca?.color }}>
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Redação {banca?.name} · verificação admin</p>
            <p className="text-xs text-muted-foreground">{date} · aluno {(essay.student_id || essay.created_by_id || '').slice(-6)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={rerun} disabled={rerunning}>
            {rerunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {rerunning ? 'Corrigindo…' : 'Re-executar'}
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        {essay.original_image_url && (
          <Card className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Imagem enviada</p>
            <Image src={essay.original_image_url} fittingType="fit" className="w-full rounded-lg max-h-[420px]" />
          </Card>
        )}

        <Card className="p-4 space-y-2">
          <button className="w-full flex items-center justify-between" onClick={() => setShowOcr((s) => !s)}>
            <p className="text-xs font-semibold text-muted-foreground">OCR · transcrição e confiança</p>
            <span className="text-xs text-muted-foreground">{showOcr ? 'ocultar' : 'ver'}</span>
          </button>
          <div className="flex flex-wrap gap-2 text-xs">
            {typeof essay.ocr_confidence === 'number' && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">Confiança {Math.round(essay.ocr_confidence * 100)}%</span>}
            {essay.status && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">Status: {essay.status}</span>}
            {(essay.ocr_structure_warnings || []).length > 0 && <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 font-semibold">{essay.ocr_structure_warnings.length} aviso(s) de estrutura</span>}
          </div>
          {showOcr && (
            <div className="space-y-2 pt-1">
              <pre className="whitespace-pre-wrap text-sm bg-muted rounded-lg p-3 max-h-72 overflow-auto">{essay.transcription || '—'}</pre>
              {(essay.unrecognized_words || []).length > 0 && (
                <p className="text-xs text-muted-foreground">Palavras marcadas: {essay.unrecognized_words.join(', ')}</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold text-sm">Recado para o aluno</h2>
          <Textarea value={note} onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }} placeholder="Comentário sobre esta redação…" rows={3} />
          <Button onClick={saveNote} disabled={savingNote} size="sm">
            {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : noteSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savingNote ? 'Salvando' : noteSaved ? 'Salvo' : 'Salvar recado'}
          </Button>
        </Card>

        {essay.status === 'completed' && (essay.corrections || []).length > 0 ? (
          <CorrectionResults correction={correction} banca={banca} transcription={essay.transcription} />
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {rerunning ? 'Correção em andamento…' : 'Redação ainda não concluída. Use “Re-executar” para rodar o corretor.'}
          </Card>
        )}
      </div>
    </div>
  );
}