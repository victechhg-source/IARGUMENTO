import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import { Plus, Minus } from 'lucide-react';

const ROWS = [
  {
    id: 'transcricao',
    title: 'Transcrição inteligente',
    image: 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/f7a5dce4a_generated_image.png',
    alt: 'Redação manuscrita sendo transcrita',
    body: 'Sua redação manuscrita é lida com fidelidade. Palavras incertas ficam destacadas para você revisar antes da correção.'
  },
  {
    id: 'correcao',
    title: 'Correção por banca',
    image: 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/b39775983_generated_image.png',
    alt: 'Redação sendo corrigida com caneta vermelha',
    body: 'Cada etapa é avaliada segundo os critérios oficiais da banca escolhida — ENEM, FUVEST, UNICAMP e outras.'
  },
  {
    id: 'feedback',
    title: 'Feedback anotado',
    image: 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/a97d9054d_generated_image.png',
    alt: 'Redação com marcações e anotações nas margens',
    body: 'O texto retorna com marcações claras de erros, alertas e acertos, além de sugestões de escrita e vídeos de apoio.'
  },
  {
    id: 'historico',
    title: 'Histórico de progresso',
    image: 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/6669ad834_generated_image.png',
    alt: 'Caderno e tablet com gráficos de evolução',
    body: 'Acompanhe sua evolução banca a banca em gráficos de dispersão e identifique onde concentrar seus estudos.'
  }
];

export default function ShowcaseAccordion() {
  const [open, setOpen] = useState('transcricao');

  return (
    <section className="dsa-section">
      <style>{`
        .dsa-section {
          container-type: inline-size;
          display: flex;
          justify-content: center;
          padding: clamp(24px, 5vw, 40px) 40px;
          box-sizing: border-box;
        }
        .dsa-card {
          width: 100%;
          max-width: 366px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: hsl(var(--secondary));
          font-family: var(--font-body);
        }
        .dsa-row { background: hsl(var(--secondary)); }
        .dsa-divider { height: 1px; width: 100%; background: hsl(var(--secondary-foreground)); opacity: 0.4; }
        .dsa-row-h { margin: 0; }
        .dsa-toggle-btn {
          display: flex; width: 100%; align-items: center; justify-content: space-between;
          gap: 12px; padding: 18px 20px; text-align: left;
          background: none; border: none; outline: none; cursor: pointer;
          color: hsl(var(--secondary-foreground));
        }
        .dsa-toggle-btn:focus-visible { outline: 2px solid hsl(var(--secondary-foreground)); outline-offset: -2px; }
        .dsa-title {
          font-size: 16px; font-weight: 500; line-height: 0.99; word-break: break-word;
        }
        .dsa-toggle {
          position: relative; display: block; flex-shrink: 0;
          width: 20px; height: 20px; color: hsl(var(--secondary-foreground));
        }
        .dsa-toggle svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .dsa-toggle-sparkle { transform: scale(1) rotate(0deg); opacity: 1; }
        .dsa-toggle-minus { transform: scale(0.4); opacity: 0; }
        .dsa-row.dsa-open .dsa-toggle-sparkle { transform: scale(0.4) rotate(90deg); opacity: 0; }
        .dsa-row.dsa-open .dsa-toggle-minus { transform: scale(1); opacity: 1; }
        .dsa-panel {
          display: grid; grid-template-rows: 0fr; overflow: hidden;
          transition: grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dsa-row.dsa-open .dsa-panel { grid-template-rows: 1fr; }
        .dsa-panel-inner { overflow: hidden; min-height: 0; }
        .dsa-panel-content {
          display: flex; flex-direction: column; gap: 22px; padding: 4px 20px 30px;
        }
        .dsa-photo-wrap {
          display: flex; justify-content: center; overflow: hidden;
          width: 100%; height: 210px;
          clip-path: inset(0 0 100% 0);
          transition: clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dsa-row.dsa-open .dsa-photo-wrap { clip-path: inset(0 0 0% 0); }
        .dsa-body {
          margin: 0; font-family: var(--font-body);
          font-size: 22px; font-weight: 400; line-height: 1.2;
          color: hsl(var(--secondary-foreground));
        }
        @container (max-width: 419px) {
          .dsa-section { padding-left: 15px; padding-right: 15px; }
        }
      `}</style>

      <div className="dsa-card">
        {ROWS.map((row, i) => (
          <React.Fragment key={row.id}>
            {i > 0 && <div className="dsa-divider" aria-hidden="true" />}
            <div className={`dsa-row ${open === row.id ? 'dsa-open' : ''}`} data-value={row.id}>
              <h3 className="dsa-row-h">
                <button
                  type="button"
                  className="dsa-toggle-btn"
                  aria-expanded={open === row.id}
                  onClick={() => setOpen(open === row.id ? null : row.id)}
                >
                  <span className="dsa-title">{row.title}</span>
                  <span className="dsa-toggle" aria-hidden="true">
                    <Plus className="dsa-toggle-sparkle" />
                    <Minus className="dsa-toggle-minus" />
                  </span>
                </button>
              </h3>
              <div className="dsa-panel" role="region">
                <div className="dsa-panel-inner">
                  <div className="dsa-panel-content">
                    <div className="dsa-photo-wrap">
                      <Image
                        src={row.image}
                        alt={row.alt}
                        fittingType="fill"
                        className="h-full w-full"
                      />
                    </div>
                    <p className="dsa-body">{row.body}</p>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}