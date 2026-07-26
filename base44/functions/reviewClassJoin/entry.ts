import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const { membershipId, decision } = await req.json();
    if (!membershipId || !['approved', 'rejected'].includes(decision)) {
      return Response.json({ error: 'Solicitação inválida.' }, { status: 400 });
    }

    const membership = await base44.asServiceRole.entities.ClassMembership.get(membershipId);
    if (!membership || membership.teacher_id !== user.id) {
      return Response.json({ error: 'Você não pode analisar esta solicitação.' }, { status: 403 });
    }

    const updated = await base44.asServiceRole.entities.ClassMembership.update(membershipId, { status: decision });
    if (decision === 'approved') {
      const essays = await base44.asServiceRole.entities.Essay.filter({ created_by_id: membership.student_id });
      if (essays.length) {
        await base44.asServiceRole.entities.Essay.bulkUpdate(essays.map((essay) => ({
          id: essay.id,
          teacher_ids: [...new Set([...(essay.teacher_ids || []), user.id])],
          school_ids: [...new Set([...(essay.school_ids || []), membership.school_id].filter(Boolean))]
        })));
      }
    }
    return Response.json({ membership: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});