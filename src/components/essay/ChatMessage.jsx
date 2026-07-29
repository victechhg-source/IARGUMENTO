import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import CorrectorAvatar from '@/components/essay/CorrectorAvatar';

export default function ChatMessage({ message, banca, loading }) {
  const isBot = message.role === 'bot';

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <CorrectorAvatar banca={banca} size={32} className="mt-1" />
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isBot
          ? 'bg-card text-card-foreground border border-card/20 shadow-none'
          : 'bg-primary text-primary-foreground'
      }`}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </div>
        ) : isBot ? (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
      </div>
    </div>
  );
}