import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MetricCards from '@/components/teacher/MetricCards';
import Insights from '@/components/teacher/Insights';
import EssayListItem from '@/components/essay/EssayListItem';

export default function StudentPerformance() {
  const { studentId } = useParams(); const [member, setMember] = useState(null); const [essays, setEssays] = useState(null);
  useEffect(() => { base44.auth.me().then(async me => { const memberships = await base44.entities.ClassMembership.filter({ teacher_id: me.id, student_id: studentId, status: 'approved' }); setMember(memberships[0] || null); const visible = await base44.entities.Essay.filter({ teacher_ids: me.id, status: 'completed' }, '-created_date', 100); setEssays(visible.filter(e => e.created_by_id === studentId)); }); }, [studentId]);
  if (essays === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!member) return <div className="min-h-screen flex items-center justify-center"><Card className="p-6">Aluno não encontrado nesta turma.</Card></div>;
  return <div className="min-h-screen bg-muted/30"><header className="border-b bg-white"><div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3"><Link to="/professor"><Button variant="ghost" size="icon" aria-label="Voltar"><ArrowLeft className="w-4 h-4" /></Button></Link><div><h1 className="font-semibold">{member.student_name}</h1><p className="text-sm text-muted-foreground">{member.student_email}</p></div></div></header><main className="max-w-4xl mx-auto p-4 py-6 space-y-6"><MetricCards students={[member]} essays={essays} /><Insights essays={essays} /><section><h2 className="font-semibold mb-3">Correções do aluno</h2><div className="space-y-2">{essays.map(e => <EssayListItem key={e.id} essay={e} />)}{!essays.length && <p className="text-sm text-muted-foreground">Este aluno ainda não possui redações corrigidas.</p>}</div></section></main></div>;
}