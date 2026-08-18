import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';

/**
 * Com sessão ativa, login/cadastro não abrem: evita que um usuário já vinculado
 * inicie um novo cadastro sobre a própria conta.
 */
export default function RedirectIfAuthenticated() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    const target = user.role !== 'admin' && !user.school_id ? '/completar-cadastro' : homePathFor(user);
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}