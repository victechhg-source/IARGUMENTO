import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Retorna o status da escola vinculada ao usuário autenticado.
// Usado pelo guard de rotas para bloquear acesso quando a escola está
// inativa. FAIL-CLOSED: se o usuário tem escola vinculada e ela não é
// encontrada (ou a consulta falha), devolve 'unknown' — nunca 'active'.
// Sem escola vinculada continua 'active' para não travar admin.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
    if (!user.school_id) return Response.json({ status: 'active' });

    try {
      const schools = await base44.asServiceRole.entities.School.filter({ id: user.school_id });
      const school = schools[0];
      if (!school) return Response.json({ status: 'unknown' });
      return Response.json({ status: school.status || 'active', name: school.name });
    } catch (error) {
      console.error(error);
      return Response.json({ status: 'unknown' });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
