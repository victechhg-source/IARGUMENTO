import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateAccessCode } from '../../shared/signupCodes.ts';
import { logAdminAction } from '../../shared/auditLog.ts';

// Rotaciona um código de acesso de escola (ALU/PRO/DIR). Somente admin.
// O código antigo deixa de funcionar imediatamente para novos cadastros.
const FIELD_TO_PREFIX = {
  student_code: 'ALU',
  teacher_code: 'PRO',
  director_code: 'DIR',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (user.suspended === true) return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { schoolId, field } = body;
    if (!schoolId || !field) return Response.json({ error: 'schoolId e field são obrigatórios.' }, { status: 400 });
    const prefix = FIELD_TO_PREFIX[field];
    if (!prefix) return Response.json({ error: 'Campo inválido. Use student_code, teacher_code ou director_code.' }, { status: 400 });

    const schools = await base44.asServiceRole.entities.School.filter({ id: schoolId });
    if (!schools.length) return Response.json({ error: 'Escola não encontrada.' }, { status: 404 });
    const school = schools[0];

    const newCode = await generateAccessCode(base44, prefix, field);
    await base44.asServiceRole.entities.School.update(school.id, { [field]: newCode });
    await logAdminAction(base44, {
      actor_id: user.id, actor_email: user.email, action: 'rotate_school_code',
      target_type: 'school', target_id: school.id, school_id: school.id, detail: `field=${field}`,
    });

    return Response.json({ field, code: newCode });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}