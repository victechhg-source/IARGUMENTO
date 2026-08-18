import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS, buildCorrectionPrompt } from '@/data/bancas';
import ChatMessage from '@/components/essay/ChatMessage';
import UploadArea from '@/components/essay/UploadArea';
import TranscriptionReview from '@/components/essay/TranscriptionReview';
import CorrectionProgress from '@/components/essay/CorrectionProgress';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import CorrectorAvatar from '@/components/essay/CorrectorAvatar';

export default function Correction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bancaId = params.get('banca');
  const banca = BANCAS.find(b => b.id === bancaId);

  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('intro');
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [unrecognized, setUnrecognized] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [flaggedSegments, setFlaggedSegments] = useState([]);
  const [ocrStages, setOcrStages] = useState([]);
  const [correction, setCorrection] = useState(null);
  const [essayId, setEssayId] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!banca) {
      navigate('/nova-redacao');
      return;
    }
    addBotMessage(
      `Correção para a banca **${banca.name}**.\n\n` +
      `A análise seguirá os critérios oficiais da ${banca.full_name} em cada etapa:\n\n` +
      banca.stages.map(s => `- **${s.name}** — ${s.description}`).join('\n') +
      `\n\nPara começar, envie uma **foto nítida ou PDF da sua redação manuscrita**. A transcrição ficará disponível para revisão e validação antes da correção.`
    );
    setPhase('upload');
  }, [banca?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase, loading]);

  function addBotMessage(content) {
    setMessages(prev => [...prev, { role: 'bot', content }]);
  }

  function addUserMessage(content) {
    setMessages(prev => [...prev, { role: 'user', content }]);
  }

  async function handleUpload(file) {
    addUserMessage(`${file.type === 'application/pdf' ? 'PDF' : 'Foto'} da redação enviado.`);
    setLoading(true);
    setPhase('transcribing');

    try {
      addBotMessage('Iniciando pipeline de digitalização. Vou executar cinco etapas: ingestão, reconhecimento duplo, validação determinística, cálculo de confiança e roteamento.');

      // ─── Etapa 1: Ingestão ───
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const user = await base44.auth.me();
      const memberships = await base44.entities.ClassMembership.filter({ student_id: user.id, status: 'approved' });
      const essay = await base44.entities.Essay.create({
        banca: banca.id,
        teacher_ids: [...new Set(memberships.map(m => m.teacher_id))],
        school_ids: [...new Set(memberships.map(m => m.school_id).filter(Boolean))],
        status: 'transcribing',
        original_image_url: uploadRes.file_url
      });
      setEssayId(essay.id);

      // ─── Etapas 2–5: Reconhecimento duplo, validação, confiança e roteamento ───
      const response = await base44.functions.invoke('processEssayScan', { essayId: essay.id });
      const result = response.data;

      setTranscription(result.transcription);
      setUnrecognized(result.unrecognizedWords || []);
      setConfidence(result.confidence || 0);
      setFlaggedSegments(result.flaggedSegments || []);
      setOcrStages(result.stages || []);

      const stageList = (result.stages || []).map(s => `- **${s.stage}** — ${s.detail}`).join('\n');

      addBotMessage(
        `Pipeline de digitalização concluído.\n\n${stageList}\n\n` +
        (result.flaggedSegments?.length > 0
          ? `Identifiquei **${result.flaggedSegments.length} segmento(s)** com baixa confiança — eles estão destacados abaixo.`
          : `O reconhecimento atingiu **${Math.round((result.confidence || 0) * 100)}% de confiança**.`) +
        `\n\nRevise a transcrição abaixo e confirme antes de iniciarmos a correção.`
      );
      setPhase('review');
    } catch (error) {
      addBotMessage('Ops, tive um problema ao processar sua redação. Tente enviar a foto ou PDF novamente.');
      setPhase('upload');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTranscription(editedText) {
    setTranscription(editedText);
    addUserMessage('Transcrição revisada e confirmada.');

    if (essayId) {
      await base44.entities.Essay.update(essayId, { transcription: editedText, status: 'correcting' });
    }

    addBotMessage(
      `Transcrição confirmada. A correção pelos critérios da banca **${banca.name}** foi iniciada.\n\n` +
      `Cada etapa será avaliada separadamente:\n\n` +
      banca.stages.map(s => `- ${s.name}`).join('\n') +
      `\n\nA análise pode levar alguns instantes.`
    );
    setPhase('correcting');

    try {
      const response = await base44.functions.invoke('runCorrectionAgent', {
        banca: banca.id,
        essayId,
        stages: banca.stages,
        prompt: buildCorrectionPrompt(banca, editedText),
        responseJsonSchema: {
          type: "object",
          properties: {
            annotated_text: { type: "string" },
            memorable_strengths: { type: "array", items: { type: "string" } },
            stages: { type: "array", items: { type: "object", properties: {
              stage: { type: "string" },
              score: { type: "number" },
              max_score: { type: "number" },
              findings: { type: "array", items: { type: "object", properties: {
                id: { type: "string" },
                type: { type: "string" },
                excerpt: { type: "string" },
                explanation: { type: "string" },
                suggestion: { type: "string" },
                video_suggestion: { type: "string" }
              } } }
            } } },
            final_grade: { type: "number" },
            max_grade: { type: "number" },
            writing_suggestions: { type: "array", items: { type: "string" } },
            study_suggestions: { type: "array", items: { type: "string" } }
          }
        }
        });
        const result = response.data.result;

        setCorrection(result);

        if (essayId) {
        await base44.entities.Essay.update(essayId, {
          status: 'completed',
          annotated_text: result.annotated_text,
          memorable_strengths: result.memorable_strengths,
          corrections: result.stages,
          final_grade: result.final_grade,
          max_grade: result.max_grade || banca.max_grade,
          writing_suggestions: result.writing_suggestions,
          study_suggestions: result.study_suggestions
        });
      }

      addBotMessage('Correção concluída. Confira o resultado completo abaixo:');
      setPhase('results');
    } catch (error) {
      addBotMessage('Ops, tive um problema durante a correção. Tente novamente em instantes.');
      setPhase('review');
    }
  }

  if (!banca) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-4 pt-4 flex items-center gap-3">
        <CorrectorAvatar banca={banca} size={32} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Corretor {banca.name}</p>
          <p className="text-xs text-muted-foreground">{banca.full_name}</p>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} banca={banca} />
          ))}

          {phase === 'transcribing' && loading && (
            <div className="flex gap-3 justify-start">
              <CorrectorAvatar banca={banca} size={32} className="mt-1" />
              <div className="max-w-[85%] rounded-sm px-4 py-3 bg-card text-card-foreground border border-card/20 w-full">
                <div className="space-y-2">
                  {[
                    { label: 'Ingestão do arquivo', done: ocrStages.length >= 1 },
                    { label: 'Reconhecimento duplo (OCR primário + secundário)', done: ocrStages.length >= 2 },
                    { label: 'Validação determinística', done: ocrStages.length >= 3 },
                    { label: 'Cálculo de confiança', done: ocrStages.length >= 4 },
                    { label: 'Roteamento (aprovação ou revisão)', done: ocrStages.length >= 5 }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${step.done ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                        {step.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === 'correcting' && (
            <div className="flex gap-3 justify-start">
              <CorrectorAvatar banca={banca} size={32} className="mt-1" />
              <div className="max-w-[85%] rounded-sm px-4 py-3 bg-card text-card-foreground border border-card/20 w-full">
                <CorrectionProgress stages={banca.stages} />
              </div>
            </div>
          )}

          {phase === 'review' && (
            <div className="flex gap-3 justify-start">
              <CorrectorAvatar banca={banca} size={32} className="mt-1" />
              <div className="max-w-[90%] rounded-sm px-4 py-3 bg-card text-card-foreground border border-card/20 w-full">
                <TranscriptionReview
                  transcription={transcription}
                  unrecognized={unrecognized}
                  confidence={confidence}
                  flaggedSegments={flaggedSegments}
                  onConfirm={handleConfirmTranscription}
                />
              </div>
            </div>
          )}

          {phase === 'results' && correction && (
            <div className="flex gap-3 justify-start">
              <CorrectorAvatar banca={banca} size={32} className="mt-1" />
              <div className="max-w-[92%] w-full">
                <CorrectionResults correction={correction} banca={banca} transcription={transcription} />
                <div className="mt-4">
                  <Button className="w-full" onClick={() => navigate('/nova-redacao')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Corrigir outra redação
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      {phase === 'upload' && !loading && (
        <div className="border-t border-foreground/20 bg-background">
          <div className="max-w-5xl mx-auto w-full p-4">
            <UploadArea onUpload={handleUpload} />
          </div>
        </div>
      )}
    </div>
  );
}