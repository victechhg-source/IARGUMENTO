import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { homePathFor } from '@/lib/roles';
import AuthNav from '@/components/account/AuthNav';
import { Image } from '@/components/ui/image';
import { Home, PenLine, CalendarRange, History, BookMarked, User } from 'lucide-react';

// Shell autenticado: header global em TODAS as páginas protegidas.
// Logo → home do papel; links por papel; AuthNav à direita.
export default function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  // Na tela inicial só aparece Conta no canto superior (o hub é a navegação);
  // nas demais telas, os links das seções. Painéis por papel ficam na aba Conta.
  const isHome = location.pathname === '/inicio';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={homePathFor(user)} className="flex items-center gap-2 shrink-0" aria-label="IArgumento — início">
            <Image src="https://media.base44.com/images/public/6a6602cb58785bab45511cab/56e253dba_ICON_logo.png" alt="IArgumento" fittingType="fit" className="h-8 w-8" />
            <span className="font-display font-extrabold tracking-tight text-[#E9861A] text-lg leading-none">IArgumento</span>
          </Link>
          <nav className="flex items-center gap-1 ml-auto" aria-label="Navegação principal">
            {!isHome && (
              <>
                <Link to="/inicio" className="kinetic-link"><Home className="w-4 h-4" />Início</Link>
                <Link to="/nova-redacao" className="kinetic-link"><PenLine className="w-4 h-4" />Nova redação</Link>
                <Link to="/planner" className="kinetic-link"><CalendarRange className="w-4 h-4" />Planner</Link>
                <Link to="/historico" className="kinetic-link"><History className="w-4 h-4" />Histórico</Link>
                <Link to="/exam-guides" className="kinetic-link"><BookMarked className="w-4 h-4" />Bancas</Link>
              </>
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