import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, UserCog, ShieldBan, ShieldCheck } from 'lucide-react';

// Ações administrativas sobre uma conta — sempre via adminUpdateAccount (servidor).
export default function UserActionsDialog({ user, schools = [], onClose, onDone }) {
  const [schoolId, setSchoolId] = useState(user.school_id || '');
  const [accountType, setAccountType] = useState(user.account_type || 'student');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const isSelfAdmin = user.role === 'admin';
  const run = async (action, payload = {}) => {
    setErr('');
    setBusy(action);
    try {
      await base44.functions.invoke('adminUpdateAccount', { userId: user.id, action, ...payload });
      onDone();
    } catch (e) {
      setErr(e?.data?.error || e?.data?.message || e?.message || 'Falha na ação.');
    } finally {
      setBusy('');
    }
  };

  const attach = () => {
    if (!schoolId) { setErr('Selecione a escola.'); return; }
    if (!window.confirm(`Vincular esta conta à escola "${schools.find((s) => s.id === schoolId)?.name}"?`)) return;
    run('attach_school', { schoolId });
  };
  const detach = () => {
    if (!window.confirm('Desvincular esta conta da escola?')) return;
    run('detach_school');
  };
  const setType = () => {
    if (!window.confirm(`Definir papel como ${accountType}?`)) return;
    run('set_account_type', { accountType });
  };
  const suspend = () => { if (window.confirm('Suspender esta conta? A pessoa perde o acesso ao app.')) run('suspend'); };
  const unsuspend = () => { if (window.confirm('Reativar esta conta?')) run('unsuspend'); };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.display_name || user.full_name || user.email}</DialogTitle>
          <DialogDescription>{user.email} · {user.registered_id || 'sem ID'}</DialogDescription>
        </DialogHeader>

        {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

        <div className="space-y-4 py-2">
          {/* Escola */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Escola vinculada</Label>
            <div className="flex gap-2">
              <Select value={schoolId} onValueChange={setSchoolId} disabled={isSelfAdmin}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar escola" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={attach} disabled={!!busy || isSelfAdmin || !schoolId}>
                {busy === 'attach_school' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
              </Button>
              <Button variant="ghost" size="sm" onClick={detach} disabled={!!busy || isSelfAdmin || !user.school_id}>Desvincular</Button>
            </div>
          </div>

          {/* Papel */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /> Papel</Label>
            <div className="flex gap-2">
              <Select value={accountType} onValueChange={setAccountType} disabled={isSelfAdmin}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="director">Diretor</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={setType} disabled={!!busy || isSelfAdmin}>Definir</Button>
            </div>
            {isSelfAdmin && <p className="text-xs text-muted-foreground">Não é possível alterar o papel ou escola de um administrador.</p>}
          </div>

          {/* Suspensão */}
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="flex items-center gap-1.5"><ShieldBan className="w-3.5 h-3.5" /> Situação da conta</Label>
            {user.suspended ? (
              <Button variant="outline" size="sm" onClick={unsuspend} disabled={!!busy}>
                {busy === 'unsuspend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Reativar conta
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={suspend} disabled={!!busy}>
                {busy === 'suspend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
                Suspender conta
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}