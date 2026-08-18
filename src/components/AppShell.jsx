import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';
import AuthNav from '@/components/account/AuthNav';
import { Image } from '@/components/ui/image';
import { GraduationCap, Users, Building2, Shield, History, Plus, User } from 'lucide-react';

// Shell autenticado: header global em TODAS as páginas protegidas.
// Logo → home do papel; links por papel; AuthNav à direita.
export default function AppShell() {
  const { user } = useAuth();
  const role = user?.role === 'admin' ? 'admin' : (user?.account_type || 'student');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={homePathFor(user)} className="flex items-center gap-2 shrink-0" aria-label="IArgumento — início">
            <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/56e253dba_ICON_logo.png" alt="IArgumento" fittingType="fit" className="h-8 w-8" />
            <span className="font-display font-extrabold tracking-tight text-[#E9861A] text-lg leading-none">IArgumento</span>
          </Link>
          <nav className="flex items-center gap-1 ml-auto" aria-label="Navegação principal">
            {role === 'student' && (
              <>
                <Link to="/nova-redacao" className="kinetic-link"><Plus className="w-4 h-4" />Nova redação</Link>
                <Link to="/historico" className="kinetic-link"><History className="w-4 h-4" />Progresso</Link>
                <Link to="/minhas-turmas" className="kinetic-link"><GraduationCap className="w-4 h-4" />Turmas</Link>
              </>
            )}
            {role === 'teacher' && (
              <Link to="/professor" className="kinetic-link"><Users className="w-4 h-4" />Turmas</Link>
            )}
            {role === 'director' && (
              <Link to="/diretor" className="kinetic-link"><Building2 className="w-4 h-4" />Escola</Link>
            )}
            {role === 'admin' && (
              <Link to="/admin" className="kinetic-link"><Shield className="w-4 h-4" />Administração</Link>
            )}
            <Link to="/conta" className="kinetic-link"><User className="w-4 h-4" />Conta</Link>
            <AuthNav />
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}