import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveAccessCode, resolveClassroom } from '../../shared/signupCodes.ts';
import { consumeRateLimit } from '../../shared/rateLimit.ts';

// Pré-validação autenticada para feedback em /completar-cadastro.
// A tela pública /registro NÃO chama esta function — só confere formato.
// Resposta mínima: { valid, account_type, school: { name }, needs_class? }.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ valid: false, error: 'Não autorizado' }, { status: 401 });
    }
    if (user.suspended === true) {
      return Response.json({ valid: false, error: 'Conta suspensa.' }, { status: 403 });
    }
    if (!consumeRateLimit(`signup-validate:${user.id}`, 8, 60_000)) {
      return Response.json(
        { valid: false, error: 'Muitas tentativas. Aguarde um minuto.' },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { access_code, school_code, class_code } = body;

    const resolved = await resolveAccessCode(base44, access_code || school_code);
    if (!resolved) {
      return Response.json(
        { valid: false, error: 'Código de acesso inválido ou escola inativa.' },
        { status: 404 },
      );
    }
    const { school, accountType } = resolved;
    const schoolInfo = { name: school.name };

    if (accountType === 'student') {
      const result = await resolveClassroom(base44, class_code, school);
      if (result.error) {
        return Response.json({
          valid: false,
          needs_class: true,
          account_type: accountType,
          school: schoolInfo,
          error: result.error,
        }, { status: 200 });
      }
    }

    return Response.json({
      valid: true,
      account_type: accountType,
      school: schoolInfo,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ valid: false, error: 'Erro interno.' }, { status: 500 });
  }
}
