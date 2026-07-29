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
 * Só marca como dúvida genuína (grifo) divergência de PALAVRA inteira;
 * ambiguidades de uma única letra/acento são resolvidas pelo contexto e
 * não são grifadas.
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

    // Palavra explicitamente ilegível [?] → dúvida genuína (grifa a palavra)
    if (primaryWord.includes('?') || secondaryWord.includes('?')) {
      const cleaned = primaryWord.replace(/[?\[\]]/g, '').trim();
      unrecognizedWords.push(cleaned || '[ilegível]');
      segments.push({ text: primaryWord || secondaryWord, confidence: 0.2, issues: ['Palavra marcada como ilegível pelo reconhecedor'] });
      continue;
    }

    const np = normalizeWord(primaryWord);
    const ns = normalizeWord(secondaryWord);

    // Concordam (ignora acento, caixa e pontuação) → contexto resolve
    if (np && ns && np === ns) {
      segments.push({ text: primaryWord, confidence: 0.92, issues });
      continue;
    }

    // Falta de um dos lados → dúvida genuína
    if (!primaryWord || !secondaryWord) {
      segments.push({ text: primaryWord || secondaryWord, confidence: 0.4, issues: ['Reconhecedores com extenso divergente'] });
      continue;
    }

    // Diferença de UMA letra (ou só acento) que o contexto resolve → não grifa
    if (levenshtein(np, ns) <= 1) {
      segments.push({ text: primaryWord, confidence: 0.78, issues });
      continue;
    }

    // Divergência de PALAVRA inteira → dúvida genuína (grifa)
    segments.push({
      text: primaryWord,
      confidence: 0.4,
      issues: [`Reconhecedores divergem na palavra: "${primaryWord}" vs "${secondaryWord}"`]
    });
  }

  const flaggedCount = segments.filter(s => s.confidence < 0.6).length;
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

function stripAccents(word: string): string {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeWord(word: string): string {
  return stripAccents(word)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[m];
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