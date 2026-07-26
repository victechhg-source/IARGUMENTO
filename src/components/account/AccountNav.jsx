import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Users, Shield } from 'lucide-react';

export default function AccountNav() {
  const [type, setType] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      const pending = localStorage.getItem('pendingAccountType');
      if (pending) {
        if (pending === 'teacher') {
          const code = localStorage.getItem('pendingSchoolCode');
          await base44.functions.invoke('redeemSchoolCode', { code });
          localStorage.removeItem('pendingSchoolCode');
        } else await base44.auth.updateMe({ account_type: pending });
        localStorage.removeItem('pendingAccountType');
        setType(pending);
      } else setType(user.role === 'admin' ? 'admin' : (user.account_type || 'student'));
    });
  }, []);

  const admin = type === 'admin';
  const teacher = type === 'teacher';
  return (
    <Link to={admin ? '/admin' : teacher ? '/professor' : '/minhas-turmas'} className="kinetic-link">
      {admin ? <Shield className="w-4 h-4" /> : teacher ? <Users className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
      {admin ? 'Administração' : teacher ? 'Painel do professor' : 'Minhas turmas'}
    </Link>
  );
}