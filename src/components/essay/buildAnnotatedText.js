// Casamento robusto (client-side) de excerpts de correção contra a transcrição
// real do aluno. Funciona para redações novas e antigas, independendo do que
// o backend gravou em annotated_text. Estratégias encadeadas:
//   1) substring alfanumérica normalizada (tolera pontuação/aspas/caixa/acentos);
//   2) casamento exato por sequência contígua de tokens;
//   3) fuzzy: caminhada gulosa permitindo gaps de até 2 tokens (≥70% de acertos).

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function buildAnnotatedText(transcription, stages) {
  if (!transcription) return '';

  const alnum = [];
  const origIdx = [];
  for (let i = 0; i < transcription.length; i++) {
    if (/[\p{L}\p{N}]/u.test(transcription[i])) {
      alnum.push(norm(transcription[i]));
      origIdx.push(i);
    }
  }
  const transAlnum = alnum.join('');

  const transTokens = [];
  {
    const re = /[\p{L}\p{N}]+/gu;
    let m;
    while ((m = re.exec(transcription)) !== null) {
      transTokens.push({ start: m.index, end: m.index + m[0].length, norm: norm(m[0]) });
    }
  }

  const used = [];
  const overlaps = (a, b) => used.some(([s, e]) => a < e && b > s);

  const excerptAlnum = (excerpt) => {
    let out = '';
    for (const ch of excerpt) {
      if (/[\p{L}\p{N}]/u.test(ch)) out += norm(ch);
    }
    return out;
  };

  const findOccurrence = (excerpt) => {
    // 1) Substring alfanumérica normalizada.
    const flat = excerptAlnum(excerpt);
    if (flat.length >= 2) {
      const at = transAlnum.indexOf(flat);
      if (at >= 0) {
        const start = origIdx[at];
        const end = origIdx[at + flat.length - 1] + 1;
        if (!overlaps(start, end)) { used.push([start, end]); return { start, end }; }
      }
    }

    const exTokens = [...excerpt.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => norm(m[0]));
    if (!exTokens.length) return null;

    // 2) Casamento exato por sequência contígua de tokens.
    if (exTokens.length <= transTokens.length) {
      for (let i = 0; i + exTokens.length <= transTokens.length; i++) {
        let ok = true;
        for (let j = 0; j < exTokens.length; j++) {
          if (transTokens[i + j].norm !== exTokens[j]) { ok = false; break; }
        }
        if (!ok) continue;
        const start = transTokens[i].start;
        const end = transTokens[i + exTokens.length - 1].end;
        if (!overlaps(start, end)) { used.push([start, end]); return { start, end }; }
      }
    }

    // 3) Fuzzy: caminhada gulosa com gaps de até 2 tokens; aceita se ≥70%.
    const maxGap = 2;
    for (let startIdx = 0; startIdx < transTokens.length; startIdx++) {
      if (transTokens[startIdx].norm !== exTokens[0]) continue;
      const matchedPositions = [startIdx];
      let ti = startIdx + 1;
      let ei = 1;
      while (ti < transTokens.length && ei < exTokens.length) {
        if (transTokens[ti].norm === exTokens[ei]) {
          matchedPositions.push(ti);
          ti++;
          ei++;
        } else {
          let found = -1;
          for (let g = 1; g <= maxGap && ti + g < transTokens.length; g++) {
            if (transTokens[ti + g].norm === exTokens[ei]) { found = g; break; }
          }
          if (found >= 0) {
            matchedPositions.push(ti + found);
            ti = ti + found + 1;
            ei++;
          } else break;
        }
      }
      const matched = matchedPositions.length;
      if (exTokens.length > 1 && matched < 2) continue;
      if (matched / exTokens.length < 0.7) continue;
      const start = transTokens[matchedPositions[0]].start;
      const end = transTokens[matchedPositions[matchedPositions.length - 1]].end;
      if (!overlaps(start, end)) { used.push([start, end]); return { start, end }; }
    }
    return null;
  };

  const matches = [];
  stages.forEach((stg, i) => {
    const comp = i + 1;
    (stg?.findings || []).forEach((f, fi) => {
      const occ = findOccurrence(String(f?.excerpt || ''));
      if (!occ) return;
      matches.push({ start: occ.start, end: occ.end, comp, id: f.id || `c${comp}-${fi + 1}` });
    });
  });
  matches.sort((a, b) => a.start - b.start);

  let out = '';
  let last = 0;
  for (const m of matches) {
    if (m.start < last) continue;
    out += transcription.slice(last, m.start);
    out += `[[C${m.comp}#${m.id}:${transcription.slice(m.start, m.end)}]]`;
    last = m.end;
  }
  out += transcription.slice(last);
  return out || transcription;
}