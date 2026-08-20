import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';

/**
 * Badge no header do professor quando há pedidos de turma pendentes.
 */
export default function PendingJoinBadge() {
  const [count, setCount] = useState(0);

  const load = async () => {
    try {
      const me = await base44.auth.me();
      if ((me.account_type || '') !== 'teacher') return;
      const rows = await base44.entities.ClassMembership.filter({
        teacher_id: me.id,
        status: 'pending',
      });
      setCount(rows.length);
    } catch {
      // silencioso — o painel ainda carrega a lista
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 45000);
    return () => clearInterval(timer);
  }, []);

  if (!count) return null;
  return (
    <Link
      to="/professor"
      className="kinetic-link relative"
      aria-label={`${count} solicitação(ões) pendente(s)`}
    >
      <Bell className="w-4 h-4" />
      <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground text-center">
        {count}
      </span>
    </Link>
  );
}
