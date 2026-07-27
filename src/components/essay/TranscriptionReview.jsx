import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function TranscriptionReview({ transcription, unrecognized, confidence, flaggedSegments, onConfirm }) {
  const [text, setText] = useState(transcription);

  const lowConfidenceWords = useMemo(() => {
    return new Set((flaggedSegments || []).map(s => s.text.toLowerCase().replace(/[.,;:!?"'()]/g, '')));
  }, [flaggedSegments]);

  const confidencePct = Math.round((confidence || 0) * 100);
  const hasFlagged = (flaggedSegments || []).length > 0;

  return (
    <div className="space-y-4">
      {/* Indicador de confiança — sempre exige revisão manual */}
      <div className={`flex items-start gap-2 rounded-lg border p-3 ${hasFlagged ? 'bg-amber-50 border-amber-200' : 'bg-sky-50 border-sky-200'}`}>
        {hasFlagged ? <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" /> : <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />}
        <div className="text-sm flex-1">
          <p className={`font-medium ${hasFlagged ? 'text-amber-900' : 'text-sky-900'}`}>
            Confiança do reconhecimento: {confidencePct}%
          </p>
          <p className={`mt-0.5 ${hasFlagged ? 'text-amber-700' : 'text-sky-700'}`}>
            {hasFlagged
              ? `${(flaggedSegments || []).length} segmento(s) com baixa confiança destacados abaixo. Revise com atenção antes de confirmar.`
              : 'Reconhecimento com boa confiança, mas a confirmação do aluno é sempre obrigatória antes da correção.'}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
            <div className="h-full rounded-full transition-all bg-primary" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>
      </div>

      {unrecognized.length > 0 && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-900">Palavras ilegíveis detectadas:</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {unrecognized.map((w, i) => (
                <span key={i} className="bg-red-200 text-red-900 text-xs px-2 py-0.5 rounded-full font-medium">{w}</span>
              ))}
            </div>
            <p className="mt-2 text-xs text-red-700">Substitua ou remova as marcações [?] no texto abaixo.</p>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">
          Revise a transcrição {hasFlagged && '— trechos destacados precisam de atenção:'}
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] text-sm leading-relaxed"
        />
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-200 rounded border border-amber-400" /> Baixa confiança</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded border border-red-400" /> Ilegível</span>
        </div>
      </div>

      <Button className="w-full" onClick={() => onConfirm(text)}>
        <Check className="w-4 h-4 mr-2" />
        Confirmar texto validado e iniciar correção
      </Button>
    </div>
  );
}