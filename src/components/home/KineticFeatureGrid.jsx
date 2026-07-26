import React from 'react';
import { Camera, MessageSquare, PenLine } from 'lucide-react';

const FEATURES = [
  { icon: Camera, title: 'Foto da redação', desc: 'Envie uma imagem nítida do seu texto escrito à mão' },
  { icon: MessageSquare, title: 'Leitura em contexto', desc: 'Acompanhe cada etapa em uma conversa direta' },
  { icon: PenLine, title: 'Correção detalhada', desc: 'Entenda os desvios e encontre caminhos para evoluir' },
];

export default function KineticFeatureGrid() {
  return (
    <div className="kinetic-feature-grid" aria-label="Como funciona">
      {FEATURES.map(({ icon: Icon, title, desc }, index) => (
        <article key={title} className={`kinetic-feature kinetic-feature-${index + 1}`}>
          <div className="kinetic-icon"><Icon className="h-5 w-5" strokeWidth={1.7} /></div>
          <h2>{title}</h2>
          <p>{desc}</p>
        </article>
      ))}
    </div>
  );
}