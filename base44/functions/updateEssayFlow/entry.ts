import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Fluxo de redação do ALUNO (Essay.update no cliente é admin-only).
// Body: { essayId, action, file_url?, transcription? }
//   - action 'set_file': grava original_image_url + status 'transcribing'
//     (recusa se a redação já estiver 'completed').
//   - action 'confirm_transcription': grava transcription + status
//     'correcting' (exige status atual em reviewing/transcribing/correcting).
// Nunca aceita outros campos. Responde { essay }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { essayId, action, file_url, transcription } = body;
    if (!essayId || !action) {
      return Response.json({ error: 'essayId e action são obrigatórios.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const essay = await svc.Essay.get(essayId);
    if (!essay || essay.created_by_id !== user.id) {
      return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });
    }

    let updates;
    if (action === 'set_file') {
      const url = typeof file_url === 'string' ? file_url.trim() : '';
      if (!url) return Response.json({ error: 'file_url é obrigatório.' }, { status: 400 });
      if (essay.status === 'completed') {
        return Response.json({ error: 'Esta redação já foi concluída.' }, { status: 409 });
      }
      updates = { original_image_url: url, status: 'transcribing' };
    } else if (action === 'confirm_transcription') {
      const text = typeof transcription === 'string' ? transcription.trim() : '';
      if (!text) return Response.json({ error: 'transcription é obrigatória.' }, { status: 400 });
      if (!['reviewing', 'transcribing', 'correcting'].includes(essay.status)) {
        return Response.json({ error: 'Esta redação não está em fase de transcrição.' }, { status: 409 });
      }
      updates = { transcription: text, status: 'correcting' };
    } else {
      return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    const updated = await svc.Essay.update(essayId, updates);
    return Response.json({ essay: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
