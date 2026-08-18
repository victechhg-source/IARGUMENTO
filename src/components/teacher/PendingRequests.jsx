import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

export default function PendingRequests({ pending, onReview }) {
  if (!pending.length) return null;
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3">Solicitações pendentes</h2>
      <div className="space-y-2">
        {pending.map((m) => (
          <div key={m.id} className="flex items-center gap-3 border rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{m.student_name}</p>
              <p className="text-sm text-muted-foreground truncate">{m.student_email}</p>
            </div>
            <Button size="icon" variant="outline" aria-label="Recusar" onClick={() => onReview(m.id, 'rejected')}><X className="w-4 h-4" /></Button>
            <Button size="icon" aria-label="Aprovar" onClick={() => onReview(m.id, 'approved')}><Check className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}