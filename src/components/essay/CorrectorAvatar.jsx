import React from 'react';
import { Image } from '@/components/ui/image';

// Placeholder genérico do corretor (lápis em círculo roxo) — usado como fallback
// para bancas sem logo própria. Editável por banca depois.
const FALLBACK_LOGO = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/8aa46b329_image.png';

export default function CorrectorAvatar({ banca, size = 32, className = '' }) {
  const src = banca?.logo_url || FALLBACK_LOGO;
  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-full bg-card ring-1 ring-border flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={`Corretor ${banca?.name || ''}`} fittingType="fit" className="w-full h-full" />
    </div>
  );
}