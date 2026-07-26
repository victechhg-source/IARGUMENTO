import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check } from 'lucide-react';

export default function TranscriptionReview({ transcription, unrecognized, onConfirm }) {
  const [text, setText] = useState(transcription);

  return (
    <div className="space-y-4">
      {unrecognized.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Palavras não reconhecidas:</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {unrecognized.map((w, i) => (
                <span key={i} className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-medium">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Revise a transcrição:</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] text-sm leading-relaxed"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Edite o texto se necessário. Palavras marcadas com [?] não puderam ser lidas com clareza.
        </p>
      </div>

      <Button className="w-full" onClick={() => onConfirm(text)}>
        <Check className="w-4 h-4 mr-2" />
        Confirmar texto e iniciar correção
      </Button>
    </div>
  );
}