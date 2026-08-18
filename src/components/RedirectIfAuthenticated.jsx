import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';

/**
 * Com sessão ativa, login/cadastro não abrem: evita que um usuário já vinculado
 * inicie um novo cadastro sobre a própria conta.
 *
 * A sessão pode existir sem que o AuthProvider tenha resolvido `isAuthenticated`
 * ainda (isso só acontece automaticamente quando há um access_token na URL).
 * Por isso, assim como em ProtectedRoute, disparamos checkUserAuth aqui para
 * garantir que a sessão seja verificada antes de decidir mostrar o formulário.
 */
export default function RedirectIfAuthenticated() {
  const { user, isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const target = user.role !== 'admin' && !user.school_id ? '/completar-cadastro' : homePathFor(user);
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}