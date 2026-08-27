/**
 * Normaliza respostas do SDK Base44 após mudanças de envelope.
 * Só desembrulha `{ data: payload }` de invoke/axios — nunca um User/Essay
 * que também tem campo `data` (custom fields).
 */

function isEntityLike(res) {
  if (!res || typeof res !== 'object') return false;
  return (
    typeof res.id === 'string'
    || typeof res.email === 'string'
    || typeof res.created_by_id === 'string'
    || typeof res.banca === 'string'
    || typeof res.account_type === 'string'
  );
}

export function unwrapSdkPayload(res) {
  if (res == null || typeof res !== 'object') return res;
  if (isEntityLike(res)) return res;
  if (res.data != null && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data;
  }
  return res;
}

/** Lista de filter() do SDK — array direto ou `{ data: [] }`. */
export function listFromSdk(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  const payload = unwrapSdkPayload(res);
  if (Array.isArray(payload)) return payload;
  return [];
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

export function messageFromCaught(error) {
  const nested = error?.data ?? error?.response?.data ?? error;
  const payload = unwrapSdkPayload(nested);
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof nested?.error === 'string' && nested.error.trim()) return nested.error;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return 'Não foi possível transcrever a redação.';
}

/** Campo transcription de InvokeLLM, nos dois envelopes. */
export function transcriptionFromLlm(result) {
  if (result == null) return '';
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (trimmed.startsWith('{')) {
      try {
        return transcriptionFromLlm(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof result !== 'object') return '';
  if (typeof result.transcription === 'string') return result.transcription;
  if (typeof result.data?.transcription === 'string') return result.data.transcription;
  return '';
}
