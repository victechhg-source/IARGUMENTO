export const BANCAS = [
  {
    id: "ENEM",
    name: "ENEM",
    full_name: "Exame Nacional do Ensino Médio",
    description: "Redação dissertativo-argumentativa com proposta de intervenção detalhada.",
    max_grade: 1000,
    color: "#4f46e5",
    theme: "Dissertativo-argumentativa",
    official_criteria: `A redação do ENEM é avaliada por 5 competências, cada uma valendo 200 pontos (total 1000):
1. Domínio da norma-padrão da língua escrita (gramática, ortografia, concordância, regência).
2. Compreensão da proposta, uso de repertório sociocultural e estrutura dissertativo-argumentativa.
3. Seleção, relação, organização e interpretação de argumentos, fatos e opiniões.
4. Demonstração de conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão, coerência).
5. Elaboração de proposta de intervenção para o problema abordado, respeitando direitos humanos.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Originalidade e criatividade na abordagem do tema.
- Diversidade vocabular e sofisticação na escolha de palavras.
- Uso de conectivos variados para fluidez textual.
- Profundidade na análise do repertório sociocultural.`,
    stages: [
      { name: "Norma-padrão", max_score: 200, description: "Domínio da norma-padrão: gramática, ortografia, concordância e regência" },
      { name: "Proposta e repertório", max_score: 200, description: "Compreensão da proposta, uso de repertório sociocultural e estrutura" },
      { name: "Argumentação", max_score: 200, description: "Seleção, organização e interpretação de argumentos" },
      { name: "Coesão e coerência", max_score: 200, description: "Mecanismos linguísticos de coesão e coerência argumentativa" },
      { name: "Proposta de intervenção", max_score: 200, description: "Elaboração de proposta de intervenção detalhada respeitando direitos humanos" }
    ]
  },
  {
    id: "FUVEST",
    name: "FUVEST",
    full_name: "Fundação Universitária para o Vestibular",
    description: "Redação dissertativa ou narrativa, com foco em originalidade e argumentação.",
    max_grade: 100,
    color: "#059669",
    theme: "Dissertativa ou narrativa",
    official_criteria: `A redação da FUVEST é avaliada por critérios de conteúdo e forma:
- Adequação ao tema e à proposta.
- Argumentação consistente e coerente.
- Estrutura textual organizada (introdução, desenvolvimento, conclusão).
- Domínio da norma-padrão (gramática, ortografia, pontuação).
- Originalidade e maturidade na abordagem.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Riqueza vocabular e precisão linguística.
- Uso adequado de conectivos argumentativos.
- Profundidade crítica e leitura de mundo.
- Clareza e objetividade na exposição de ideias.`,
    stages: [
      { name: "Adequação ao tema", max_score: 25, description: "Compreensão e atendimento à proposta" },
      { name: "Argumentação", max_score: 25, description: "Consistência e coerência dos argumentos" },
      { name: "Estrutura", max_score: 20, description: "Organização textual e progressão temática" },
      { name: "Norma-padrão", max_score: 20, description: "Gramática, ortografia e pontuação" },
      { name: "Originalidade", max_score: 10, description: "Maturidade e criatividade na abordagem" }
    ]
  },
  {
    id: "UNICAMP",
    name: "UNICAMP",
    full_name: "Universidade Estadual de Campinas",
    description: "Redação com proposta temática específica, exige coerência e coesão.",
    max_grade: 100,
    color: "#dc2626",
    theme: "Dissertativa com proposta temática",
    official_criteria: `A redação da UNICAMP avalia:
- Atendimento à proposta (tipo textual exigido).
- Coerência argumentativa e desenvolvimento do tema.
- Coesão textual e uso adequado de mecanismos linguísticos.
- Norma-padrão da língua escrita.
- Capacidade de síntese e leitura crítica dos textos de apoio.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Integração criativa dos textos de apoio.
- Diversidade de repertório sociocultural.
- Precisão vocabular e elegância estilística.
- Estrutura argumentativa bem encadeada.`,
    stages: [
      { name: "Atendimento à proposta", max_score: 25, description: "Tipo textual e adequação ao tema" },
      { name: "Coerência", max_score: 25, description: "Desenvolvimento argumentativo e lógica" },
      { name: "Coesão", max_score: 20, description: "Mecanismos linguísticos de coesão" },
      { name: "Norma-padrão", max_score: 20, description: "Gramática, ortografia e pontuação" },
      { name: "Leitura crítica", max_score: 10, description: "Síntese e uso dos textos de apoio" }
    ]
  },
  {
    id: "UNIFESP",
    name: "UNIFESP",
    full_name: "Universidade Federal de São Paulo",
    description: "Redação dissertativo-argumentativa com foco em argumentação consistente.",
    max_grade: 100,
    color: "#0891b2",
    theme: "Dissertativo-argumentativa",
    official_criteria: `A redação da UNIFESP avalia:
- Compreensão e desenvolvimento do tema.
- Argumentação lógica e consistente.
- Estrutura dissertativo-argumentativa.
- Domínio da norma-padrão.
- Coesão e coerência textuais.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Uso de repertório sociocultural relevante.
- Clareza e objetividade.
- Variedade de conectivos e recursos argumentativos.
- Maturidade crítica na abordagem do tema.`,
    stages: [
      { name: "Tema e proposta", max_score: 25, description: "Compreensão e desenvolvimento do tema" },
      { name: "Argumentação", max_score: 25, description: "Lógica e consistência argumentativa" },
      { name: "Estrutura", max_score: 20, description: "Organização dissertativo-argumentativa" },
      { name: "Norma-padrão", max_score: 20, description: "Gramática, ortografia e pontuação" },
      { name: "Coesão e coerência", max_score: 10, description: "Fluidez e unidade textual" }
    ]
  },
  {
    id: "UERJ",
    name: "UERJ",
    full_name: "Universidade do Estado do Rio de Janeiro",
    description: "Redação dissertativo-argumentativa com proposta de intervenção social.",
    max_grade: 100,
    color: "#d97706",
    theme: "Dissertativo-argumentativa",
    official_criteria: `A redação da UERJ avalia:
- Compreensão e desenvolvimento da proposta.
- Argumentação consistente e posicionamento crítico.
- Coesão e coerência textuais.
- Domínio da norma-padrão.
- Proposta de intervenção para o problema abordado.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Repertório sociocultural diversificado.
- Clareza e precisão argumentativa.
- Uso adequado de conectivos lógicos.
- Maturidade e originalidade na abordagem.`,
    stages: [
      { name: "Proposta e tema", max_score: 25, description: "Compreensão e desenvolvimento da proposta" },
      { name: "Argumentação", max_score: 25, description: "Posicionamento crítico e consistência" },
      { name: "Coesão e coerência", max_score: 20, description: "Fluidez e unidade textual" },
      { name: "Norma-padrão", max_score: 20, description: "Gramática, ortografia e pontuação" },
      { name: "Proposta de intervenção", max_score: 10, description: "Elaboração de proposta de intervenção social" }
    ]
  }
];

export function buildCorrectionPrompt(banca, transcription) {
  return `Você é uma EQUIPE de corretores especializados em redações para a banca ${banca.name} (${banca.full_name}).

Você irá corrigir a redação do aluno em ETAPAS, seguindo rigorosamente os critérios oficiais da banca e os critérios complementares da escola de redações (com peso menor).

═══════════════════════════════════════
DADOS DA BANCA
═══════════════════════════════════════
Nome: ${banca.name} (${banca.full_name})
Nota máxima: ${banca.max_grade} pontos

═══════════════════════════════════════
CRITÉRIOS OFICIAIS DA BANCA
═══════════════════════════════════════
${banca.official_criteria}

═══════════════════════════════════════
CRITÉRIOS COMPLEMENTARES DA ESCOLA DE REDAÇÕES (peso menor)
═══════════════════════════════════════
${banca.school_criteria}

═══════════════════════════════════════
ETAPAS DE CORREÇÃO
═══════════════════════════════════════
${banca.stages.map(s => `${s.name} — ${s.description} (máximo ${s.max_score} pontos)`).join('\n')}

═══════════════════════════════════════
REDAÇÃO DO ALUNO
═══════════════════════════════════════
"""
${transcription}
"""

═══════════════════════════════════════
INSTRUÇÕES PARA A CORREÇÃO
═══════════════════════════════════════

1. No campo "annotated_text", reescreva a redação do aluno MARCANDO trechos com:
   - [[c:texto]] para trechos CORRETOS (bons usos de gramática, argumentação, estrutura)
   - [[w:texto]] para trechos com AVISOS (pontos de atenção, melhorias possíveis)
   - [[e:texto]] para trechos com ERROS (erros gramaticais, de argumentação, de estrutura)
   Mantenha o texto original integralmente, apenas adicionando as marcações onde pertinente.
   IMPORTANTE: use EXCLUSIVAMENTE o formato [[c:...]], [[w:...]] e [[e:...]]. NUNCA use tags HTML (<span>, <mark>, etc.) no annotated_text.

2. No campo "stages", para cada etapa listada acima, forneça:
   - stage: nome da etapa
   - score: pontuação obtida (entre 0 e max_score)
   - max_score: pontuação máxima da etapa
   - findings: lista de observações específicas, cada uma com:
     - type: "correct" (verde), "warning" (amarelo) ou "error" (vermelho)
     - excerpt: o trecho exato da redação comentado
     - explanation: explicação clara do acerto/erro (em português, tom construtivo e didático)
     - suggestion: como melhorar (em português)
     - video_suggestion: um termo de busca curto para uma vídeoaula no YouTube que ajude a explicar o conceito

3. "final_grade": soma das pontuações das etapas (entre 0 e ${banca.max_grade}).
4. "max_grade": ${banca.max_grade}.
5. "writing_suggestions": 3-5 sugestões práticas de melhoria de escrita.
6. "study_suggestions": 3-5 sugestões de estudos focadas nas fraquezas identificadas.

Seja rigoroso, justo e didático. Comente erros e também acertos. O tom deve ser de um professor que quer ajudar o aluno a evoluir.`;
}