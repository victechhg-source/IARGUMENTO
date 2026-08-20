import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// A nota não é mais aceita pelo cliente. Persistência é só em runCorrectionAgent.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    return Response.json(
      { error: 'A nota é gravada apenas pelo corretor.' },
      { status: 403 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
