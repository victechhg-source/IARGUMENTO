import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { LogIn, LogOut } from 'lucide-react';

// Botão de autenticação do header: "Entrar" quando deslogado, "Sair" quando logado.
export default function AuthNav() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" className="ml-1">
        <Link to="/login"><LogIn className="w-4 h-4" />Entrar</Link>
      </Button>
    );
  }

  const name = (user?.full_name || user?.email || 'Aluno').split(' ')[0];

  return (
    <div className="ml-1 flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">Olá, {name}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          logout(false);
          navigate('/login');
        }}
      >
        <LogOut className="w-4 h-4" />Sair
      </Button>
    </div>
  );
}