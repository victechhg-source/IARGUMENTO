import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Users, Shield, Building2 } from 'lucide-react';

export default function AccountNav() {
  const [type, setType] = useState(null);

  // O papel vem exclusivamente do perfil gravado no servidor.
  useEffect(() => {
    base44.auth.me().then((user) => {
      setType(user.role === 'admin' ? 'admin' : (user.account_type || 'student'));
    });
  }, []);

  const admin = type === 'admin';
  const teacher = type === 'teacher';
  const director = type === 'director';
  return (
    <>
      {admin && (
        <Link to="/admin" className="kinetic-link">
          <Shield className="w-4 h-4" />
          Administração
        </Link>
      )}
      {director && (
        <Link to="/diretor" className="kinetic-link">
          <Building2 className="w-4 h-4" />
          Painel da escola
        </Link>
      )}
      {teacher && (
        <Link to="/professor" className="kinetic-link">
          <Users className="w-4 h-4" />
          Painel do professor
        </Link>
      )}
      {!teacher && !admin && !director && (
        <Link to="/minhas-turmas" className="kinetic-link">
          <GraduationCap className="w-4 h-4" />
          Minhas turmas
        </Link>
      )}
    </>
  );
}