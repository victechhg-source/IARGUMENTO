import React from 'react';
import { BANCAS } from '@/data/bancas';
import BancaCard from '@/components/essay/BancaCard';
import { PenTool, Sparkles, Camera, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Correção inteligente com IA
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          RedaçãoPro
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Correção de redações escritas à mão com IA especializada em cada banca de vestibular.
          Envie sua redação, revise a transcrição e receba uma correção detalhada em formato de chat.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {[
            { icon: Camera, title: 'Foto da redação', desc: 'Envie a foto da sua redação escrita à mão' },
            { icon: MessageSquare, title: 'Chat interativo', desc: 'Correção humanizada em formato de conversa' },
            { icon: PenTool, title: 'Correção detalhada', desc: 'Erros explicados com sugestões de vídeoaulas' }
          ].map((f, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 text-left">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-medium text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banca selection */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold text-center mb-2">Escolha sua banca</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Cada banca tem seus próprios critérios oficiais de correção.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BANCAS.map(banca => (
            <BancaCard key={banca.id} banca={banca} />
          ))}
        </div>
      </div>
    </div>
  );
}