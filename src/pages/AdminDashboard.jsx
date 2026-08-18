import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button'; import { Card } from '@/components/ui/card'; import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react'; import AdminMetricCards from '@/components/admin/AdminMetricCards'; import SchoolManager from '@/components/admin/SchoolManager'; import SchoolAnalytics from '@/components/admin/SchoolAnalytics'; import PerformanceComparison from '@/components/admin/PerformanceComparison'; import AgentManager from '@/components/admin/AgentManager';
import UsersTab from '@/components/admin/UsersTab';
import ClassesTab from '@/components/admin/ClassesTab';
import InviteUser from '@/components/admin/InviteUser';
import RoleTestPanel from '@/components/admin/RoleTestPanel';
import RoleTestPlaybook from '@/components/admin/RoleTestPlaybook';

export default function AdminDashboard() {
  const [user, setUser] = useState(null); const [data, setData] = useState(null);
  const load = async () => { const me = await base44.auth.me(); setUser(me); if (me.role !== 'admin') { setData({}); return; } const [schools, users, memberships, classes, essays, usages] = await Promise.all([base44.entities.School.list('-created_date'), base44.entities.User.list(), base44.entities.ClassMembership.list(), base44.entities.Classroom.list(), base44.entities.Essay.list('-created_date', 500), base44.entities.AgentUsage.list('-created_date', 500)]); setData({ schools, users, memberships, classes, essays, usages }); };
  useEffect(() => { load(); }, []);
  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (user?.role !== 'admin') return <div className="min-h-screen flex items-center justify-center"><Card className="p-6 text-center"><p className="mb-4">Área exclusiva para administradores.</p><Link to="/"><Button>Voltar ao início</Button></Link></Card></div>;
  const students = new Set(data.memberships.filter(m => m.status === 'approved').map(m => m.student_id)).size; const teachers = data.users.filter(u => u.account_type === 'teacher').length; const tokens = data.usages.reduce((n, u) => n + (u.total_tokens || 0), 0);
  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-20 border-b border-foreground/25 bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4"><Link to="/"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft className="w-4 h-4" /></Button></Link><div><p className="text-[11px] font-semibold uppercase tracking-widest text-primary">IArgumento</p><h1 className="font-display text-xl font-extrabold tracking-tight">Administração</h1></div></div></header><main className="mx-auto max-w-7xl p-4 py-8"><Tabs defaultValue="overview"><TabsList className="admin-tabs mb-8 h-auto"><TabsTrigger value="overview" className="admin-tab">Visão geral</TabsTrigger><TabsTrigger value="performance" className="admin-tab">Comparativo</TabsTrigger><TabsTrigger value="schools" className="admin-tab">Escolas</TabsTrigger><TabsTrigger value="users" className="admin-tab">Contas</TabsTrigger>
<TabsTrigger value="classes" className="admin-tab">Turmas</TabsTrigger>
<TabsTrigger value="tests" className="admin-tab">Testes</TabsTrigger>
<TabsTrigger value="agents" className="admin-tab">Agentes</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-5"><AdminMetricCards schools={data.schools.length} teachers={teachers} students={students} classes={data.classes.length} tokens={tokens} /><SchoolAnalytics {...data} /></TabsContent><TabsContent value="performance"><PerformanceComparison {...data} /></TabsContent><TabsContent value="schools"><SchoolManager schools={data.schools} onChange={load} /></TabsContent><TabsContent value="agents" className="space-y-4"><div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">Configuração dos corretores é de outra equipe. Não altere prompts, modelos nem materiais de treino nesta aba.</div><AgentManager /></TabsContent>
<TabsContent value="users"><InviteUser schools={data.schools} onInvited={load} /><UsersTab users={data.users} schools={data.schools} currentUserId={user?.id} /></TabsContent>
<TabsContent value="classes"><ClassesTab classes={data.classes} memberships={data.memberships} /></TabsContent>
<TabsContent value="tests" className="space-y-5"><RoleTestPanel user={user} schools={data.schools} onChange={load} /><RoleTestPlaybook /></TabsContent></Tabs></main></div>;
}