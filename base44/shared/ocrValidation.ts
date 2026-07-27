/**
 * Validador determinístico para transcrições de redação manuscrita.
 * Aplica regras linguísticas e de negócio independentes de LLM.
 */

// Marcadores de baixa confiança que podem aparecer na transcrição
const UNCERTAIN_MARKERS = /\[?\?\]?/g;

// Palavras extremamente comuns em redações que, se ausentes, podem indicar problemas
const COMMON_CONNECTORS = ['que', 'uma', 'com', 'para', 'não', 'uma', 'mais', 'como', 'mas'];

// Palavras vazias muito curtas que provavelmente são ruído de OCR
const NOISE_PATTERNS = /^[a-zà-ú]{1}$/i;

export interface Segment {
  text: string;
  confidence: number;
  issues: string[];
}

export interface ValidationResult {
  segments: Segment[];
  overallConfidence: number;
  unrecognizedWords: string[];
  flaggedCount: number;
}

/**
 * Divide a transcrição em segmentos (por palavra) e valida cada um.
 */
export function validateTranscription(
  primaryText: string,
  secondaryText: string
): ValidationResult {
  const primaryWords = primaryText.split(/\s+/).filter(Boolean);
  const secondaryWords = secondaryText.split(/\s+/).filter(Boolean);
  const maxLen = Math.max(primaryWords.length, secondaryWords.length);

  const segments: Segment[] = [];
  const unrecognizedWords: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const primaryWord = primaryWords[i] || '';
    const secondaryWord = secondaryWords[i] || '';
    const issues: string[] = [];

    // Confiança base: os dois reconhecedores concordam?
    const normalizedPrimary = normalizeWord(primaryWord);
    const normalizedSecondary = normalizeWord(secondaryWord);
    const agree = normalizedPrimary === normalizedSecondary;

    let confidence = agree ? 0.95 : 0.45;

    // Marcador de incerteza explícito [?]
    if (UNCERTAIN_MARKERS.test(primaryWord)) {
      confidence = 0.2;
      issues.push('Palavra marcada como ilegível pelo reconhecedor primário');
      unrecognizedWords.push(primaryWord.replace(UNCERTAIN_MARKERS, '').trim() || '[ilegível]');
    }

    // Ruído: palavra de 1 caractere que não é pontuação
    if (NOISE_PATTERNS.test(primaryWord) && !['a', 'e', 'o', 'é', 'à', 'os', 'as', 'um'].includes(primaryWord.toLowerCase())) {
      confidence = Math.min(confidence, 0.3);
      issues.push('Token muito curto — possível ruído de OCR');
    }

    // Desalinhamento entre reconhecedores
    if (!agree && primaryWord && secondaryWord) {
      issues.push(`Reconhecedores divergem: "${primaryWord}" vs "${secondaryWord}"`);
      confidence = Math.min(confidence, 0.5);
    }

    // Palavra faltando em um dos lados
    if (!primaryWord || !secondaryWord) {
      confidence = Math.min(confidence, 0.4);
      issues.push('Extenso do texto divergente entre reconhecedores');
    }

    segments.push({ text: primaryWord, confidence, issues });
  }

  const flaggedCount = segments.filter(s => s.confidence < 0.7).length;
  const overallConfidence = segments.length > 0
    ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
    : 0;

  return {
    segments,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    unrecognizedWords: [...new Set(unrecognizedWords)],
    flaggedCount
  };
}

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(UNCERTAIN_MARKERS, '')
    .replace(/[.,;:!?"'()]/g, '')
    .trim();
}

/**
 * Verifica coerência estrutural básica do texto transcrito.
 */
export function validateStructure(text: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (text.trim().length < 100) {
    warnings.push('Texto muito curto — pode haver falha na detecção de linhas');
  }

  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  if (sentenceCount < 3) {
    warnings.push('Poucas marcações de fim de frase — verificar pontuação');
  }

  const paragraphCount = text.split(/\n\s*\n/).filter(Boolean).length;
  if (paragraphCount < 2) {
    warnings.push('Poucos parágrafos detectados — verificar estrutura');
  }

  return { valid: warnings.length === 0, warnings };
}