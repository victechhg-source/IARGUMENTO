// Referência somente-leitura dos prompts reais dos corretores, exposta no
// painel administrativo para AUDITORIA da IA. Importados diretamente dos
// fontes do corretor (runCorrectionAgent/* e genericBancaPrompt) para evitar
// divergência: se o prompt mudar no código, o painel reflete automaticamente.
import { ENEM_PROMPT_C1, ENEM_PROMPT_C23, ENEM_PROMPT_C45 } from '../../base44/functions/runCorrectionAgent/enemSystemPrompts';
import { FUVEST_PROMPT_NP, FUVEST_PROMPT_GEN_COE, FUVEST_PROMPT_TEMA } from '../../base44/functions/runCorrectionAgent/fuvestSystemPrompts';
import { UFG_PROMPT_MOD, UFG_PROMPT_TEMA, UFG_PROMPT_GENERO_COESAO } from '../../base44/functions/runCorrectionAgent/ufgSystemPrompts';
import { PUC_PROMPT_C1, PUC_PROMPT_C2, PUC_PROMPT_C3 } from '../../base44/functions/runCorrectionAgent/pucSystemPrompts';
import { UFU_PROMPT_C1, UFU_PROMPT_C2, UFU_PROMPT_C3 } from '../../base44/functions/runCorrectionAgent/ufuSystemPrompts';
import { UNIRV_PROMPT_C1, UNIRV_PROMPT_C2, UNIRV_PROMPT_C3 } from '../../base44/functions/runCorrectionAgent/unirvSystemPrompts';
import { GENERIC_BANCAS, buildGenericCorrectionPrompt } from '../../base44/shared/genericBancaPrompt';

// Prompts especialistas das bancas com arquitetura fixa (correção em paralelo).
export const SPECIALIST_PROMPTS = {
  ENEM: [
    { label: 'Especialista C1 — Norma Padrão (0–200)', prompt: ENEM_PROMPT_C1 },
    { label: 'Especialista C2-3 — Tema e Repertório (0–200 cada)', prompt: ENEM_PROMPT_C23 },
    { label: 'Especialista C4-5 — Coesão e Intervenção (0–200 cada)', prompt: ENEM_PROMPT_C45 },
  ],
  FUVEST: [
    { label: 'Corretor 1 — Norma Padrão (0–10)', prompt: FUVEST_PROMPT_NP },
    { label: 'Corretor 2 — Gênero Textual + Coesão/Coerência (0–10 / 0–15)', prompt: FUVEST_PROMPT_GEN_COE },
    { label: 'Corretor 3 — Tema e Coletânea (0–15)', prompt: FUVEST_PROMPT_TEMA },
  ],
  UFG: [
    { label: 'Corretor 1 — Modalidade Escrita (0–5)', prompt: UFG_PROMPT_MOD },
    { label: 'Corretor 2 — Tema (0–9)', prompt: UFG_PROMPT_TEMA },
    { label: 'Corretor 3 — Gênero Textual + Coesão/Coerência (0–5 / 0–5)', prompt: UFG_PROMPT_GENERO_COESAO },
  ],
  PUC: [
    { label: 'C1 — Gênero/Condição Enunciativa + Tema/Projeto de Texto (0–2,5 cada)', prompt: PUC_PROMPT_C1 },
    { label: 'C2 — Argumentação e Uso da Coletânea/Repertório (0–2,5)', prompt: PUC_PROMPT_C2 },
    { label: 'C3 — Coesão, Estilo e Norma Culta (0–2,5)', prompt: PUC_PROMPT_C3 },
  ],
  UNIRV: [
    { label: 'C1 — Aspectos Gramaticais (0–3,0 | escala por erros)', prompt: UNIRV_PROMPT_C1 },
    { label: 'C2 — Apresentação do Texto (0–1,0) + Aspectos Estruturais (0–4,0)', prompt: UNIRV_PROMPT_C2 },
    { label: 'C3 — Anulação (ELIMINADO) + Penalidade Especial (-1,0 ou 0)', prompt: UNIRV_PROMPT_C3 },
  ],
  UFU: [
    { label: 'C1 — Gramática e Norma Culta (0–2,0 base / 0–8,0 final)', prompt: UFU_PROMPT_C1 },
    { label: 'C2 — Coerência (0–6,0/24,0) + Coesão (0–4,0/16,0)', prompt: UFU_PROMPT_C2 },
    { label: 'C3 — Estrutura: Gênero, Tema, Paráfrase, Repertório, Máscara (0–8,0/32,0)', prompt: UFU_PROMPT_C3 },
  ],
};

// Prompt genérico das bancas de chamada única (UNICAMP/UNIFESP e futuras).
export function genericPromptFor(bancaId) {
  const banca = GENERIC_BANCAS.find((b) => b.id === bancaId);
  if (!banca) return null;
  return {
    name: banca.name,
    full_name: banca.full_name,
    max_grade: banca.max_grade,
    criteria: banca.official_criteria,
    schoolCriteria: banca.school_criteria,
    stages: banca.stages,
    fullPrompt: buildGenericCorrectionPrompt(banca, '[REDAÇÃO DO ALUNO TRANSCRITA AQUI]'),
  };
}