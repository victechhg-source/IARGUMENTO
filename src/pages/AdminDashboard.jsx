import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import AdminMetricCards from '@/components/admin/AdminMetricCards';
import SchoolManager from '@/components/admin/SchoolManager';
import SchoolAnalytics from '@/components/admin/SchoolAnalytics';
import AgentManager from '@/components/admin/AgentManager';
import UsersTab from '@/components/admin/UsersTab';
import ClassesTab from '@/components/admin/ClassesTab';
import InviteUser from '@/components/admin/InviteUser';
import AuditLogTab from '@/components/admin/AuditLogTab';

const SAMPLE_NOTE = 'Amostra das 100 redações/usos mais recentes.';

// Carregamento por aba (lazy): evita o Promise.all gigante em toda visita.
// Overview/performance usam amostra limitada de essays/usages; contas/turmas/auditoria só carregam o próprio escopo.
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [schools, setSchools] = useState(null);
  const [tab, setTab] = useState('overview');
  const [cache, setCache] = useState({});
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me.role !== 'admin') { setSchools([]); return; }
      const s = await base44.entities.School.list('-created_date');
      setSchools(s);
    })();
  }, []);

  const loadTab = async (t) => {
    if (cache[t] || user?.role !== 'admin') return;
    setLoadingTab(true);
    try {
      let payload = {};
      if (t === 'overview') {
        const [users, memberships, classes, essays, usages] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.ClassMembership.list('-created_date', 200),
          base44.entities.Classroom.list('-created_date'),
          base44.entities.Essay.list('-created_date', 100),
          base44.entities.AgentUsage.list('-created_date', 100),
        ]);
        payload = { users, memberships, classes, essays, usages };
      } else if (t === 'users') {
        payload = { users: await base44.entities.User.list() };
      } else if (t === 'classes') {
        const [classes, memberships] = await Promise.all([
          base44.entities.Classroom.list('-created_date'),
          base44.entities.ClassMembership.list('-created_date', 200),
        ]);
        payload = { classes, memberships };
      } else if (t === 'audit') {
        payload = { auditLogs: await base44.entities.AdminAuditLog.list('-created_date', 200) };
      }
      setCache(prev => ({ ...prev, [t]: payload }));
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && schools) loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user, schools]);

  const reload = () => setCache({});

  if (!user || schools === null) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="p-6 text-center">
          <p className="mb-4">Área exclusiva para administradores.</p>
          <Link to="/admin"><Button>Voltar</Button></Link>
        </Card>
      </div>
    );
  }

  const td = cache[tab] || {};
  const ov = cache.overview || {};
  const students = new Set((ov.memberships || []).filter(m => m.status === 'approved').map(m => m.student_id)).size;
  const teachers = (ov.users || []).filter(u => u.account_type === 'teacher').length;
  const tokens = (ov.usages || []).reduce((n, u) => n + (u.total_tokens || 0), 0);

  return (
    <main className="mx-auto max-w-7xl p-4 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">IArgumento</p>
        <h1 className="font-display text-xl font-extrabold tracking-tight">Administração</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="admin-tabs mb-8 h-auto">
          <TabsTrigger value="overview" className="admin-tab">Visão geral</TabsTrigger>
          <TabsTrigger value="schools" className="admin-tab">Escolas</TabsTrigger>
          <TabsTrigger value="users" className="admin-tab">Contas</TabsTrigger>
          <TabsTrigger value="classes" className="admin-tab">Turmas</TabsTrigger>
          <TabsTrigger value="audit" className="admin-tab">Auditoria</TabsTrigger>
          <TabsTrigger value="agents" className="admin-tab">Agentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          {loadingTab || !ov.users ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <>
              <AdminMetricCards schools={schools.length} teachers={teachers} students={students} classes={(ov.classes || []).length} tokens={tokens} />
              <p className="text-xs text-muted-foreground">{SAMPLE_NOTE}</p>
              <SchoolAnalytics schools={schools} essays={ov.essays || []} usages={ov.usages || []} memberships={ov.memberships || []} classes={ov.classes || []} users={ov.users || []} />
            </>
          )}
        </TabsContent>

        <TabsContent value="schools">
          <SchoolManager schools={schools} onChange={reload} />
        </TabsContent>

        <TabsContent value="users">
          <InviteUser schools={schools} onInvited={() => { setCache(prev => ({ ...prev, users: undefined })); loadTab('users'); }} />
          {loadingTab || !td.users ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <UsersTab users={td.users} schools={schools} currentUserId={user?.id} onChanged={() => { setCache(prev => ({ ...prev, users: undefined })); loadTab('users'); }} />
          )}
        </TabsContent>

        <TabsContent value="classes">
          {loadingTab || !td.classes ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <ClassesTab classes={td.classes} memberships={td.memberships} />
          )}
        </TabsContent>

        <TabsContent value="audit">
          {loadingTab || !td.auditLogs ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <AuditLogTab logs={td.auditLogs} schools={schools} />
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">Configuração dos corretores é de outra equipe. Não altere prompts, modelos nem materiais de treino nesta aba.</div>
          <AgentManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}