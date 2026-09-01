// Referência estática da arquitetura de cada agente do sistema.
// Os prompts especialistas de ENEM/FUVEST/UFG e do OCR vivem no código do
// corretor (runCorrectionAgent) e do OCR (processEssayScan) e são fixos por
// decisão do time — não são editáveis pelo painel. O prompt editável no
// painel (agent.system_prompt) é uma camada de instruções adicionais
// anexada ao prompt base (já ativa para UNICAMP/UNIFESP; para ENEM/FUVEST/UFG
// não altera os especialistas).

export const MODELS = [
  'automatic',
  'gpt_5_mini',
  'gemini_3_flash',
  'gpt_5_4',
  'gpt_5_6_sol',
  'gpt_5_6_luna',
  'gemini_3_1_pro',
  'claude_sonnet_4_6',
  'claude_opus_4_6',
  'claude_opus_4_7',
  'claude_opus_4_8',
  'claude-sonnet-5',
];

export const BANCA_OPTIONS = ['ENEM', 'FUVEST', 'UNICAMP', 'PUC', 'UFG'];

export const OCR_RECOGNIZER_PROMPTS = {
  primary:
    'Você é o reconhecedor primário de OCR. Transcreva fielmente a redação manuscrita em português brasileiro. PRESERVE a paragrafação original: separe cada parágrafo com UMA linha em branco. Mantenha a pontuação. USE O CONTEXTO da frase para resolver ambiguidades de uma única letra ou de acentuação — NÃO marque essas como dúvida. Marque palavra[?] APENAS quando uma PALAVRA inteira permanecer ilegível. Não invente conteúdo.',
  secondary:
    'Você é um reconhecedor independente de OCR. Sua tarefa é transcrever a redação manuscrita de forma autônoma, sem assumir contexto. Se não conseguir ler uma palavra, marque com [?]. PRESERVE a paragrafação original, separando cada parágrafo com UMA linha em branco.',
};

// Agente de sistema (não vive no banco — referência fixa).
export const OCR_AGENT = {
  id: '__ocr__',
  name: 'OCR — Reconhecimento',
  banca: 'OCR',
  fixed: true,
  editable: false,
  model: 'automatic (visão)',
  maxGrade: null,
  architecture:
    'Duplo reconhecedor (primário + secundário) em paralelo + fallback ExtractDataFromUploadedFile + validação determinística (confiança, segmentos, avisos de estrutura). Roteia para revisão do aluno.',
  specialists: [
    { name: 'Reconhecedor primário', role: 'Transcrição fiel, usando contexto para resolver ambiguidades.' },
    { name: 'Reconhecedor secundário', role: 'Transcrição autônoma, sem assumir contexto (marca [?]).' },
  ],
};

export const BANCA_ARCHITECTURES = {
  ENEM: {
    fixed: true,
    maxGrade: 1000,
    architecture:
      '3 especialistas em paralelo + extração determinística de notas (marcador NOTA_FINAL_Cx) + 1 chamada de síntese que monta a devolutiva final.',
    specialists: [
      { name: 'Especialista C1', role: 'Norma-padrão e estrutura sintática (0–200).' },
      { name: 'Especialista C2-3', role: 'Tema, repertório, projeto de texto e argumentação (0–200 cada).' },
      { name: 'Especialista C4-5', role: 'Coesão e proposta de intervenção (0–200 cada).' },
    ],
  },
  FUVEST: {
    fixed: true,
    maxGrade: 50,
    architecture:
      '3 especialistas em paralelo + extração determinística de notas + síntese. Corretores 2 e 3 são 15% mais rígidos (sem benefício da dúvida).',
    specialists: [
      { name: 'Norma Padrão', role: 'Ortografia, gramática, regência, concordância (0–10).' },
      { name: 'Gênero + Coesão', role: 'Gênero textual/projeto (0–10) + coesão e coerência (0–15).' },
      { name: 'Tema e Coletânea', role: 'Tema, coletânea e indícios de autoria (0–15).' },
    ],
  },
  UFG: {
    fixed: true,
    maxGrade: 24,
    architecture:
      '3 especialistas em paralelo + extração determinística de notas + síntese. Corte eliminatório de 10 pontos.',
    specialists: [
      { name: 'Modalidade Escrita', role: 'Norma-padrão, sintaxe e registro (0–5).' },
      { name: 'Tema', role: 'Tema, coletânea e repertório (0–9).' },
      { name: 'Gênero + Coesão', role: 'Gênero textual (0–5) + coesão/coerência (0–5).' },
    ],
  },
  UNICAMP: {
    fixed: false,
    maxGrade: 100,
    architecture:
      'Chamada única com prompt genérico da banca + instruções adicionais do agente + base de RAG. O prompt editado aqui é aplicado ao vivo.',
    specialists: [],
  },
  PUC: {
    fixed: true,
    maxGrade: 10,
    architecture:
      '3 especialistas em paralelo + extração determinística de notas (marcadores NOTA_FINAL_*) + 1 chamada de síntese. Gêneros: Artigo de Opinião, Carta Argumentativa ou Crônica. Extensão: 15–30 linhas (teto 4,0 se < 15 linhas). Assinatura proibida em Carta.',
    specialists: [
      { name: 'C1 — Gênero + Tema', role: 'Gênero/Condição Enunciativa (0–2.5) + Tema/Projeto de Texto (0–2.5). Detecta gênero, mapeia as 8 perguntas enunciativas, aplica regras duras (extensão, título, assinatura).' },
      { name: 'C2 — Argumentação', role: 'Argumentação e Uso da Coletânea/Repertório (0–2.5). Avalia diálogo crítico com a coletânea, movimentos argumentativos e repertório sociocultural.' },
      { name: 'C3 — Coesão + Norma', role: 'Coesão, Estilo e Norma Culta (0–2.5). ÚNICO que reproduz a transcrição com desvios em negrito. Fórmula de cruzamento: (Norma_Culta + Coesao_Estilo) / 4.0 × 2.5.' },
    ],
  },
};

export function architectureFor(banca) {
  return (
    BANCA_ARCHITECTURES[banca] || {
      fixed: false,
      maxGrade: null,
      architecture:
        'Chamada única com prompt genérico da banca + instruções adicionais do agente + base de RAG. Novas bancas usam este fluxo automaticamente.',
      specialists: [],
    }
  );
}