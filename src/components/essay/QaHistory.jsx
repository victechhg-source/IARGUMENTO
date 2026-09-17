import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

// Visualização somente leitura das dúvidas feitas sobre a correção.
// Exibida no histórico; a abertura de novas dúvidas acontece apenas no
// fluxo de resultado da correção (Correction.jsx).
export default function QaHistory({ qa = [] }) {
  if (!qa || qa.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        Dúvidas sobre esta correção
      </h3>
      <div className="space-y-3">
        {qa.map((m, i) => (
          <div key={i} className="space-y-1.5">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              {m.question}
            </div>
            <div className="mr-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-card-foreground">
              {m.answer}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}