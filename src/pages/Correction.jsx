import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BANCAS } from '@/data/bancas';
import ChatMessage from '@/components/essay/ChatMessage';
import UploadArea from '@/components/essay/UploadArea';
import TranscriptionReview from '@/components/essay/TranscriptionReview';
import CorrectionProgress from '@/components/essay/CorrectionProgress';
import CorrectionResults from '@/components/essay/CorrectionResults';
import { Button } from '@/components/ui/button';
import { Check, Plus, Info } from 'lucide-react';
import CorrectorAvatar from '@/components/essay/CorrectorAvatar';

export default function Correction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bancaId = params.get('banca');
  const essayParam = params.get('essay');
  const banca = BANCAS.find((b) => b.id === bancaId);

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
  const [hasApprovedClass, setHasApprovedClass] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const scrollRef = useRef(null);
  // Trava anti-duplo-disparo: impede correções concorrentes (retomada
  // 'correcting' sem resultado + clique em confirmar, remount, duplo clique).
  const correctionStarted = useRef(false);

  function addBotMessage(content) {
    setMessages((prev) => [...prev, { role: 'bot', content }]);
  }
  function addUserMessage(content) {
    setMessages((prev) => [...prev, { role: 'user', content }]);
  }

  // Executa o corretor com o payload padrão e persiste o resultado no servidor.
  // Usado na confirmação da transcrição e na retomada de correção interrompida.
  async function runCorrection(id) {
    if (correctionStarted.current) return;
    correctionStarted.current = true;
    setPhase('correcting');
    try {
      const response = await base44.functions.invoke('runCorrectionAgent', {
        essayId: id,
      });
      const payload = response?.data ?? response;
      const result = payload.result;
      setCorrection(result);
      addBotMessage('Correção concluída. Confira o resultado completo abaixo:');
      setPhase('results');
    } catch (error) {
      correctionStarted.current = false;
      addBotMessage('Ops, tive um problema durante a correção. Tente novamente em instantes.');
      setPhase('review');
    }
  }

  useEffect(() => {
    if (!banca) {
      navigate('/nova-redacao');
      return;
    }
    if (essayParam) {
      // Retomar redação existente — nunca cria um segundo Essay.
      (async () => {
        try {
          const [loaded, me] = await Promise.all([base44.entities.Essay.get(essayParam), base44.auth.me()]);
          if (loaded.created_by_id !== me.id || loaded.banca !== banca.id) {
            navigate('/historico', { replace: true });
            return;
          }
          setEssayId(loaded.id);
          const memberships = await base44.entities.ClassMembership.filter({ student_id: me.id, status: 'approved' });
          setHasApprovedClass(memberships.length > 0);

          if (loaded.status === 'completed') {
            navigate(`/historico/${loaded.id}`, { replace: true });
            return;
          }
          setTranscription(loaded.transcription || '');
          setUnrecognized(loaded.unrecognized_words || []);
          setConfidence(loaded.ocr_confidence || 0);
          const flagged = (loaded.ocr_segments || [])
            .filter((s) => s.issues && s.issues.length)
            .map((s) => ({ text: s.text, issues: s.issues, confidence: s.confidence }));
          setFlaggedSegments(flagged);

          if (loaded.status === 'reviewing') {
            addBotMessage('Retomando a revisão da sua transcrição. Confirme para iniciarmos a correção.');
            setPhase('review');
            return;
          }
          if (loaded.status === 'correcting') {
            if (loaded.corrections && loaded.corrections.length) {
              setCorrection({
                annotated_text: loaded.annotated_text,
                memorable_strengths: loaded.memorable_strengths || [],
                stages: loaded.corrections,
                final_grade: loaded.final_grade,
                max_grade: loaded.max_grade,
                writing_suggestions: loaded.writing_suggestions || [],
                study_suggestions: loaded.study_suggestions || [],
              });
              setPhase('results');
            } else {
              addBotMessage('Encontramos uma correção interrompida. Retomando a análise pelos critérios da banca...');
              await runCorrection(loaded.id);
            }
            return;
          }
          // transcribing — arquivo pode ter sido perdido; permite reenviar
          addBotMessage('Vamos retomar o envio da sua redação. Reenvie a foto ou PDF para continuar.');
          setPhase('upload');
        } catch (e) {
          navigate('/historico', { replace: true });
        }
      })();
    } else {
      addBotMessage(
        `Correção para a banca **${banca.name}**.\n\n` +
        `A análise seguirá os critérios oficiais da ${banca.full_name} em cada etapa:\n\n` +
        banca.stages.map((s) => `- **${s.name}** — ${s.description}`).join('\n') +
        `\n\nPara começar, envie uma **foto nítida ou PDF da sua redação manuscrita**. A transcrição ficará disponível para revisão e validação antes da correção.`
      );
      setPhase('upload');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banca?.id, essayParam]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase, loading]);

  async function handleUpload(file) {
    addUserMessage(`${file.type === 'application/pdf' ? 'PDF' : 'Foto'} da redação enviado.`);
    setLoading(true);
    setPhase('transcribing');

    try {
      addBotMessage('Iniciando pipeline de digitalização. Vou executar cinco etapas: ingestão, reconhecimento duplo, validação determinística, cálculo de confiança e roteamento.');

      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      let id = essayId;
      if (!id) {
        const user = await base44.auth.me();
        const memberships = await base44.entities.ClassMembership.filter({ student_id: user.id, status: 'approved' });
        setHasApprovedClass(memberships.length > 0);
        // O servidor popula teacher_ids/school_ids — o cliente só informa a banca.
        const createRes = await base44.functions.invoke('createEssay', { banca: banca.id });
        const createPayload = createRes?.data ?? createRes;
        id = createPayload.essay.id;
        setEssayId(id);
      }
      // Anexa (ou reanexa) o arquivo e volta o fluxo para 'transcribing'.
      await base44.functions.invoke('updateEssayFlow', { essayId: id, action: 'set_file', file_url: uploadRes.file_url });

      const response = await base44.functions.invoke('processEssayScan', { essayId: id });
      const result = response.data;

      setTranscription(result.transcription);
      setUnrecognized(result.unrecognizedWords || []);
      setConfidence(result.confidence || 0);
      setFlaggedSegments(result.flaggedSegments || []);
      setOcrStages(result.stages || []);

      const stageList = (result.stages || []).map((s) => `- **${s.stage}** — ${s.detail}`).join('\n');

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
    // Não permite segundo submit enquanto a confirmação/correção roda.
    if (confirming || correctionStarted.current) return;
    setConfirming(true);
    setTranscription(editedText);
    addUserMessage('Transcrição revisada e confirmada.');

    try {
      if (essayId) {
        await base44.functions.invoke('updateEssayFlow', { essayId, action: 'confirm_transcription', transcription: editedText });
      }

      addBotMessage(
        `Transcrição confirmada. A correção pelos critérios da banca **${banca.name}** foi iniciada.\n\n` +
        `Cada etapa será avaliada separadamente:\n\n` +
        banca.stages.map((s) => `- ${s.name}`).join('\n') +
        `\n\nIsso pode levar alguns minutos. Você pode fechar esta página — a correção continua e você retoma pelo histórico.`
      );

      await runCorrection(essayId);
    } catch (error) {
      addBotMessage('Não foi possível confirmar a transcrição. Revise o texto e tente novamente.');
      setPhase('review');
    } finally {
      setConfirming(false);
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
                    { label: 'Roteamento (aprovação ou revisão)', done: ocrStages.length >= 5 },
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
                  loading={confirming}
                />
              </div>
            </div>
          )}

          {phase === 'results' && correction && (
            <div className="flex gap-3 justify-start">
              <CorrectorAvatar banca={banca} size={32} className="mt-1" />
              <div className="max-w-[92%] w-full">
                {!hasApprovedClass && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-accent/40 p-3 text-sm">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p>Sua correção está salva no seu histórico. O professor só verá depois que sua entrada na turma for aprovada.</p>
                  </div>
                )}
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