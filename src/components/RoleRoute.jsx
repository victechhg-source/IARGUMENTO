import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';

/**
 * Guard de papel aplicado na definição da rota (não só dentro da página).
 * - adminOnly: exige role de plataforma "admin".
 * - allow: lista de account_type permitidos.
 * Admin sem papel de teste assumido acessa tudo; ao assumir um papel no painel
 * de testes, o guard passa a valer para ele (simulação fiel).
 */
export default function RoleRoute({ allow = [], adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const testingRole = isAdmin && !!user.school_id && !!user.account_type;

  if (adminOnly) {
    return isAdmin ? <Outlet /> : <Navigate to={homePathFor(user)} replace />;
  }
  if (isAdmin && !testingRole) return <Outlet />;
  if (allow.includes(user.account_type || 'student')) return <Outlet />;

  return <Navigate to={homePathFor(user)} replace />;
}