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

function firstHttpUrl(...candidates) {
  for (const value of candidates) {
    if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }
  return '';
}

/** URL pública de UploadFile / signed URL, nos envelopes do SDK. */
export function fileUrlFromUpload(res) {
  const payload = unwrapSdkPayload(res) || {};
  return firstHttpUrl(
    payload.file_url,
    payload.fileUrl,
    payload.signed_url,
    payload.url,
    res?.file_url,
    res?.fileUrl,
    res?.signed_url,
    res?.url,
  );
}

export function privateFileUriFromUpload(res) {
  const payload = unwrapSdkPayload(res) || {};
  const uri = payload.file_uri || payload.fileUri || res?.file_uri;
  return typeof uri === 'string' ? uri.trim() : '';
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
  if (!error) return 'Não foi possível transcrever a redação.';
  const nested = error.data ?? error.response?.data ?? error;
  const payload = unwrapSdkPayload(nested);
  const candidates = [
    payload?.error,
    nested?.error,
    payload?.detail,
    nested?.detail,
    payload?.message,
    error.message,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && candidate !== '[object Object]') {
      const text = candidate.trim();
      if (/timeout of \d+ms/i.test(text)) {
        return 'A transcrição ultrapassou o tempo de espera. Se a redação aparecer no histórico, abra e confirme; senão, envie de novo.';
      }
      return text.slice(0, 280);
    }
  }
  return 'Não foi possível transcrever a redação.';
}

function stripFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/** Campo transcription de InvokeLLM / ExtractData, nos envelopes do SDK. */
export function transcriptionFromLlm(result) {
  if (result == null) return '';
  if (typeof result === 'string') {
    const trimmed = stripFence(result);
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
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
  if (typeof result.output?.transcription === 'string') return result.output.transcription;
  if (typeof result.result?.transcription === 'string') return result.result.transcription;
  if (typeof result.extracted_data?.transcription === 'string') {
    return result.extracted_data.transcription;
  }
  if (result.data && result.data !== result) {
    const nested = transcriptionFromLlm(result.data);
    if (nested) return nested;
  }
  if (typeof result.status === 'string' && result.status === 'error') return '';
  return '';
}
