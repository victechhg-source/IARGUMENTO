import {
  essayIdFromCreate,
  fileUrlFromUpload,
  listFromSdk,
  messageFromCaught,
  privateFileUriFromUpload,
  scanResultFromInvoke,
  unwrapSdkPayload,
} from './sdkPayload.js';

/**
 * Resolve URL acessível pelo OCR: file_url público ou signed_url de arquivo privado.
 */
export async function resolveUploadedFileUrl(base44, uploadRes) {
  const direct = fileUrlFromUpload(uploadRes);
  if (direct) return direct;
  const fileUri = privateFileUriFromUpload(uploadRes);
  if (!fileUri) return '';
  const signed = unwrapSdkPayload(
    await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 3600,
    }),
  );
  return fileUrlFromUpload(signed)
    || (typeof signed?.signed_url === 'string' ? signed.signed_url.trim() : '');
}

function isNotFoundMessage(text) {
  return typeof text === 'string' && /n[aã]o encontrada/i.test(text);
}

/**
 * Pipeline do aluno: upload → createEssay(file_url) → processEssayScan.
 * Retomada usa set_file; se o id antigo 404, cria outra redação.
 */
export async function runStudentDigitization({
  base44,
  file,
  bancaId,
  existingEssayId,
}) {
  let step = 'upload';
  let essayId = existingEssayId;
  try {
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const fileUrl = await resolveUploadedFileUrl(base44, uploadRes);
    if (!fileUrl) {
      const err = new Error('Falha no envio do arquivo.');
      err.step = step;
      throw err;
    }

    let created = false;
    let approvedCount = 0;

    if (essayId) {
      step = 'set_file';
      try {
        const setFileRes = unwrapSdkPayload(
          await base44.functions.invoke('updateEssayFlow', {
            essayId,
            action: 'set_file',
            file_url: fileUrl,
          }),
        );
        if (setFileRes?.error && !setFileRes?.essay) {
          if (!isNotFoundMessage(setFileRes.error)) {
            const err = new Error(setFileRes.error);
            err.step = step;
            throw err;
          }
          essayId = '';
        }
      } catch (error) {
        if (error.step === 'set_file' && !isNotFoundMessage(error.message)) throw error;
        if (!isNotFoundMessage(messageFromCaught(error))) {
          if (!error.step) error.step = step;
          throw error;
        }
        essayId = '';
      }
    }

    if (!essayId) {
      step = 'createEssay';
      const user = unwrapSdkPayload(await base44.auth.me());
      const memberships = listFromSdk(
        await base44.entities.ClassMembership.filter({
          student_id: user?.id,
          status: 'approved',
        }),
      );
      approvedCount = memberships.length;
      const createRes = await base44.functions.invoke('createEssay', {
        banca: bancaId,
        file_url: fileUrl,
      });
      const createPayload = unwrapSdkPayload(createRes);
      if (createPayload?.error && !essayIdFromCreate(createPayload)) {
        const err = new Error(createPayload.error);
        err.step = step;
        throw err;
      }
      essayId = essayIdFromCreate(createPayload) || essayIdFromCreate(createRes);
      if (!essayId) {
        const err = new Error('Não foi possível criar a redação.');
        err.step = step;
        throw err;
      }
      created = true;
    }

    step = 'processEssayScan';
    const scanRes = await base44.functions.invoke('processEssayScan', { essayId });
    const scan = scanResultFromInvoke(scanRes);
    return { essayId, scan, fileUrl, created, approvedCount };
  } catch (error) {
    if (!error.step) error.step = step;
    if (essayId && !error.essayId) error.essayId = essayId;
    throw error;
  }
}

function scanFromEssay(essay) {
  const segments = Array.isArray(essay.ocr_segments) ? essay.ocr_segments : [];
  return {
    transcription: essay.transcription,
    confidence: essay.ocr_confidence || 0,
    unrecognizedWords: essay.unrecognized_words || [],
    flaggedSegments: segments.filter((s) => (s?.confidence ?? 1) < 0.6),
    stages: [
      { stage: 'Ingestão', status: 'done', detail: 'Arquivo recebido e validado' },
      { stage: 'Reconhecimento duplo', status: 'done', detail: 'Recuperado após espera da transcrição' },
      { stage: 'Validação determinística', status: 'done', detail: '' },
      { stage: 'Cálculo de confiança', status: 'done', detail: '' },
      { stage: 'Roteamento', status: 'done', detail: 'Aguardando confirmação do aluno' },
    ],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Se o cliente estoura timeout mas o OCR já gravou `reviewing`, segue o fluxo.
 */
export async function recoverDigitizationIfDone(
  base44,
  essayId,
  { retries = 2, delayMs = 5000 } = {},
) {
  if (!essayId) return null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const essay = unwrapSdkPayload(await base44.entities.Essay.get(essayId));
      const text = typeof essay?.transcription === 'string' ? essay.transcription.trim() : '';
      if (text && (essay.status === 'reviewing' || essay.status === 'correcting')) {
        return { essayId: essay.id, scan: scanFromEssay(essay) };
      }
    } catch {
      // Essay.get pode falhar por rede; tenta de novo.
    }
    if (attempt < retries) await sleep(delayMs);
  }
  return null;
}

export function digitizationErrorText(error) {
  const step = error?.step ? `Etapa ${error.step}: ` : '';
  return `${step}${messageFromCaught(error)}`;
}

function throwIfFunctionError(payload, step, fallback) {
  if (payload?.error && !payload?.essay && !payload?.result) {
    const err = new Error(payload.error);
    err.step = step;
    throw err;
  }
  if (!payload) {
    const err = new Error(fallback);
    err.step = step;
    throw err;
  }
}

export async function confirmStudentTranscription(base44, essayId, transcription) {
  const step = 'confirm_transcription';
  if (!essayId) {
    const err = new Error('Redação não encontrada.');
    err.step = step;
    throw err;
  }
  const payload = unwrapSdkPayload(
    await base44.functions.invoke('updateEssayFlow', {
      essayId,
      action: 'confirm_transcription',
      transcription,
    }),
  );
  throwIfFunctionError(payload, step, 'Não foi possível confirmar a transcrição.');
  return payload;
}

export async function invokeCorrectionAgent(base44, essayId) {
  const step = 'runCorrectionAgent';
  if (!essayId) {
    const err = new Error('Redação não encontrada.');
    err.step = step;
    throw err;
  }
  const payload = unwrapSdkPayload(
    await base44.functions.invoke('runCorrectionAgent', { essayId }),
  );
  throwIfFunctionError(payload, step, 'Correção não retornada.');
  if (!payload.result) {
    const err = new Error(payload.error || 'Correção não retornada.');
    err.step = step;
    throw err;
  }
  return payload.result;
}
