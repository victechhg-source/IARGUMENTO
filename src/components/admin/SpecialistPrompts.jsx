import { SPECIALIST_PROMPTS, genericPromptFor } from '@/data/correctionPrompts';

// Exibe os prompts reais do corretor da banca selecionada, somente leitura,
// para auditoria da IA. Usa <details> para não estourar a página.
export default function SpecialistPrompts({ banca }) {
  const specialists = SPECIALIST_PROMPTS[banca];
  const generic = !specialists ? genericPromptFor(banca) : null;
  if (!specialists && !generic) return null;

  const Wrapper = ({ label, children, maxHeight = 'max-h-[28rem]' }) => (
    <details className="group rounded-lg border border-border bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-muted/60">
        <span>{label}</span>
        <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <pre className={`whitespace-pre-wrap text-[11px] leading-snug bg-muted rounded-b-lg p-3 overflow-auto ${maxHeight}`}>{children}</pre>
    </details>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">
        Prompts do corretor (somente leitura — auditoria){' '}
        {!specialists && <span className="font-normal">· chamada única com prompt genérico</span>}
      </p>
      {specialists?.map((s, i) => (
        <Wrapper key={i} label={s.label}>{s.prompt}</Wrapper>
      ))}
      {generic && (
        <>
          <Wrapper label="Critérios oficiais da banca" maxHeight="max-h-48">{generic.criteria}</Wrapper>
          <Wrapper label="Critérios complementares da escola (peso menor)" maxHeight="max-h-48">{generic.schoolCriteria}</Wrapper>
          <Wrapper label="Grade de etapas (correção por etapa)" maxHeight="max-h-48">
            {generic.stages.map((s) => `${s.name} — ${s.description} (máx. ${s.max_score} pts)`).join('\n')}
          </Wrapper>
          <Wrapper label="Prompt completo enviado ao modelo">{generic.fullPrompt}</Wrapper>
        </>
      )}
    </div>
  );
}