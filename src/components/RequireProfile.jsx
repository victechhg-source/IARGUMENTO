import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Nenhuma tela do app é acessível sem vínculo institucional gravado.
 * Conta sem escola é enviada para concluir o cadastro (nunca fica órfã em silêncio).
 */
export default function RequireProfile() {
  const { user } = useAuth();

  if (user && user.role !== 'admin' && !user.school_id) {
    return <Navigate to="/completar-cadastro" replace />;
  }
  return <Outlet />;
}