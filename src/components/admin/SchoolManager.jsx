import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function SchoolManager({ schools, onChange }) {
  const [name, setName] = useState('');
  const create = async (e) => { e.preventDefault(); const code = `ESC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; await base44.entities.School.create({ name, institutional_code: code, status: 'active' }); setName(''); onChange(); };
  return <div className="space-y-4"><Card className="p-4"><h2 className="font-semibold mb-3">Cadastrar escola</h2><form onSubmit={create} className="flex gap-2"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da escola" aria-label="Nome da escola" required /><Button><Plus className="w-4 h-4 mr-2" />Cadastrar</Button></form></Card><div className="space-y-2">{schools.map(s => <Card key={s.id} className="p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.status === 'active' ? 'Ativa' : 'Inativa'}</p></div><code className="font-bold tracking-wider bg-muted rounded px-3 py-2">{s.institutional_code}</code></Card>)}</div></div>;
}