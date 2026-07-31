import React, { useRef, useMemo } from 'react';

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Caixa de edição única que mostra os pontos de dúvida do OCR grifados em vermelho
// enquanto o aluno edita o texto. Camada de destaque (backdrop) por trás de um
// textarea transparente — mantém a edição nativa e a paragrafação exata.
export default function HighlightTextarea({ value, onChange, flaggedSegments = [], unrecognized = [], textareaClassName = '' }) {
  const taRef = useRef(null);
  const backRef = useRef(null);

  const parts = useMemo(() => {
    const text = value || '';
    const patterns = [];
    (flaggedSegments || []).forEach((s) => { if (s?.text) patterns.push(escapeRe(s.text)); });
    (unrecognized || []).forEach((w) => { if (w) patterns.push(escapeRe(w)); });
    patterns.push('\\[\\?\\]');
    const re = new RegExp(`(${patterns.join('|')})`, 'gi');
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push({ text: text.slice(last, m.index), type: 'plain' });
      out.push({ text: m[0], type: 'flagged' });
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < text.length) out.push({ text: text.slice(last), type: 'plain' });
    if (text.endsWith('\n')) out.push({ text: ' ', type: 'plain' });
    return out;
  }, [value, flaggedSegments, unrecognized]);

  const handleScroll = () => {
    if (backRef.current && taRef.current) {
      backRef.current.scrollTop = taRef.current.scrollTop;
      backRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const shared = 'whitespace-pre-wrap break-words p-3 text-sm leading-relaxed';

  return (
    <div className="relative">
      <div
        ref={backRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-auto border border-transparent ${shared} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {parts.map((p, i) =>
          p.type === 'flagged' ? (
            <mark key={i} className="bg-red-300/70 text-red-950 rounded px-0.5">{p.text}</mark>
          ) : (
            <span key={i} className="text-foreground/90">{p.text}</span>
          )
        )}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className={`relative z-10 w-full resize-y min-h-[220px] rounded-md border border-border bg-transparent text-transparent caret-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring ${shared} ${textareaClassName}`}
      />
    </div>
  );
}