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
import { ArrowLeft, Bot, Plus } from 'lucide-react';

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
  const [correction, setCorrection] = useState(null);
  const [essayId, setEssayId] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!banca) {
      navigate('/');
      return;
    }
    addBotMessage(
      `Olá! 👋 Sou seu corretor de redações para a banca **${banca.name}**.\n\n` +
      `Vou seguir os critérios oficiais da ${banca.full_name} para avaliar sua redação em cada etapa:\n\n` +
      banca.stages.map(s => `- **${s.name}** — ${s.description}`).join('\n') +
      `\n\nPara começar, envie uma **foto da sua redação escrita à mão**. Vou transcrevê-la e devolver com as palavras que não consegui ler bem destacadas para você conferir. 📸`
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
    addUserMessage(`📸 Enviei a foto da minha redação.`);
    setLoading(true);
    setPhase('transcribing');

    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você está transcrevendo uma redação escrita à mão em português brasileiro. Transcreva o texto completo fielmente, preservando parágrafos e pontuação. Se houver palavras que você não consegue ler com clareza, marque-as envolvendo-as com [?] assim: palavra[?]. Não invente palavras que não estão visíveis. Retorne o JSON no formato solicitado.`,
        file_urls: [uploadRes.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            transcription: { type: "string" },
            unrecognized_words: { type: "array", items: { type: "string" } }
          },
          required: ["transcription", "unrecognized_words"]
        }
      });

      setTranscription(result.transcription);
      setUnrecognized(result.unrecognized_words || []);

      const user = await base44.auth.me();
      const memberships = await base44.entities.ClassMembership.filter({ student_id: user.id, status: 'approved' });
      const essay = await base44.entities.Essay.create({
        banca: banca.id,
        teacher_ids: [...new Set(memberships.map(m => m.teacher_id))],
        status: 'reviewing',
        original_image_url: uploadRes.file_url,
        transcription: result.transcription,
        unrecognized_words: result.unrecognized_words || []
      });
      setEssayId(essay.id);

      addBotMessage(
        `Transcrição concluída! ✅\n\n` +
        (result.unrecognized_words?.length
          ? `Encontrei **${result.unrecognized_words.length} palavra(s)** que não consegui ler com clareza. Elas estão destacadas abaixo para você conferir e corrigir se necessário.`
          : `Consegui ler toda a sua redação! Revise a transcrição abaixo e confirme se está tudo correto.`)
      );
      setPhase('review');
    } catch (error) {
      addBotMessage('Ops, tive um problema ao ler sua redação. Tente enviar a foto novamente.');
      setPhase('upload');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTranscription(editedText) {
    setTranscription(editedText);
    addUserMessage('✓ Confirmei a transcrição da minha redação.');

    if (essayId) {
      await base44.entities.Essay.update(essayId, { transcription: editedText, status: 'correcting' });
    }

    addBotMessage(
      `Perfeito! Enviando sua redação para a equipe de correção da banca **${banca.name}**. 📝\n\n` +
      `Cada etapa será avaliada separadamente:\n\n` +
      banca.stages.map(s => `- ${s.name}`).join('\n') +
      `\n\nAguarde, isso pode levar um minutinho.`
    );
    setPhase('correcting');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildCorrectionPrompt(banca, editedText),
        response_json_schema: {
          type: "object",
          properties: {
            annotated_text: { type: "string" },
            stages: { type: "array", items: { type: "object", properties: {
              stage: { type: "string" },
              score: { type: "number" },
              max_score: { type: "number" },
              findings: { type: "array", items: { type: "object", properties: {
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

      setCorrection(result);

      if (essayId) {
        await base44.entities.Essay.update(essayId, {
          status: 'completed',
          annotated_text: result.annotated_text,
          corrections: result.stages,
          final_grade: result.final_grade,
          max_grade: result.max_grade || banca.max_grade,
          writing_suggestions: result.writing_suggestions,
          study_suggestions: result.study_suggestions
        });
      }

      addBotMessage('🎉 Correção concluída! Confira o resultado completo abaixo:');
      setPhase('results');
    } catch (error) {
      addBotMessage('Ops, tive um problema durante a correção. Tente novamente em instantes.');
      setPhase('review');
    }
  }

  if (!banca) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: banca.color }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Corretor {banca.name}</p>
            <p className="text-xs text-muted-foreground">{banca.full_name}</p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} banca={banca} />
          ))}

          {phase === 'transcribing' && loading && (
            <ChatMessage message={{ role: 'bot', content: '' }} banca={banca} loading />
          )}

          {phase === 'correcting' && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: banca.color }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border shadow-sm w-full">
                <CorrectionProgress stages={banca.stages} />
              </div>
            </div>
          )}

          {phase === 'review' && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: banca.color }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-white border shadow-sm w-full">
                <TranscriptionReview
                  transcription={transcription}
                  unrecognized={unrecognized}
                  onConfirm={handleConfirmTranscription}
                />
              </div>
            </div>
          )}

          {phase === 'results' && correction && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: banca.color }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[92%] w-full">
                <CorrectionResults correction={correction} banca={banca} />
                <div className="mt-4">
                  <Button className="w-full" onClick={() => navigate('/')}>
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
        <div className="border-t bg-white">
          <div className="max-w-3xl mx-auto w-full p-4">
            <UploadArea onUpload={handleUpload} />
          </div>
        </div>
      )}
    </div>
  );
}