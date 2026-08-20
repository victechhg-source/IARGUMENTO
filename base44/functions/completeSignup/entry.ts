import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveAccessCode, resolveClassroom, generateRegisteredId } from '../../shared/signupCodes.ts';
import { upsertAccountGrant } from '../../shared/accountGrant.ts';

// Única via autoritativa de conclusão de cadastro.
// O cliente envia apenas códigos; o servidor decide papel, escola e ID público.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { access_code, class_code, full_name } = body;
    const svc = base44.asServiceRole.entities;

    const grants = await svc.AccountGrant.filter({ user_id: user.id });
    const grant = grants[0];

    if (grant) {
      let membership = null;
      if (grant.account_type === 'student' && class_code) {
        const result = await resolveClassroom(base44, class_code, {
          id: grant.school_id,
          name: grant.school_name,
        });
        if (result.error) return Response.json({ error: result.error }, { status: result.status });
        const existing = await svc.ClassMembership.filter({
          class_id: result.classroom.id,
          student_id: user.id,
        });
        membership = existing[0] || await svc.ClassMembership.create({
          class_id: result.classroom.id,
          class_name: result.classroom.name,
          class_code: result.classroom.code,
          teacher_id: result.classroom.teacher_id,
          teacher_name: result.classroom.teacher_name,
          school_id: result.classroom.school_id || grant.school_id,
          student_id: user.id,
          student_name: user.display_name || user.full_name || user.email,
          student_email: user.email,
          status: 'pending',
        });
      }
      return Response.json({
        already_completed: true,
        account_type: grant.account_type,
        school: { id: grant.school_id, name: grant.school_name },
        registered_id: user.registered_id,
        membership_status: membership ? membership.status : null,
      });
    }

    const resolved = await resolveAccessCode(base44, access_code);
    if (!resolved) {
      return Response.json({ error: 'Código de acesso inválido ou escola inativa.' }, { status: 404 });
    }
    const { school, accountType } = resolved;

    let classroom = null;
    let classroomError = null;
    if (accountType === 'student') {
      const result = await resolveClassroom(base44, class_code, school);
      if (result.error) { classroomError = result; } else { classroom = result.classroom; }
    }

    const registeredId = user.registered_id || await generateRegisteredId(base44, user.role, accountType);
    const name = String(full_name || '').trim();
    if (name) await base44.auth.updateMe({ display_name: name });

    await svc.User.update(user.id, {
      account_type: accountType,
      school_id: school.id,
      school_name: school.name,
      registered_id: registeredId,
    });
    await upsertAccountGrant(base44, {
      user_id: user.id,
      account_type: accountType,
      school_id: school.id,
      school_name: school.name,
    });

    if (classroomError) {
      return Response.json({ error: classroomError.error }, { status: classroomError.status });
    }

    let membership = null;
    if (classroom) {
      const existing = await svc.ClassMembership.filter({
        class_id: classroom.id,
        student_id: user.id,
      });
      membership = existing[0] || await svc.ClassMembership.create({
        class_id: classroom.id,
        class_name: classroom.name,
        class_code: classroom.code,
        teacher_id: classroom.teacher_id,
        teacher_name: classroom.teacher_name,
        school_id: classroom.school_id || school.id,
        student_id: user.id,
        student_name: name || user.full_name || user.email,
        student_email: user.email,
        status: 'pending',
      });
    }

    return Response.json({
      completed: true,
      account_type: accountType,
      school: { id: school.id, name: school.name },
      registered_id: registeredId,
      membership_status: membership ? membership.status : null,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
