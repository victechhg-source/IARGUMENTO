import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  authUserId,
  essayIdOf,
  isSuspended,
  ownsEssay,
  unwrapEntity,
} from '../../shared/entityAccess.ts';

// Cria a redação do aluno. Body: { banca, file_url? }. Responde { essay }.
// Create na entidade é admin-only; service role + created_by_id do aluno.
// file_url opcional: grava original_image_url no mesmo request (evita
// set_file 404 por id/dono divergente entre duas funções).
const BANCAS = ['ENEM', 'FUVEST', 'UNICAMP', 'UNIFESP', 'UFG'];

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const userId = authUserId(user);
    if (!userId) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (isSuspended(user)) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { banca, file_url: rawFileUrl } = body;
    if (!BANCAS.includes(banca)) {
      return Response.json({ error: 'Banca inválida.' }, { status: 400 });
    }
    const fileUrl = typeof rawFileUrl === 'string' ? rawFileUrl.trim() : '';

    const memberships = await base44.asServiceRole.entities.ClassMembership.filter({
      student_id: userId,
      status: 'approved',
    });
    const teacherIds = [...new Set(memberships.map((m) => m.teacher_id).filter(Boolean))];
    const schoolIds = [...new Set(memberships.map((m) => m.school_id).filter(Boolean))];

    const svc = base44.asServiceRole.entities;
    let essay = unwrapEntity(await svc.Essay.create({
      banca,
      status: 'transcribing',
      created_by_id: userId,
      student_id: userId,
    }));
    const essayId = essayIdOf(essay);
    if (!essayId) {
      return Response.json({ error: 'Falha ao criar a redação.' }, { status: 500 });
    }

    const patch: Record<string, unknown> = { student_id: userId };
    if (!ownsEssay(essay, userId)) patch.created_by_id = userId;
    if (fileUrl) patch.original_image_url = fileUrl;
    if (teacherIds.length) patch.teacher_ids = teacherIds;
    if (schoolIds.length) patch.school_ids = schoolIds;

    if (Object.keys(patch).length) {
      const updated = unwrapEntity(await svc.Essay.update(essayId, patch));
      essay = {
        ...(essay || {}),
        ...(updated || {}),
        ...patch,
        id: essayId,
        created_by_id: userId,
        student_id: userId,
      };
    }

    const verified = unwrapEntity(await svc.Essay.get(essayId)) || essay;
    if (!ownsEssay(verified, userId)) {
      console.error('[createEssay] GET ainda sem dono aluno; seguimos com student_id no payload', {
        essayId,
        userId,
      });
    }

    return Response.json({
      essay: { ...verified, id: essayId, created_by_id: userId, student_id: userId },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
