import React, { useState, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

export default function UploadArea({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }

  return (
    <div
      className={`border border-foreground/40 rounded-sm p-8 text-center transition-all cursor-pointer hover:-translate-y-0.5 ${
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Enviar foto da redação"
        data-testid="essay-file-input"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-sm border border-foreground/30 bg-transparent flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">Envie a foto da sua redação</p>
          <p className="text-xs text-muted-foreground mt-1">Clique para selecionar ou arraste uma imagem</p>
        </div>
      </div>
    </div>
  );
}