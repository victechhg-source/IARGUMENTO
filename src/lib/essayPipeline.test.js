import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runStudentDigitization,
  resolveUploadedFileUrl,
  digitizationErrorText,
  recoverDigitizationIfDone,
} from './essayPipeline.js';

function mockBase44({
  upload = { file_url: 'https://cdn.example/r.jpg' },
  me = { id: 'u1', email: 'a@b.c', data: { account_type: 'student' } },
  memberships = [{ id: 'm1' }],
  create = { essay: { id: 'e1', banca: 'ENEM' } },
  setFile = { essay: { id: 'e1', status: 'transcribing' } },
  scan = { transcription: 'A casa de Joana.', confidence: 0.91, stages: [{ stage: 'Ingestão' }] },
  failAt = null,
} = {}) {
  const calls = [];
  return {
    calls,
    client: {
      integrations: {
        Core: {
          UploadFile: async () => {
            calls.push('UploadFile');
            if (failAt === 'upload') throw new Error('upload down');
            return upload;
          },
          CreateFileSignedUrl: async ({ file_uri }) => {
            calls.push('CreateFileSignedUrl');
            return { signed_url: `https://signed.example/${file_uri}` };
          },
        },
      },
      auth: {
        me: async () => me,
      },
      entities: {
        ClassMembership: {
          filter: async () => memberships,
        },
      },
      functions: {
        invoke: async (name, payload) => {
          calls.push(name);
          if (failAt === name) {
            const err = new Error(`${name} failed`);
            err.data = { error: `${name} failed` };
            throw err;
          }
          if (name === 'createEssay') return create;
          if (name === 'updateEssayFlow') {
            assert.equal(payload.action, 'set_file');
            assert.ok(payload.file_url);
            assert.ok(payload.essayId);
            return setFile;
          }
          if (name === 'processEssayScan') {
            assert.ok(payload.essayId);
            return scan;
          }
          throw new Error(`unknown ${name}`);
        },
      },
    },
  };
}

test('pipeline feliz: upload → create → set_file → scan', async () => {
  const { client, calls } = mockBase44();
  const out = await runStudentDigitization({
    base44: client,
    file: { type: 'image/jpeg' },
    bancaId: 'ENEM',
  });
  assert.deepEqual(calls, ['UploadFile', 'createEssay', 'updateEssayFlow', 'processEssayScan']);
  assert.equal(out.essayId, 'e1');
  assert.equal(out.created, true);
  assert.equal(out.approvedCount, 1);
  assert.equal(out.scan.transcription, 'A casa de Joana.');
});

test('pipeline retomada: não cria segunda redação', async () => {
  const { client, calls } = mockBase44();
  const out = await runStudentDigitization({
    base44: client,
    file: { type: 'application/pdf' },
    bancaId: 'FUVEST',
    existingEssayId: 'e9',
  });
  assert.deepEqual(calls, ['UploadFile', 'updateEssayFlow', 'processEssayScan']);
  assert.equal(out.essayId, 'e9');
  assert.equal(out.created, false);
});

test('pipeline: arquivo privado vira signed_url', async () => {
  const url = await resolveUploadedFileUrl(
    {
      integrations: {
        Core: {
          CreateFileSignedUrl: async () => ({ signed_url: 'https://signed.example/x' }),
        },
      },
    },
    { file_uri: 'private/u1/redacao.jpg' },
  );
  assert.equal(url, 'https://signed.example/x');
});

test('pipeline: falha no scan identifica a etapa', async () => {
  const { client } = mockBase44({ failAt: 'processEssayScan' });
  await assert.rejects(
    () => runStudentDigitization({
      base44: client,
      file: { type: 'image/png' },
      bancaId: 'UNICAMP',
    }),
    (err) => {
      assert.equal(err.step, 'processEssayScan');
      assert.equal(err.essayId, 'e1');
      assert.match(digitizationErrorText(err), /processEssayScan/);
      return true;
    },
  );
});

test('pipeline: envelopes axios no create e no scan', async () => {
  const { client } = mockBase44({
    create: { data: { essay: { id: 'e2' } } },
    scan: { data: { transcription: 'Texto UNICAMP', stages: [] } },
  });
  const out = await runStudentDigitization({
    base44: client,
    file: { type: 'image/jpeg' },
    bancaId: 'UNICAMP',
  });
  assert.equal(out.essayId, 'e2');
  assert.equal(out.scan.transcription, 'Texto UNICAMP');
});

test('recover: lê redação reviewing após timeout do cliente', async () => {
  const recovered = await recoverDigitizationIfDone(
    {
      entities: {
        Essay: {
          get: async () => ({
            id: 'e1',
            status: 'reviewing',
            transcription: 'Texto recuperado',
            ocr_confidence: 0.8,
            unrecognized_words: [],
            ocr_segments: [{ text: 'Texto', confidence: 0.4 }],
          }),
        },
      },
    },
    'e1',
    { retries: 0, delayMs: 0 },
  );
  assert.equal(recovered.essayId, 'e1');
  assert.equal(recovered.scan.transcription, 'Texto recuperado');
  assert.equal(recovered.scan.flaggedSegments.length, 1);
});

test('recover: ignora transcribing sem texto', async () => {
  const recovered = await recoverDigitizationIfDone(
    {
      entities: {
        Essay: {
          get: async () => ({ id: 'e1', status: 'transcribing', transcription: '' }),
        },
      },
    },
    'e1',
    { retries: 0, delayMs: 0 },
  );
  assert.equal(recovered, null);
});
