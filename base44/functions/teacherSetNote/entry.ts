import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAccountGrant } from '../../shared/accountGrant.ts';

// Salva apenas o campo teacher_note de uma redação. O cliente do professor
// NÃO usa entities.Essay.update genérico — este function isola a escrita ao
// campo de recado e exige que o professor esteja em essay.teacher_ids.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (me.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    const access = await requireAccountGrant(base44, me, ['teacher']);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const { essayId, note } = await req.json();
    if (!essayId) return Response.json({ error: 'essayId é obrigatório.' }, { status: 400 });

    const svc = base44.asServiceRole.entities;
    const essay = await svc.Essay.get(essayId);
    if (!essay) return Response.json({ error: 'Redação não encontrada.' }, { status: 404 });
    if (!(essay.teacher_ids || []).includes(me.id) && me.role !== 'admin') {
      return Response.json({ error: 'Você não pode editar esta redação.' }, { status: 403 });
    }

    const updated = await svc.Essay.update(essayId, { teacher_note: String(note ?? '') });
    return Response.json({ essay: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});