import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, XCircle, Youtube, Lightbulb, BookOpen, GraduationCap } from 'lucide-react';

const TYPE_CONFIG = {
  correct: { icon: Check, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Acerto' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Atenção' },
  error: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Erro' }
};

const SPAN_CLASS = {
  c: 'bg-green-100 text-green-900 px-1 rounded',
  w: 'bg-amber-100 text-amber-900 px-1 rounded',
  e: 'bg-red-100 text-red-900 px-1 rounded',
  plain: ''
};

function parseAnnotatedText(text) {
  if (!text) return [];
  const regex = /\[\[(c|w|e):(.*?)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', text: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: match[1], text: match[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'plain', text: text.slice(lastIndex) });
  }
  return parts;
}

export default function CorrectionResults({ correction, banca }) {
  const annotated = parseAnnotatedText(correction.annotated_text);
  const maxGrade = correction.max_grade || banca.max_grade;
  const gradePercent = (correction.final_grade / maxGrade) * 100;

  return (
    <div className="space-y-4">
      {/* Final Grade */}
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Nota Final</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold" style={{ color: banca.color }}>
            {correction.final_grade}
          </span>
          <span className="text-lg text-muted-foreground">/ {maxGrade}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${gradePercent}%`, background: banca.color }} />
        </div>
      </Card>

      {/* Annotated Essay */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Sua redação corrigida
        </h3>
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded border border-green-300"></span> Acertos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 rounded border border-amber-300"></span> Avisos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded border border-red-300"></span> Erros</span>
        </div>
        <div className="text-sm leading-7 whitespace-pre-wrap">
          {annotated.map((part, i) => (
            <span key={i} className={SPAN_CLASS[part.type]}>{part.text}</span>
          ))}
        </div>
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
          <div className="space-y-3">
            {stage.findings?.map((f, fi) => {
              const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.warning;
              const Icon = cfg.icon;
              return (
                <div key={fi} className={`rounded-lg border p-3 ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1 italic text-foreground/90">"{f.excerpt}"</p>
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
    </div>
  );
}