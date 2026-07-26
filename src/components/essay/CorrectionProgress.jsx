import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function CorrectionProgress({ stages }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-3">Corrigindo sua redação...</p>
      {stages.map((stage, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending';
        return (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            status === 'active' ? 'bg-primary/5 border-primary/30' :
            status === 'done' ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-border'
          }`}>
            <div className="flex-shrink-0">
              {status === 'done' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              ) : status === 'active' ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${status === 'pending' ? 'text-muted-foreground' : ''}`}>
                {stage.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{stage.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}