import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unwrapSdkPayload,
  fileUrlFromUpload,
  scanResultFromInvoke,
  transcriptionFromLlm,
  messageFromCaught,
  listFromSdk,
} from './sdkPayload.js';

/**
 * Espelha handleUpload: upload → user → createEssay → scan.
 * Usado para sortear envelopes do SDK sem bater na rede.
 */
function runStudentScanPath({ upload, me, create, scan }) {
  const fileUrl = fileUrlFromUpload(upload);
  if (!fileUrl) throw new Error('Falha no envio do arquivo.');
  const user = unwrapSdkPayload(me);
  if (!user?.id) throw new Error('Usuário sem id.');
  const created = unwrapSdkPayload(create);
  const essayId = created?.essay?.id;
  if (!essayId) throw new Error(created?.error || 'Não foi possível criar a redação.');
  const result = scanResultFromInvoke(scan);
  return { fileUrl, userId: user.id, essayId, transcription: result.transcription };
}

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

test('unwrap: NÃO destrói User com campo data (custom fields Base44)', () => {
  const me = { id: 'u1', email: 'a@b.c', data: { account_type: 'student' } };
  assert.equal(unwrapSdkPayload(me), me);
  assert.equal(unwrapSdkPayload(me).id, 'u1');
});

test('unwrap: NÃO destrói Essay com id', () => {
  const essay = { id: 'e1', banca: 'ENEM', data: { extra: true } };
  assert.equal(unwrapSdkPayload(essay).id, 'e1');
});

test('messageFromCaught lê error do invoke', () => {
  assert.equal(
    messageFromCaught({ data: { error: 'Arquivo da redação não encontrado' } }),
    'Arquivo da redação não encontrado',
  );
});

test('listFromSdk: array direto ou { data: [] }', () => {
  assert.equal(listFromSdk([{ id: 'm1' }]).length, 1);
  assert.equal(listFromSdk({ data: [{ id: 'm1' }, { id: 'm2' }] }).length, 2);
  assert.equal(listFromSdk(null).length, 0);
});

test('fluxo aluno: SDK no topo (formato atual)', () => {
  const out = runStudentScanPath({
    upload: { file_url: 'https://cdn.example/r.jpg' },
    me: { id: 'u1', email: 'a@b.c', data: { account_type: 'student' } },
    create: { essay: { id: 'e1', banca: 'ENEM' } },
    scan: { transcription: 'A casa é linda.', confidence: 0.9, stages: [] },
  });
  assert.equal(out.userId, 'u1');
  assert.equal(out.essayId, 'e1');
  assert.equal(out.transcription, 'A casa é linda.');
});

test('fluxo aluno: envelopes axios misturados', () => {
  const out = runStudentScanPath({
    upload: { data: { file_url: 'https://cdn.example/r.pdf' } },
    me: { id: 'u2', email: 'p@q.r', data: { school_id: 's1' } },
    create: { data: { essay: { id: 'e2' } } },
    scan: { data: { transcription: 'Texto UNICAMP', stages: [{ stage: 'Ingestão' }] } },
  });
  assert.equal(out.essayId, 'e2');
  assert.equal(out.transcription, 'Texto UNICAMP');
  assert.ok(out.fileUrl.endsWith('r.pdf'));
});

test('fluxo aluno: sem file_url falha cedo', () => {
  assert.throws(
    () => runStudentScanPath({
      upload: {},
      me: { id: 'u1', email: 'a@b.c' },
      create: { essay: { id: 'e1' } },
      scan: { transcription: 'x' },
    }),
    /Falha no envio/,
  );
});

