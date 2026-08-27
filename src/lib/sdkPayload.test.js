import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unwrapSdkPayload,
  fileUrlFromUpload,
  scanResultFromInvoke,
  transcriptionFromLlm,
} from './sdkPayload.js';

test('unwrap: payload direto do SDK atual', () => {
  const body = { essay: { id: 'e1' } };
  assert.equal(unwrapSdkPayload(body), body);
});

test('unwrap: envelope axios { data }', () => {
  const inner = { essay: { id: 'e1' } };
  assert.deepEqual(unwrapSdkPayload({ data: inner }), inner);
});

test('upload: file_url no topo', () => {
  assert.equal(
    fileUrlFromUpload({ file_url: ' https://cdn.example/a.jpg ' }),
    'https://cdn.example/a.jpg',
  );
});

test('upload: file_url dentro de data', () => {
  assert.equal(
    fileUrlFromUpload({ data: { file_url: 'https://cdn.example/b.pdf' } }),
    'https://cdn.example/b.pdf',
  );
});

test('upload: sem url devolve vazio (não lança)', () => {
  assert.equal(fileUrlFromUpload({}), '');
  assert.equal(fileUrlFromUpload(null), '');
});

test('scan: lê transcrição no topo (SDK atual)', () => {
  const scan = { transcription: 'texto', confidence: 0.9, stages: [] };
  assert.equal(scanResultFromInvoke(scan).transcription, 'texto');
});

test('scan: lê transcrição em data (envelope antigo)', () => {
  const scan = { transcription: 'texto', confidence: 0.8 };
  assert.equal(scanResultFromInvoke({ data: scan }).transcription, 'texto');
});

test('scan: response.data undefined — o bug que derrubava o OCR', () => {
  const scan = { transcription: 'ok', stages: [{ stage: 'Ingestão' }] };
  const response = scan;
  const broken = response.data;
  assert.equal(broken, undefined);
  assert.throws(() => broken.transcription, TypeError);
  assert.equal(scanResultFromInvoke(response).transcription, 'ok');
});

test('scan: erro da função vira Error', () => {
  assert.throws(
    () => scanResultFromInvoke({ error: 'Arquivo da redação não encontrado' }),
    /Arquivo da redação/,
  );
});

test('llm: transcription direta ou envelopada', () => {
  assert.equal(transcriptionFromLlm({ transcription: 'a' }), 'a');
  assert.equal(transcriptionFromLlm({ data: { transcription: 'b' } }), 'b');
  assert.equal(transcriptionFromLlm({}), '');
});
