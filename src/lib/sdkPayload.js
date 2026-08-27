/**
 * Normaliza respostas do SDK Base44 após mudanças de envelope.
 * Funções, upload e InvokeLLM às vezes vêm como `{ data: payload }`
 * e às vezes como o payload direto.
 */

export function unwrapSdkPayload(res) {
  if (res == null) return res;
  if (typeof res !== 'object') return res;
  if (res.data != null && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data;
  }
  return res;
}

/** URL devolvida por Core.UploadFile, nos dois envelopes. */
export function fileUrlFromUpload(res) {
  const payload = unwrapSdkPayload(res);
  if (typeof payload?.file_url === 'string' && payload.file_url.trim()) {
    return payload.file_url.trim();
  }
  if (typeof res?.file_url === 'string' && res.file_url.trim()) {
    return res.file_url.trim();
  }
  return '';
}

/** Corpo de processEssayScan. Lança se a transcrição não veio. */
export function scanResultFromInvoke(res) {
  const payload = unwrapSdkPayload(res);
  if (payload && typeof payload.error === 'string' && typeof payload.transcription !== 'string') {
    throw new Error(payload.error);
  }
  if (!payload || typeof payload.transcription !== 'string') {
    throw new Error('Transcrição não retornada.');
  }
  return payload;
}

/** Campo transcription de InvokeLLM, nos dois envelopes. */
export function transcriptionFromLlm(result) {
  if (result == null || typeof result !== 'object') return '';
  if (typeof result.transcription === 'string') return result.transcription;
  if (typeof result.data?.transcription === 'string') return result.data.transcription;
  return '';
}
