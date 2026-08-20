import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Professor aprova/recusa/remove uma solicitação de turma.
// - approved: anexa o professor (teacher_ids) e SOMENTE a escola desta
//   membership (school_ids) às redações do aluno.
// - rejected/removed: remove o professor de teacher_ids quando ele não tem
//   outra membership aprovada com o aluno, e remove a escola de school_ids
//   quando não resta outro vínculo aprovado daquela escola.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }
    const { membershipId, decision } = await req.json();
    if (!membershipId || !['approved', 'rejected', 'removed'].includes(decision)) {
      return Response.json({ error: 'Solicitação inválida.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const membership = await svc.ClassMembership.get(membershipId);
    if (!membership || membership.teacher_id !== user.id) {
      return Response.json({ error: 'Você não pode analisar esta solicitação.' }, { status: 403 });
    }

    const updated = await svc.ClassMembership.update(membershipId, { status: decision });
    const essays = await svc.Essay.filter({ created_by_id: membership.student_id });

    if (decision === 'approved') {
      if (essays.length) {
        await svc.Essay.bulkUpdate(essays.map((essay) => ({
          id: essay.id,
          teacher_ids: [...new Set([...(essay.teacher_ids || []), user.id])],
          school_ids: [...new Set([...(essay.school_ids || []), membership.school_id].filter(Boolean))]
        })));
      }
    } else {
      // A membership recém-atualizada já não é 'approved' e fica de fora.
      const stillApproved = await svc.ClassMembership.filter({
        student_id: membership.student_id,
        status: 'approved',
      });
      const keepTeacher = stillApproved.some((m) => m.teacher_id === user.id);
      const keepSchool = membership.school_id
        ? stillApproved.some((m) => m.school_id === membership.school_id)
        : true;

      const changes = essays
        .map((essay) => {
          const change = { id: essay.id };
          let dirty = false;
          if (!keepTeacher && (essay.teacher_ids || []).includes(user.id)) {
            change.teacher_ids = (essay.teacher_ids || []).filter((id) => id !== user.id);
            dirty = true;
          }
          if (!keepSchool && (essay.school_ids || []).includes(membership.school_id)) {
            change.school_ids = (essay.school_ids || []).filter((id) => id !== membership.school_id);
            dirty = true;
          }
          return dirty ? change : null;
        })
        .filter(Boolean);
      if (changes.length) await svc.Essay.bulkUpdate(changes);
    }

    return Response.json({ membership: updated });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
