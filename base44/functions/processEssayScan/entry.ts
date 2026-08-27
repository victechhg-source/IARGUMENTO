import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { validateTranscription, validateStructure } from '../../shared/ocrValidation.ts';

function transcriptionFromLlm(result: unknown): string {
  if (result == null || typeof result !== 'object') return '';
  const row = result as { transcription?: unknown; data?: { transcription?: unknown } };
  if (typeof row.transcription === 'string') return row.transcription;
  if (typeof row.data?.transcription === 'string') return row.data.transcription;
  return '';
}

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { essayId } = body;
    if (!essayId) return Response.json({ error: 'essayId é obrigatório' }, { status: 400 });

    const essay = await base44.asServiceRole.entities.Essay.get(essayId);
    if (!essay || essay.created_by_id !== user.id) {
      return Response.json({ error: 'Redação não encontrada' }, { status: 404 });
    }

    if (!essay.original_image_url) {
      return Response.json({ error: 'Arquivo da redação não encontrado' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Essay.update(essayId, { status: 'transcribing' });

    const [primaryResult, secondaryResult] = await Promise.all([
      runRecognizer(base44, essay.original_image_url, 'primary'),
      runRecognizer(base44, essay.original_image_url, 'secondary'),
    ]);

    const validation = validateTranscription(primaryResult.transcription, secondaryResult.transcription);
    const structure = validateStructure(primaryResult.transcription);

    const recognizerAgreement = primaryResult.transcription === secondaryResult.transcription ? 1 : 0.6;
    const overallConfidence = Math.round(
      ((validation.overallConfidence + recognizerAgreement) / 2) * 100,
    ) / 100;

    const mergedTranscription = pickBestTranscription(
      primaryResult.transcription,
      secondaryResult.transcription,
      validation,
    );

    await base44.asServiceRole.entities.Essay.update(essayId, {
      status: 'reviewing',
      transcription: mergedTranscription,
      unrecognized_words: validation.unrecognizedWords,
      ocr_confidence: overallConfidence,
      ocr_segments: validation.segments,
      ocr_primary: primaryResult.transcription,
      ocr_secondary: secondaryResult.transcription,
      ocr_structure_warnings: structure.warnings,
      ocr_needs_review: true,
    });

    return Response.json({
      transcription: mergedTranscription,
      confidence: overallConfidence,
      needsReview: true,
      flaggedSegments: validation.segments.filter((s) => s.confidence < 0.6),
      unrecognizedWords: validation.unrecognizedWords,
      structureWarnings: structure.warnings,
      stages: [
        { stage: 'Ingestão', status: 'done', detail: 'Arquivo recebido e validado' },
        { stage: 'Reconhecimento duplo', status: 'done', detail: `${validation.segments.length} segmentos analisados` },
        { stage: 'Validação determinística', status: 'done', detail: `${validation.flaggedCount} segmento(s) sinalizado(s)` },
        { stage: 'Cálculo de confiança', status: 'done', detail: `${Math.round(overallConfidence * 100)}% de confiança` },
        { stage: 'Roteamento', status: 'done', detail: 'Aguardando confirmação do aluno' },
      ],
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});

async function runRecognizer(base44: any, fileUrl: string, type: 'primary' | 'secondary') {
  const prompt = type === 'primary'
    ? `Você é o reconhecedor primário de OCR. Transcreva fielmente a redação manuscrita em português brasileiro. PRESERVE a paragrafação original: separe cada parágrafo com UMA linha em branco (quebra de linha dupla \\n\\n), sem juntar parágrafos. Mantenha a pontuação. USE O CONTEXTO da frase para resolver ambiguidades de uma única letra ou de acentuação — NÃO marque essas como dúvida. Marque palavra[?] APENAS quando uma PALAVRA inteira permanecer genuinamente ilegível. Não invente conteúdo. Retorne apenas o JSON solicitado.`
    : `Você é um reconhecedor independente de OCR. Sua tarefa é transcrever a redação manuscrita de forma autônoma, sem assumir contexto. Se não conseguir ler uma palavra, marque com [?]. PRESERVE a paragrafação original, separando cada parágrafo com UMA linha em branco (\\n\\n). Retorne apenas o JSON solicitado.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [fileUrl],
    response_json_schema: {
      type: 'object',
      properties: {
        transcription: { type: 'string' },
      },
      required: ['transcription'],
    },
  });

  return { transcription: transcriptionFromLlm(result) };
}

function pickBestTranscription(primary: string, secondary: string, _validation: unknown): string {
  return primary || secondary;
}
