import React, { useMemo } from 'react';

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds segments of the transcription, marking OCR doubt points
// (low-confidence flagged segments, [?] markers and unrecognized words)
// as red "marca-texto" highlights so the student can see them before editing.
export default function HighlightedTranscription({ transcription, flaggedSegments = [], unrecognized = [] }) {
  const parts = useMemo(() => {
    const text = transcription || '';
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
    return out;
  }, [transcription, flaggedSegments, unrecognized]);

  const hasFlagged = parts.some((p) => p.type === 'flagged');

  if (!hasFlagged) {
    return (
      <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/80">
        {transcription || '—'}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90">
      {parts.map((p, i) =>
        p.type === 'flagged' ? (
          <mark key={i} className="bg-red-300/70 text-red-950 rounded px-0.5 shadow-[0_0_0_1px_rgba(220,38,38,0.15)]">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </div>
  );
}