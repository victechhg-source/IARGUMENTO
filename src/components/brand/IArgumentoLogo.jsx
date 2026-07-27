import React from 'react';
import { Image } from '@/components/ui/image';

const logoUrl = 'https://media.base44.com/images/public/6a6602cb58785bab45511cab/30cfd68ae_image.png';

export default function IArgumentoLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="IArgumento">
      <Image src={logoUrl} alt="Argumento" fittingType="fit" className="h-9 w-36" />
      <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary-foreground">i</span>
    </div>
  );
}