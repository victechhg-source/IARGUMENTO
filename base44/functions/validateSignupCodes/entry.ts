import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveAccessCode, resolveClassroom } from '../../shared/signupCodes.ts';

// Pré-validação para feedback em tela. Não altera nada e não é fonte de
// verdade: a decisão real de papel/vínculo acontece em completeSignup.
// Público (a tela de registro não tem sessão), então a resposta é MÍNIMA:
// { valid, account_type, school: { name }, needs_class? } — sem school.id e
// sem nenhum código. school.name fica aninhado porque o hook
// useAccessCodeValidation consome payload.school.name.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { access_code, school_code, class_code } = body;

    const resolved = await resolveAccessCode(base44, access_code || school_code);
    if (!resolved) {
      return Response.json({ valid: false, error: 'Código de acesso inválido ou escola inativa.' }, { status: 404 });
    }
    const { school, accountType } = resolved;
    const schoolInfo = { name: school.name };

    if (accountType === 'student') {
      const result = await resolveClassroom(base44, class_code, school);
      if (result.error) {
        // O papel já é conhecido: a tela usa isso para exibir o campo de turma.
        return Response.json({
          valid: false,
          needs_class: true,
          account_type: accountType,
          school: schoolInfo,
          error: result.error,
        }, { status: 200 });
      }
    }

    return Response.json({ valid: true, account_type: accountType, school: schoolInfo });
  } catch (error) {
    console.error(error);
    return Response.json({ valid: false, error: 'Erro interno.' }, { status: 500 });
  }
}
