// Cópia fiel dos critérios UNICAMP/UNIFESP usados no prompt do cliente.
// ENEM/FUVEST/UFG NÃO passam por aqui: usam os system prompts já no agente.
// Não altere o texto dos critérios.

export const GENERIC_BANCAS = [
  {
    id: 'UNICAMP',
    name: 'UNICAMP',
    full_name: 'Universidade Estadual de Campinas',
    max_grade: 100,
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
      { name: 'Atendimento à proposta', max_score: 25, description: 'Tipo textual e adequação ao tema' },
      { name: 'Coerência', max_score: 25, description: 'Desenvolvimento argumentativo e lógica' },
      { name: 'Coesão', max_score: 20, description: 'Mecanismos linguísticos de coesão' },
      { name: 'Norma-padrão', max_score: 20, description: 'Gramática, ortografia e pontuação' },
      { name: 'Leitura crítica', max_score: 10, description: 'Síntese e uso dos textos de apoio' },
    ],
  },
  {
    id: 'UNIFESP',
    name: 'UNIFESP',
    full_name: 'Universidade Federal de São Paulo',
    max_grade: 100,
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
      { name: 'Tema e proposta', max_score: 25, description: 'Compreensão e desenvolvimento do tema' },
      { name: 'Argumentação', max_score: 25, description: 'Lógica e consistência argumentativa' },
      { name: 'Estrutura', max_score: 20, description: 'Organização dissertativo-argumentativa' },
      { name: 'Norma-padrão', max_score: 20, description: 'Gramática, ortografia e pontuação' },
      { name: 'Coesão e coerência', max_score: 10, description: 'Fluidez e unidade textual' },
    ],
  },
];

export function findGenericBanca(id) {
  return GENERIC_BANCAS.find((item) => item.id === id) || null;
}

export function buildGenericCorrectionPrompt(banca, transcription) {
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
GRADE ESPECÍFICA DE CORREÇÃO
═══════════════════════════════════════
${banca.agent_guidance || 'Use a matriz oficial da banca e os critérios complementares acima.'}

═══════════════════════════════════════
ETAPAS DE CORREÇÃO
═══════════════════════════════════════
${banca.stages.map((s) => `${s.name} — ${s.description} (máximo ${s.max_score} pontos)`).join('\n')}

═══════════════════════════════════════
REDAÇÃO DO ALUNO
═══════════════════════════════════════
"""
${transcription}
"""

═══════════════════════════════════════
INSTRUÇÕES PARA A CORREÇÃO
═══════════════════════════════════════

1. No campo "annotated_text", reescreva a redação do aluno MARCANDO trechos com um ID que aponta para o finding correspondente:
   - [[c#<id>:texto]] para trechos CORRETOS (bons usos de gramática, argumentação, estrutura)
   - [[w#<id>:texto]] para trechos com AVISOS (pontos de atenção, melhorias possíveis)
   - [[e#<id>:texto]] para trechos com ERROS (erros gramaticais, de argumentação, de estrutura)
   O <id> deve ser um shortcode único (ex.: "f1", "f2") igual ao "id" do finding que comenta aquele trecho. Mantenha o texto original integralmente, apenas adicionando as marcações onde pertinente.
   IMPORTANTE: use EXCLUSIVAMENTE o formato [[c#<id>:...]], [[w#<id>:...]] e [[e#<id>:...]]. NUNCA use tags HTML (<span>, <mark>, etc.) no annotated_text.

2. No campo "stages", para cada etapa listada acima, forneça:
   - stage: nome da etapa
   - score: pontuação obtida (entre 0 e max_score)
   - max_score: pontuação máxima da etapa
   - findings: lista MINUCIOSA de observações específicas (enumere TODOS os pontos relevantes, com atenção especial aos ERROS — um finding por erro/acerto), cada uma com:
     - id: shortcode único (ex.: "f1"), o MESMO usado no marcador do annotated_text
     - type: "correct" (verde), "warning" (amarelo) ou "error" (vermelho)
     - excerpt: o trecho exato da redação comentado (idêntico ao do marcador)
     - explanation: explicação clara e detalhada do acerto/erro (em português, tom construtivo e didático)
     - suggestion: como melhorar (em português)
     - video_suggestion: um termo de busca curto para uma vídeoaula no YouTube que ajude a explicar o conceito

3. "final_grade": soma das pontuações das etapas (entre 0 e ${banca.max_grade}).
4. "max_grade": ${banca.max_grade}.
5. "writing_suggestions": 3-5 sugestões práticas de melhoria de escrita.
6. "study_suggestions": 3-5 sugestões de estudos focadas nas fraquezas identificadas.

Seja rigoroso, justo e didático. Comente erros e também acertos. O tom deve ser de um professor que quer ajudar o aluno a evoluir.`;
}
