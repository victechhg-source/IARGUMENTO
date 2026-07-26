import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Users } from 'lucide-react';

export default function AccountNav() {
  const [type, setType] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      const pending = localStorage.getItem('pendingAccountType');
      if (!user.account_type && pending) {
        await base44.auth.updateMe({ account_type: pending });
        localStorage.removeItem('pendingAccountType');
        setType(pending);
      } else setType(user.account_type || 'student');
    });
  }, []);

  const teacher = type === 'teacher';
  return (
    <Link to={teacher ? '/professor' : '/minhas-turmas'} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2">
      {teacher ? <Users className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
      {teacher ? 'Painel do professor' : 'Minhas turmas'}
    </Link>
  );
}