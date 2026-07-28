import React from 'react';
import { Image } from '@/components/ui/image';

const logoUrl = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/30cfd68ae_image.png';

export default function IArgumentoLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="IArgumento">
      <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/56e253dba_ICON_logo.png" alt="Ícone IArgumento" fittingType="fit" className="h-12 w-12" />
      <span className="font-display font-extrabold tracking-[-0.03em] text-[#E9861A] text-4xl">IArgumento</span>
    </div>);

}