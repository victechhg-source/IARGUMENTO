import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, User, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import AccessCodeFields from '@/components/auth/AccessCodeFields';
import useAccessCodeValidation from '@/hooks/useAccessCodeValidation';
import { readPendingSignup, clearPendingSignup, homePathFor } from '@/lib/roles';

/**
 * Conclusão de cadastro explícita e recuperável: se o vínculo institucional não
 * foi gravado (retorno de OAuth em outra aba, storage limpo, falha de rede),
 * o usuário vê esta tela e pode digitar os códigos novamente.
 */
export default function CompleteSignup() {
  const { user, checkUserAuth } = useAuth();
  const pending = readPendingSignup();

  const [fullName, setFullName] = useState(pending.fullName || user?.display_name || user?.full_name || '');
  const [accessCode, setAccessCode] = useState(pending.accessCode);
  const [classCode, setClassCode] = useState(pending.classCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validation = useAccessCodeValidation(accessCode, classCode);
  const ready = !!fullName.trim() && validation.status === 'valid';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('completeSignup', {
        access_code: accessCode.trim(),
        class_code: classCode.trim(),
        full_name: fullName.trim(),
      });
      const payload = res?.data ?? res;
      if (!payload?.completed && !payload?.already_completed) {
        setError(payload?.error || 'Não foi possível concluir o cadastro.');
        return;
      }
      clearPendingSignup();
      await checkUserAuth();
      window.location.href = homePathFor({ ...user, ...payload });
    } catch (err) {
      const data = err?.response?.data || err?.data;
      setError(data?.error || err?.message || 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Concluir cadastro"
      subtitle="Falta vincular sua conta à escola"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full-name">Nome completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="pl-10 h-12"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <AccessCodeFields
          accessCode={accessCode}
          onAccessCodeChange={setAccessCode}
          classCode={classCode}
          onClassCodeChange={setClassCode}
          validation={validation}
        />

        <Button type="submit" className="w-full h-12 font-medium" disabled={!ready || loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Concluindo…
            </>
          ) : (
            'Concluir cadastro'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}