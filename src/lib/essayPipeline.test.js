import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runStudentDigitization,
  resolveUploadedFileUrl,
  digitizationErrorText,
  recoverDigitizationIfDone,
  confirmStudentTranscription,
  invokeCorrectionAgent,
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
          if (failAt === name && name !== 'runCorrectionAgent') {
            const err = new Error(`${name} failed`);
            err.data = { error: `${name} failed` };
            throw err;
          }
          if (name === 'createEssay') {
            assert.ok(payload.banca);
            assert.ok(payload.file_url);
            return create;
          }
          if (name === 'updateEssayFlow') {
            if (payload.action === 'confirm_transcription') {
              assert.ok(payload.transcription);
              if (failAt === 'confirm_transcription') {
                return { error: 'Redação não encontrada.' };
              }
              return { essay: { id: payload.essayId, status: 'correcting' } };
            }
            assert.equal(payload.action, 'set_file');
            assert.ok(payload.file_url);
            assert.ok(payload.essayId);
            if (failAt === 'set_file_not_found') {
              return { error: 'Redação não encontrada.' };
            }
            return setFile;
          }
          if (name === 'runCorrectionAgent') {
            assert.ok(payload.essayId);
            if (failAt === 'runCorrectionAgent') {
              return { error: 'Redação não encontrada.' };
            }
            return { result: { final_grade: 800, max_grade: 1000, stages: [] } };
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

test('pipeline feliz: upload → create(file_url) → scan', async () => {
  const { client, calls } = mockBase44();
  const out = await runStudentDigitization({
    base44: client,
    file: { type: 'image/jpeg' },
    bancaId: 'ENEM',
  });
  assert.deepEqual(calls, ['UploadFile', 'createEssay', 'processEssayScan']);
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

test('pipeline: set_file 404 cria nova redação em vez de reusar id morto', async () => {
  const { client, calls } = mockBase44({ failAt: 'set_file_not_found' });
  const out = await runStudentDigitization({
    base44: client,
    file: { type: 'image/jpeg' },
    bancaId: 'ENEM',
    existingEssayId: 'e-stale',
  });
  assert.deepEqual(calls, [
    'UploadFile',
    'updateEssayFlow',
    'createEssay',
    'processEssayScan',
  ]);
  assert.equal(out.essayId, 'e1');
  assert.equal(out.created, true);
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

test('correção: confirmar transcrição e obter result do agente', async () => {
  const { client, calls } = mockBase44();
  const result = await (async () => {
    await confirmStudentTranscription(client, 'e1', 'Texto revisado.');
    return invokeCorrectionAgent(client, 'e1');
  })();
  assert.ok(calls.includes('updateEssayFlow'));
  assert.ok(calls.includes('runCorrectionAgent'));
  assert.equal(result.final_grade, 800);
});

test('caso do print: corretor 404 depois da transcrição confirmada', async () => {
  const { client } = mockBase44({ failAt: 'runCorrectionAgent' });
  await confirmStudentTranscription(client, 'e1', 'Texto revisado.');
  await assert.rejects(
    () => invokeCorrectionAgent(client, 'e1'),
    (err) => {
      assert.equal(err.step, 'runCorrectionAgent');
      assert.match(err.message, /Redação não encontrada/);
      return true;
    },
  );
});
