import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const { code } = await req.json();
    const normalized = String(code || '').trim().toUpperCase();
    const schools = await base44.asServiceRole.entities.School.filter({ institutional_code: normalized, status: 'active' });
    if (!schools.length) return Response.json({ error: 'Código institucional inválido ou inativo.' }, { status: 404 });
    const school = schools[0];
    const updated = await base44.auth.updateMe({ account_type: 'teacher', school_id: school.id, school_name: school.name });
    return Response.json({ user: updated, school: { id: school.id, name: school.name } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});