import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, AlertTriangle, XCircle, Youtube, Lightbulb, BookOpen, GraduationCap, Star, ArrowUp, Sparkles } from 'lucide-react';
import buildAnnotatedText from './buildAnnotatedText';

const FINDING_TYPE_LABEL = { correct: 'Acerto', warning: 'Atenção', error: 'Erro' };

const TYPE_CONFIG = {
  correct: { icon: Check, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Acerto' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Atenção' },
  error: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Erro' }
};

// Cores por competência (índice = posição em correction.stages)
const COMP_COLORS = [
  { chip: 'bg-red-200/70 text-red-900 border-red-300', dot: 'bg-red-400' },
  { chip: 'bg-blue-200/70 text-blue-900 border-blue-300', dot: 'bg-blue-400' },
  { chip: 'bg-violet-200/70 text-violet-900 border-violet-300', dot: 'bg-violet-400' },
  { chip: 'bg-amber-200/70 text-amber-900 border-amber-300', dot: 'bg-amber-400' },
  { chip: 'bg-emerald-200/70 text-emerald-900 border-emerald-300', dot: 'bg-emerald-400' },
  { chip: 'bg-cyan-200/70 text-cyan-900 border-cyan-300', dot: 'bg-cyan-400' },
  { chip: 'bg-pink-200/70 text-pink-900 border-pink-300', dot: 'bg-pink-400' },
];
const compColor = (i) => COMP_COLORS[i % COMP_COLORS.length];

function splitParagraphs(parts) {
  const paras = [[]];
  parts.forEach((p) => {
    if (p.type === 'plain') {
      const segs = p.text.split('\n');
      segs.forEach((seg, idx) => {
        if (idx > 0) paras.push([]);
        if (seg.length) paras[paras.length - 1].push({ type: 'plain', text: seg });
      });
    } else {
      paras[paras.length - 1].push(p);
    }
  });
  return paras.filter((para) => para.length > 0);
}

function normExcerpt(s) {
  return (s || '').toLowerCase().replace(/['"“”]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeAnnotations(text) {
  // Converte marcações HTML eventualmente geradas (spans/marks com classes) para o formato [[c|w|e:...]]
  const classToType = (cls = '') => {
    const c = cls.toLowerCase();
    if (/(correct|acerto|green|success|\bc\b)/.test(c)) return 'c';
    if (/(warning|aviso|amber|yellow|atencao|atenção|\bw\b)/.test(c)) return 'w';
    if (/(error|erro|red|\be\b)/.test(c)) return 'e';
    return null;
  };
  let out = text.replace(/<(span|mark)\b[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/\1>/gi, (m, tag, cls, inner) => {
    const type = classToType(cls);
    return type ? `[[${type}:${inner}]]` : inner;
  });
  // Remove quaisquer outras tags HTML restantes para nunca exibir markup cru
  out = out.replace(/<\/?[a-z][^>]*>/gi, '');
  return out;
}

function parseAnnotatedText(text) {
  if (!text) return [];
  text = normalizeAnnotations(text);
  const regex = /\[\[(C[1-5]|NP|GEN|COE|TEMA|[rcwe])(?:#([a-zA-Z0-9_-]+))?:(.*?)\]\]/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', text: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: match[1], id: match[2] || null, text: match[3] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'plain', text: text.slice(lastIndex) });
  }
  return parts;
}

export default function CorrectionResults({ correction, banca, transcription }) {
  // IDs determinísticos e únicos por competência — garante grifo e card
  // "Ver no texto" sempre apontem para a mesma observação, inclusive em
  // redações antigas em que os findings vieram sem id do backend.
  (correction.stages || []).forEach((s, si) =>
    (s.findings || []).forEach((f, fi) => { f.id = `c${si + 1}-${fi + 1}`; })
  );
  // Grifo client-side a partir da transcrição real + findings (robusto a
  // pontuação/aspas/caixa/acentos e a pequenas diferenças de palavra).
  const annotatedSource = transcription
    ? buildAnnotatedText(transcription, correction.stages || [])
    : (correction.annotated_text || '');
  const annotated = parseAnnotatedText(annotatedSource);
  const maxGrade = correction.max_grade || banca.max_grade;
  const gradePercent = (correction.final_grade / maxGrade) * 100;
  const allFindings = (correction.stages || []).flatMap((s) => s.findings || []);
  const errorCount = allFindings.filter((f) => f.type === 'error').length;
  const correctCount = allFindings.filter((f) => f.type === 'correct').length;

  // Índice de findings: mapeia id e trecho -> card de detalhe (competência)
  const findingsIndex = [];
  (correction.stages || []).forEach((s, si) =>
    (s.findings || []).forEach((f, fi) => {
      findingsIndex.push({ si, fi, f, domId: `finding-${f.id || `s${si}-f${fi}`}`, norm: normExcerpt(f.excerpt) });
    })
  );
  const findById = {};
  findingsIndex.forEach((o) => { if (o.f.id) findById[o.f.id] = o; });
  const findByExcerpt = {};
  findingsIndex.forEach((o) => { if (o.norm) findByExcerpt[o.norm] = o; });

  const [visible, setVisible] = useState((correction.stages || []).map(() => true));

  const resolveMarker = (part) => {
    let target = null;
    if (part.id && findById[part.id]) target = findById[part.id];
    else if (part.text) {
      const n = normExcerpt(part.text);
      if (findByExcerpt[n]) target = findByExcerpt[n];
    }
    let compIndex = null;
    if (target) compIndex = target.si;
    else {
      const m = /^[Cc]([1-5])$/.exec(part.type);
      if (m) compIndex = parseInt(m[1], 10) - 1;
      else if (/^r$/i.test(part.type)) compIndex = 0;
      // Marcadores FUVEST: NP→0, GEN→1, COE→2, TEMA→3
      else if (/^NP$/i.test(part.type)) compIndex = 0;
      else if (/^GEN$/i.test(part.type)) compIndex = 1;
      else if (/^COE$/i.test(part.type)) compIndex = 2;
      else if (/^TEMA$/i.test(part.type)) compIndex = 3;
    }
    return { compIndex, domId: target ? target.domId : null };
  };

  const toggleComp = (i) => setVisible((v) => v.map((val, idx) => (idx === i ? !val : val)));
  const showAll = () => setVisible((correction.stages || []).map(() => true));
  const hideAll = () => setVisible((correction.stages || []).map(() => false));

  const focusEl = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-offset-1', 'ring-primary/60');
    setTimeout(() => el.classList.remove('ring-2', 'ring-offset-1', 'ring-primary/60'), 1400);
  };

  return (
    <div className="space-y-4">
      {/* Diagnóstico (mesmo estilo da home) */}
      <Card className="p-0 overflow-hidden" style={{ borderRadius: '2rem' }}>
        <div className="relative rounded-[2rem] bg-[#433c3f] p-6 text-gray-50 md:p-8">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e9861a]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold">Diagnóstico da redação</span>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{banca.name}</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-extrabold tracking-tight text-[#e9861a]">{correction.final_grade}</span>
              <span className="text-lg text-white/70">/ {maxGrade}</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#e9861a] transition-all" style={{ width: `${gradePercent}%` }} />
            </div>
            <div className="mt-5 space-y-2.5">
              {(correction.stages || []).map((stage, i) => {
                const pct = stage.max_score ? Math.min(100, Math.round((stage.score / stage.max_score) * 100)) : 0;
                return (
                  <div key={i} className="rounded-2xl border border-white/15 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/85">{stage.stage.split('—')[0].trim()}</span>
                      <span className="font-bold text-[#e9861a]">{stage.score}/{stage.max_score}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-[#e9861a] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Annotated Essay */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Sua redação corrigida
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(correction.stages || []).map((s, i) => {
            const c = compColor(i);
            const label = (s.stage || `Competência ${i + 1}`).split('—')[0].trim();
            return (
              <label
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${visible[i] ? `${c.chip}` : 'bg-muted text-muted-foreground border-border'}`}
              >
                <input type="checkbox" checked={!!visible[i]} onChange={() => toggleComp(i)} className="h-3 w-3" />
                {label}
              </label>
            );
          })}
          <button type="button" onClick={showAll} className="text-xs font-semibold text-primary hover:underline">Todas</button>
          <button type="button" onClick={hideAll} className="text-xs font-semibold text-muted-foreground hover:underline">Nenhuma</button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Toque em um trecho grifado para ir à explicação. Use os filtros acima para ver as marcações por competência.</p>
        <div className="text-sm">
          {splitParagraphs(annotated).map((para, pi) => (
            <p key={pi} className="mb-4 leading-7 last:mb-0">
              {para.map((part, i) => {
                if (part.type === 'plain') return <span key={`${pi}-${i}`}>{part.text}</span>;
                const { compIndex, domId } = resolveMarker(part);
                if (compIndex === null || !visible[compIndex]) return <span key={`${pi}-${i}`}>{part.text}</span>;
                const c = compColor(compIndex);
                if (domId) {
                  return (
                    <button
                      key={`${pi}-${i}`}
                      id={part.id ? `hl-${part.id}` : undefined}
                      type="button"
                      onClick={() => focusEl(domId)}
                      title="Ver explicação"
                      className={`${c.chip} cursor-pointer rounded px-0.5 border hover:brightness-95`}
                    >
                      {part.text}
                    </button>
                  );
                }
                return <span key={`${pi}-${i}`} className={`${c.chip} rounded px-0.5 border`}>{part.text}</span>;
              })}
            </p>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[10px] leading-tight text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          Correção gerada por IA — pode conter erros. Revise antes de considerar a nota final.
        </p>
      </Card>

      {/* Stages */}
      {correction.stages?.map((stage, si) => (
        <Card key={si} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">{stage.stage}</h4>
            <span className="text-sm font-bold" style={{ color: banca.color }}>
              {stage.score} / {stage.max_score}
            </span>
          </div>
          {stage.summary && <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{stage.summary}</p>}
          <div className="space-y-3">
            {stage.findings?.map((f, fi) => {
              const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.warning;
              const Icon = cfg.icon;
              const fid = f.id || `s${si}-f${fi}`;
              return (
                <div key={fi} id={`finding-${fid}`} className={`scroll-mt-24 rounded-lg border p-3 ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium mb-1 italic text-foreground/90">"{f.excerpt}"</p>
                        {f.id && (
                          <button type="button" onClick={() => focusEl(`hl-${f.id}`)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0">
                            <ArrowUp className="w-3.5 h-3.5" /> Ver no texto
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 mb-1">{f.explanation}</p>
                      {f.suggestion && (
                        <p className="text-sm text-muted-foreground"><strong>Como melhorar:</strong> {f.suggestion}</p>
                      )}
                      {f.video_suggestion && (
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(f.video_suggestion + ' redação vestibular')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-red-600 hover:text-red-700 hover:underline"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                          Vídeoaula: {f.video_suggestion}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {correction.memorable_strengths?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Acertos memoráveis</h3>
          <ul className="space-y-2">{correction.memorable_strengths.slice(0, 3).map((strength, i) => <li key={i} className="text-sm text-foreground/80 flex gap-2"><span className="text-primary">•</span>{strength}</li>)}</ul>
        </Card>
      )}

      {/* Writing Suggestions */}
      {correction.writing_suggestions?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Sugestões de escrita
          </h3>
          <ul className="space-y-2">
            {correction.writing_suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-amber-500 flex-shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Study Suggestions */}
      {correction.study_suggestions?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Sugestões de estudos
          </h3>
          <ul className="space-y-2">
            {correction.study_suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-primary flex-shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Resumo em tabela */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Resumo de correções
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Competência</TableHead>
                <TableHead className="w-[70px] text-right">Nota</TableHead>
                <TableHead>Parecer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {correction.stages?.map((stage, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{stage.stage}</TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap" style={{ color: banca.color }}>
                    {stage.score}/{stage.max_score}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{stage.summary || '—'}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Nota final</TableCell>
                <TableCell className="text-right font-bold whitespace-nowrap" style={{ color: banca.color }}>
                  {correction.final_grade}/{maxGrade}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">Soma das competências</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {correction.stages?.some(s => s.findings?.length > 0) && (
          <div className="mt-5 overflow-x-auto">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detalhamento dos apontamentos</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Competência</TableHead>
                  <TableHead className="w-[90px]">Tipo</TableHead>
                  <TableHead>Trecho</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Sugestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {correction.stages.flatMap((stage, si) =>
                  (stage.findings || []).map((f, fi) => {
                    const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.warning;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={`${si}-${fi}`} className={f.id ? 'cursor-pointer hover:bg-muted/50' : ''} onClick={f.id ? () => focusEl(`hl-${f.id}`) : undefined}>
                        <TableCell className="text-xs font-medium">{stage.stage.split('—')[0].trim()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            <Icon className="w-3 h-3" /> {FINDING_TYPE_LABEL[f.type] || f.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs italic text-foreground/90">{f.excerpt || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.explanation || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.suggestion || '—'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}