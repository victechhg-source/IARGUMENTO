import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';

/**
 * Guard de papel aplicado na definição da rota (não só dentro da página).
 * - adminOnly: exige role de plataforma "admin".
 * - allow: lista de account_type permitidos.
 * O ADMIN tem acesso a tudo, sem distinções — ignora qualquer restrição de
 * papel (inclusive papéis de teste assumidos no painel).
 */
export default function RoleRoute({ allow = [], adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  if (adminOnly) {
    return isAdmin ? <Outlet /> : <Navigate to={homePathFor(user)} replace />;
  }
  if (isAdmin) return <Outlet />;
  if (allow.includes(user.account_type || 'student')) return <Outlet />;

  return <Navigate to={homePathFor(user)} replace />;
}