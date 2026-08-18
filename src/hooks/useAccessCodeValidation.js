import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Pré-valida o código de acesso (e o da turma, quando o código é de aluno).
 * Retorna { status, accountType, schoolName, message }.
 * status: idle | checking | valid | invalid
 */
export default function useAccessCodeValidation(accessCode, classCode) {
  const [state, setState] = useState({ status: 'idle', accountType: null, schoolName: '', message: '' });

  useEffect(() => {
    const code = (accessCode || '').trim();
    if (!code) {
      setState({ status: 'idle', accountType: null, schoolName: '', message: '' });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, status: 'checking', message: '' }));

    const timer = setTimeout(async () => {
      let payload;
      try {
        const res = await base44.functions.invoke('validateSignupCodes', {
          access_code: code,
          class_code: (classCode || '').trim(),
        });
        payload = res?.data ?? res;
      } catch (err) {
        payload = err?.response?.data || err?.data || { valid: false, error: 'Não foi possível validar o código agora.' };
      }
      if (cancelled) return;

      setState({
        status: payload?.valid ? 'valid' : 'invalid',
        accountType: payload?.account_type || null,
        schoolName: payload?.school?.name || '',
        message: payload?.valid ? '' : (payload?.error || 'Código inválido.'),
      });
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [accessCode, classCode]);

  return state;
}