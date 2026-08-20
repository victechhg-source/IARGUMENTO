import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sanitizeDisplayName } from '../../shared/accountGrant.ts';

// Única via de perfil no cliente: só display_name.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.suspended === true) {
      return Response.json({ error: 'Conta suspensa.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = sanitizeDisplayName(body.display_name);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    await base44.auth.updateMe({ display_name: parsed.name });
    const me = await base44.auth.me();
    return Response.json({ user: me });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Erro interno.' }, { status: 500 });
  }
});
