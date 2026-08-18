import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Retorna o status da escola vinculada ao usuário autenticado.
// Usado pelo guard de rotas para bloquear acesso quando a escola está inativa.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (!user.school_id) return Response.json({ status: 'active' });

    const schools = await base44.asServiceRole.entities.School.filter({ id: user.school_id });
    const school = schools[0];
    if (!school) return Response.json({ status: 'active' });

    return Response.json({ status: school.status || 'active', name: school.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}