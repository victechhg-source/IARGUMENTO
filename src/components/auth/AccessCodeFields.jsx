import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Hash, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { roleLabel } from '@/lib/roles';

/**
 * Campos de vínculo institucional. O papel não é escolhido pelo usuário:
 * ele é revelado pelo código de acesso e confirmado pelo servidor.
 */
export default function AccessCodeFields({ accessCode, onAccessCodeChange, classCode, onClassCodeChange, validation }) {
  const showClass = validation.accountType === 'student';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="access-code">Código de acesso</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="access-code"
            value={accessCode}
            onChange={(e) => onAccessCodeChange(e.target.value.toUpperCase())}
            placeholder="ALU-XXXXXX"
            className="pl-10 h-12 tracking-wider"
            autoComplete="off"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">Fornecido pela sua escola. Ele define seu perfil de acesso.</p>
      </div>

      {showClass && (
        <div className="space-y-2">
          <Label htmlFor="class-code">Código da turma</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="class-code"
              value={classCode}
              onChange={(e) => onClassCodeChange(e.target.value.toUpperCase())}
              placeholder="TURMA-XXXX"
              className="pl-10 h-12 tracking-wider"
              autoComplete="off"
              required
            />
          </div>
        </div>
      )}

      {validation.status !== 'idle' && (
        <div
          role="status"
          className={`flex items-center gap-1.5 text-xs font-medium ${
            validation.status === 'valid' ? 'text-emerald-600'
            : validation.status === 'invalid' ? 'text-destructive'
            : 'text-muted-foreground'
          }`}
        >
          {validation.status === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {validation.status === 'valid' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {validation.status === 'invalid' && <XCircle className="w-3.5 h-3.5" />}
          {validation.status === 'checking'
            ? 'Verificando código…'
            : validation.status === 'valid'
              ? `${roleLabel(validation.accountType)} · ${validation.schoolName}`
              : validation.message}
        </div>
      )}
    </div>
  );
}