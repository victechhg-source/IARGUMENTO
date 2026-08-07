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

  const name = (user?.display_name || user?.full_name || user?.email || 'Aluno').split(' ')[0];
  const email = user?.email || '';

  return (
    <div className="ml-1 flex items-center gap-2">
      <div className="hidden text-right leading-tight sm:block">
        <span className="block max-w-[160px] truncate text-sm font-medium">{name}</span>
        <span className="block max-w-[180px] truncate text-[11px] text-muted-foreground">{email}</span>
        {user?.registered_id && <span className="block font-mono text-[10px] text-primary/80">{user.registered_id}</span>}
      </div>
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