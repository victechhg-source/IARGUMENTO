export const BANCAS = [
  {
    id: "ENEM",
    name: "ENEM",
    full_name: "Exame Nacional do Ensino Médio",
    description: "Redação dissertativo-argumentativa com proposta de intervenção detalhada.",
    max_grade: 1000,
    color: "#4f46e5",
    logo_url: "https://media.base44.com/images/public/6a6602cb58785bab45511cab/7ab13ef60_Enem_logo.png",
    theme: "Dissertativo-argumentativa",
    official_criteria: `A redação do ENEM é avaliada por 5 competências, cada uma valendo 200 pontos (total 1000):
1. Domínio da norma-padrão da língua escrita.
2. Compreensão da proposta, repertório sociocultural produtivo e estrutura dissertativo-argumentativa.
3. Projeto de texto, seleção e organização consistente de argumentos.
4. Coesão e progressão textual por mecanismos linguísticos adequados.
5. Proposta de intervenção detalhada, relacionada ao tema e respeitosa aos direitos humanos.`,
    school_criteria: `Regras básicas da Argumento para textos ENEM:
- Considerar a coletânea e utilizá-la como repertório; exigir no mínimo 3 repertórios produtivos: na introdução, no A1 e no A2.
- Verificar os desafios semanais e os movimentos indicados pela escola para introdução, desenvolvimento e conclusão quando essas informações estiverem disponíveis na proposta.
- O texto deve ter até 30 linhas: introdução até a linha 7, dois desenvolvimentos com cerca de 7 linhas e conclusão iniciada até a linha 22 ou 23.
- Exigir operador argumentativo interparagrafal no A1, A2 e conclusão, além de pelo menos dois operadores argumentativos em cada parágrafo.
- Exigir duas propostas de intervenção, uma para cada discussão, ou uma proposta que atenda ambas; uma delas deve ser completa e conter agente, detalhamento do agente, ação, meio ou detalhamento da ação/meio e finalidade.`,
    agent_guidance: `GRADE ESPECÍFICA ENEM — aplique como referência prioritária:
- Competência I: 200 apenas sem desvios gramaticais ou sintáticos; 160 com até 5 desvios; 120 com até 11; 80 acima de 11. Estrutura sintática inexistente pode levar a 0. Não invente desvios: conte somente os identificados.
- Competência II: 200 exige abordagem completa, três partes textuais completas, três repertórios (introdução, A1 e A2), repertório legítimo, pertinente e produtivo, além dos desafios fornecidos. Repertório motivador, não legitimado, pouco pertinente ou sem uso produtivo reduz a faixa.
- Competência III: 200 exige projeto de texto e argumentação consistentes, desenvolvimento de informações/fatos/opiniões em todo o texto, atendimento aos desafios, intervenções para A1 e A2, movimentos estruturais, conclusão até a linha 22/23 e até 30 linhas. Tangenciamento não ultrapassa 40; contradição grave não ultrapassa 80.
- Competência IV: 200 exige coesão e progressão bem estabelecidas, recursos coesivos diversificados e adequados. Uma repetição isolada de operador pode manter 200; mais de uma repetição, usos equivocados ou baixa variedade reduzem a nota.
- Competência V: para 200, a intervenção deve ser completa, consistente, relacionada ao tema e à discussão, respeitar direitos humanos e conter AGENTE específico, DETALHAMENTO do agente, AÇÃO, MEIO (ou detalhamento da ação/meio) e FINALIDADE. Proposta incompleta deve ter ao menos ação, agente e finalidade. Sem proposta, proposta desconectada do tema ou que desrespeite direitos humanos recebe 0.
- Se a imagem/transcrição não permite verificar linhas, desafios semanais, coletânea ou materiais específicos da escola, registre a limitação como aviso e não assuma o descumprimento automaticamente.`,
    stages: [
      { name: "Competência I — Norma-padrão", max_score: 200, description: "Domínio da modalidade escrita formal e estrutura sintática" },
      { name: "Competência II — Tema e repertório", max_score: 200, description: "Abordagem do tema, estrutura e repertório sociocultural produtivo" },
      { name: "Competência III — Argumentação", max_score: 200, description: "Projeto de texto e desenvolvimento consistente dos argumentos" },
      { name: "Competência IV — Coesão", max_score: 200, description: "Articulação, progressão e uso adequado de recursos coesivos" },
      { name: "Competência V — Intervenção", max_score: 200, description: "Proposta de intervenção completa, detalhada e respeitosa aos direitos humanos" }
    ]
  },
  {
    id: "FUVEST",
    name: "FUVEST",
    full_name: "Fundação Universitária para o Vestibular",
    description: "Redação dissertativa ou narrativa, com foco em originalidade e argumentação.",
    max_grade: 50,
    color: "#059669",
    logo_url: "https://media.base44.com/images/public/6a6602cb58785bab45511cab/b17222b33_img-logo-fuvest-1.png",
    theme: "Dissertativa ou narrativa",
    official_criteria: `A redação da FUVEST é avaliada por 4 eixos (total 50 pontos):
1. Norma Padrão (0 a 10 pontos): domínio da ortografia, gramática, regência, concordância e convenções da norma-padrão escrita.
2. Gênero Textual e Projeto de Texto (0 a 10 pontos): adequação ao gênero dissertativo-argumentativo, projeto de texto e recursos de persuasão.
3. Coesão e Coerência (0 a 15 pontos): articulação formal e de sentido, sintaxe, predicação, conectivos e ausência de contradições.
4. Tema e Coletânea (0 a 15 pontos): desenvolvimento do tema, apropriação crítica da coletânea e indícios de autoria.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Riqueza vocabular e precisão linguística.
- Uso adequado de conectivos argumentativos.
- Profundidade crítica e leitura de mundo.
- Clareza e objetividade na exposição de ideias.`,
    stages: [
      { name: "Norma Padrão", max_score: 10, description: "Ortografia, gramática, regência, concordância e convenções da norma-padrão" },
      { name: "Gênero Textual e Projeto de Texto", max_score: 10, description: "Adequação ao gênero, projeto de texto e recursos argumentativos" },
      { name: "Coesão e Coerência", max_score: 15, description: "Articulação formal e de sentido, predicação e conectivos" },
      { name: "Tema e Coletânea", max_score: 15, description: "Desenvolvimento do tema, apropriação da coletânea e indícios de autoria" }
    ]
  },
  {
    id: "UNICAMP",
    name: "UNICAMP",
    full_name: "Universidade Estadual de Campinas",
    description: "Redação com proposta temática específica, exige coerência e coesão.",
    max_grade: 100,
    color: "#dc2626",
    logo_url: "https://media.base44.com/images/public/6a6602cb58785bab45511cab/31356a673_png-clipart-university-of-campinas-school-of-mechanical-engineering-unicamp-camp-quatre-saisons-vestibular-exam-kosrae-liberation-day-logo-university.png",
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
    logo_url: "https://media.base44.com/images/public/6a6602cb58785bab45511cab/3ecd73927_images.jpeg",
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
    id: "UFG",
    name: "UFG",
    full_name: "Universidade Federal de Goiás",
    description: "Redação dissertativo-argumentativa com até 30 linhas, coletânea de apoio e defesa de ponto de vista.",
    max_grade: 24,
    color: "#0073CF",
    logo_url: "https://media.base44.com/images/public/6a6602cb58785bab45511cab/d09d1b9e4_image.png",
    theme: "Dissertativo-argumentativa",
    official_criteria: `A redação da UFG (Vestibular 2026) é dissertativo-argumentativa, vale 24 pontos e tem correção dupla (média de dois corretores independentes). O texto deve ter no máximo 30 linhas, defender um ponto de vista sobre o tema, usar argumentos consistentes e apresentar coesão e coerência. Uma coletânea de textos serve de apoio à escrita (citações diretas, paráfrases, explicitação de pressupostos), de forma coerente com o projeto de texto. A conclusão é livre (síntese do desenvolvimento, retomada do ponto de vista, questionamentos das ideias, perspectivas futuras, reavaliação da frase-temática, entre outras). É atribuída nota ZERO em caso de fuga ao tema, letra ilegível ou não produção de texto em prosa; nota mínima exigida de 10 pontos. Critérios:
1. Adequação ao tema (0 a 9 pontos): desenvolver ideias relativas ao tema proposto, considerando os textos da coletânea, de forma reflexiva e articulada; para a nota máxima, mobilizar diferentes vozes, diferenciando-as e articulando-as num projeto de texto definido.
2. Adequação ao gênero textual (0 a 5 pontos): conhecimento da estrutura que caracteriza o texto dissertativo-argumentativo.
3. Adequação à modalidade escrita (0 a 5 pontos): uso dos recursos linguísticos (domínios morfológico, sintático, semântico e de convenção ortográfica).
4. Coesão e coerência (0 a 5 pontos): utilização de elementos de articulação textual — sistemas de pontuação, de construção frasal, de escolha lexical — e recursos lógico-semânticos como inferência e generalização pertinente.`,
    school_criteria: `Critérios complementares da escola de redações (peso menor):
- Uso produtivo da coletânea (citação, paráfrase, pressupostos) a favor de um projeto de texto — não cópia solta.
- Repertório sociocultural pertinente e articulado à tese.
- Coesão inter e intraparagrafal com conectivos diversificados e adequados.
- Tese explícita e progressão argumentativa coerente; conclusão articulada ao desenvolvimento.
- Domínio da norma-padrão (registro formal, concisão, precisão lexical).`,
    agent_guidance: `GRADE ESPECÍFICA UFG — aplique como referência prioritária (nota máxima 24 pontos):
- Adequação ao tema (0-9): 9 exige desenvolvimento reflexivo e articulado do tema, uso produtivo da coletânea (vozes diferenciadas e articuladas) e tese clara; 6-7 para desenvolvimento competente com articulação razoável; 3-5 para abordagem parcial ou superficial; 0-2 para fuga ao tema, tangenciamento ou desconsideração da coletânea. Fuga ao tema = nota 0 na redação (eliminatório).
- Adequação ao gênero textual (0-5): 5 exige texto dissertativo-argumentativo completo (introdução com tese, desenvolvimento com argumentos, conclusão articulada) e defesa de ponto de vista; 3-4 para estrutura presente com falhas; 0-2 para texto que não configura dissertação-argumentação. Não produzir texto em prosa = nota 0 na redação.
- Adequação à modalidade escrita (0-5): 5 nenhum desvio gramatical/ortográfico e registro formal consistente; 3-4 poucos desvios esporádicos; 0-2 muitos desvios ou registro informal.
- Coesão e coerência (0-5): 5 articulação fluida, pontuação e escolha lexical adequadas, progressão e unidade textuais, uso de recursos lógico-semânticos (inferência, generalização); 3-4 coesão adequada com falhas pontuais; 0-2 incoerência, monobloco ou articulação precária.
- Atribua a cada critério um valor dentro da faixa (acesse o continuum, não apenas os extremos). final_grade = soma dos 4 critérios (0 a 24). Letra ilegível, não prosa ou fuga total ao tema = nota 0. Piso do processo seletivo: 10 pontos.`,
    stages: [
      { name: "Adequação ao tema", max_score: 9, description: "Desenvolvimento reflexivo e articulado do tema, com uso produtivo da coletânea" },
      { name: "Adequação ao gênero textual", max_score: 5, description: "Estrutura do texto dissertativo-argumentativo e defesa de ponto de vista" },
      { name: "Adequação à modalidade escrita", max_score: 5, description: "Recursos linguísticos: morfologia, sintaxe, semântica e convenção ortográfica" },
      { name: "Coesão e coerência", max_score: 5, description: "Articulação textual, pontuação, escolha lexical e recursos lógico-semânticos" }
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
GRADE ESPECÍFICA DE CORREÇÃO
═══════════════════════════════════════
${banca.agent_guidance || 'Use a matriz oficial da banca e os critérios complementares acima.'}

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