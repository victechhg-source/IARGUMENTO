import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2, ArrowDown } from 'lucide-react';

// Tira-dúvidas pós-correção: botão flutuante + painel de chat. O aluno faz
// até MAX_QUESTIONS perguntas; o corretor responde lembrando de toda a
// avaliação. Comentários da correção podem disparar uma pergunta pronta.
const MAX_QUESTIONS = 4;

export default function CorrectionChat({ essayId, initialQa, pendingQuestion, onPendingConsumed }) {
  const [open, setOpen] = useState(false);
  const [qa, setQa] = useState(Array.isArray(initialQa) ? initialQa : []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showArrow, setShowArrow] = useState(false);
  const [dismissedHint, setDismissedHint] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const remaining = Math.max(0, MAX_QUESTIONS - qa.length);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [qa, open, loading]);

  const send = async (overrideQuestion) => {
    const q = (overrideQuestion != null ? overrideQuestion : input).trim();
    if (!q || loading || remaining <= 0) return;
    if (overrideQuestion == null) setInput('');
    setError('');
    setLoading(true);
    setQa((prev) => [...prev, { question: q, answer: '', _pending: true }]);
    try {
      const res = await base44.functions.invoke('answerCorrectionQuestion', { essayId, question: q });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setQa(Array.isArray(data.qa_history) ? data.qa_history : []);
    } catch (e) {
      setError(e?.message || 'Erro ao enviar pergunta.');
      setQa((prev) => prev.filter((m) => !m._pending));
    } finally {
      setLoading(false);
    }
  };

  // Pergunta disparada por um comentário da correção: abre o painel,
  // dispara a seta animada e envia a pergunta pronta (ou preenche o campo
  // se já houver uma dúvida em processamento).
  useEffect(() => {
    if (!pendingQuestion) return;
    setOpen(true);
    setDismissedHint(true);
    setShowArrow(true);
    if (!loading && remaining > 0) {
      send(pendingQuestion);
    } else {
      setInput(pendingQuestion);
    }
    onPendingConsumed?.();
    const t = setTimeout(() => setShowArrow(false), 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 flex items-end gap-2"
          >
            {!dismissedHint && (
              <div className="mb-1 max-w-[11rem] rounded-2xl rounded-br-sm bg-secondary px-3 py-2 text-xs font-semibold leading-snug text-secondary-foreground shadow-lg">
                Tire suas dúvidas sobre a correção aqui
              </div>
            )}
            <button
              type="button"
              onClick={() => { setOpen(true); setDismissedHint(true); }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
              aria-label="Tirar dúvidas sobre a correção"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex h-[34rem] max-h-[calc(100vh-7rem)] w-[28rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {showArrow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.2 }, y: { repeat: Infinity, duration: 0.7, ease: 'easeInOut' } }}
                className="pointer-events-none absolute bottom-[4.75rem] right-10 z-[60] text-primary"
              >
                <ArrowDown className="w-7 h-7" />
              </motion.div>
            )}

            <header className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2 text-secondary-foreground">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Tira-dúvidas da correção</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-secondary-foreground/70">{remaining}/{MAX_QUESTIONS} dúvidas restantes</span>
                <button type="button" onClick={() => setOpen(false)} className="text-secondary-foreground/70 hover:text-secondary-foreground" aria-label="Fechar">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {qa.length === 0 && !loading && (
                <p className="mt-8 px-4 text-center text-sm text-muted-foreground">
                  Tire até {MAX_QUESTIONS} dúvidas sobre a correção da sua redação. O corretor responde de forma direta e didática, lembrando de toda a avaliação.
                </p>
              )}
              {qa.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {m.question}
                  </div>
                  {m.answer ? (
                    <div className="mr-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-card-foreground">
                      {m.answer}
                    </div>
                  ) : m._pending ? (
                    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
                    </div>
                  ) : null}
                </div>
              ))}
              {error && <p className="text-center text-xs text-destructive">{error}</p>}
            </div>

            <footer className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  disabled={loading || remaining <= 0}
                  placeholder={remaining <= 0 ? 'Limite de dúvidas atingido' : 'Escreva sua dúvida…'}
                  className={`flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${showArrow ? 'ring-2 ring-primary' : ''}`}
                  maxLength={300}
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={loading || remaining <= 0 || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  aria-label="Enviar dúvida"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}