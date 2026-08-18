import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function StudentClasses() {
  const [items, setItems] = useState([]); const [code, setCode] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const load = () => base44.auth.me().then(u => base44.entities.ClassMembership.filter({ student_id: u.id }, '-created_date')).then(setItems);
  useEffect(() => { load(); }, []);
  const join = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await base44.functions.invoke('requestClassJoin', { code }); setCode(''); await load(); } catch (err) { setError(err.response?.data?.error || 'Não foi possível solicitar a entrada.'); } finally { setLoading(false); } };
  return <div className="min-h-screen bg-background text-foreground"><div className="max-w-2xl mx-auto px-4 pt-6"><h1 className="font-semibold">Minhas turmas</h1></div><main className="max-w-2xl mx-auto p-4 py-8 space-y-6"><Card className="p-5"><h2 className="font-semibold mb-1">Entrar em uma turma</h2><p className="text-sm text-muted-foreground mb-4">Digite o código fornecido pelo professor. Sua entrada dependerá da aprovação dele.</p><form onSubmit={join} className="flex gap-2"><Input aria-label="Código da turma" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex.: A7B9C2" required /><Button disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Solicitar entrada</Button></form>{error && <p className="text-sm text-destructive mt-2">{error}</p>}</Card><section><h2 className="font-semibold mb-3">Turmas solicitadas</h2><div className="space-y-2">{items.map(item => <Card key={item.id} className="p-4 flex justify-between gap-3"><div><p className="font-medium">{item.class_name}</p><p className="text-sm text-muted-foreground">Professor: {item.teacher_name}</p></div><span className="text-sm font-medium">{item.status === 'approved' ? 'Aprovado' : item.status === 'rejected' ? 'Recusado' : 'Aguardando aprovação'}</span></Card>)}{!items.length && <p className="text-sm text-muted-foreground">Você ainda não solicitou entrada em nenhuma turma.</p>}</div></section></main></div>;
}