import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Nenhuma tela do app é acessível sem vínculo institucional gravado.
 * Conta sem escola é enviada para concluir o cadastro (nunca fica órfã em silêncio).
 *
 * Se a escola do usuário está inativa, bloqueia o acesso ao app (tela cheia)
 * sem deslogar — o login em si permanece disponível.
 *
 * Falha na verificação NÃO libera o acesso (fail-closed): erro ou status
 * 'unknown' mostram tela de bloqueio com opção de tentar novamente.
 */
export default function RequireProfile() {
  const { user } = useAuth();
  const [schoolStatus, setSchoolStatus] = useState(null);

  const checkSchool = () => {
    setSchoolStatus(null);
    base44.functions.invoke('getMySchoolStatus')
      .then((res) => {
        const payload = res?.data ?? res;
        const status = payload?.status;
        setSchoolStatus(status === 'active' || status === 'inactive' ? status : 'error');
      })
      .catch(() => setSchoolStatus('error'));
  };

  useEffect(() => {
    if (user && user.role !== 'admin' && user.school_id) {
      checkSchool();
    } else {
      setSchoolStatus(null);
    }
  }, [user]);

  if (user?.suspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Conta suspensa</h1>
        <p className="text-muted-foreground max-w-sm">Sua conta foi suspensa. Fale com o administrador da instituição.</p>
      </div>
    );
  }

  if (user && user.role !== 'admin' && !user.school_id) {
    return <Navigate to="/completar-cadastro" replace />;
  }

  if (schoolStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Não foi possível verificar sua instituição</h1>
        <p className="text-muted-foreground max-w-sm mb-4">Ocorreu um problema ao confirmar a situação da sua escola. Tente novamente em instantes.</p>
        <Button variant="outline" onClick={checkSchool}>Tentar novamente</Button>
      </div>
    );
  }

  if (schoolStatus === 'inactive') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Instituição inativa</h1>
        <p className="text-muted-foreground max-w-sm">Esta instituição está temporariamente inativa. Fale com o administrador.</p>
      </div>
    );
  }

  if (schoolStatus === null && user && user.role !== 'admin' && user.school_id) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}