import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PendingRequests({ pending, onReview }) {
  const [busy, setBusy] = useState(null); // { id, decision }
  const { toast } = useToast();

  const review = async (m, decision) => {
    if (busy) return;
    if (decision === 'rejected' && !window.confirm(`Recusar a solicitação de ${m.student_name || 'este aluno'}?`)) return;
    setBusy({ id: m.id, decision });
    try {
      await onReview(m.id, decision);
    } catch {
      toast({
        title: decision === 'approved'
          ? 'Não foi possível aprovar a solicitação. Tente novamente.'
          : 'Não foi possível recusar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

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
            <Button size="icon" variant="outline" aria-label="Recusar" disabled={!!busy} onClick={() => review(m, 'rejected')}>
              {busy?.id === m.id && busy?.decision === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </Button>
            <Button size="icon" aria-label="Aprovar" disabled={!!busy} onClick={() => review(m, 'approved')}>
              {busy?.id === m.id && busy?.decision === 'approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
