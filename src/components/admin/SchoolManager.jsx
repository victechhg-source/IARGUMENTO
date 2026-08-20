import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SchoolCodes from '@/components/admin/SchoolCodes';

export default function SchoolManager({ schools, onChange }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      // Os códigos de acesso são gerados no servidor.
      await base44.functions.invoke('createSchool', { name });
      setName('');
      onChange();
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Não foi possível cadastrar a escola.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-1 font-semibold">Cadastrar escola</h2>
        <p className="mb-3 text-sm text-muted-foreground">Cada escola recebe três códigos de acesso. O código entregue define o perfil de quem se cadastra.</p>
        <form onSubmit={create} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da escola" aria-label="Nome da escola" required />
          <Button disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Cadastrar
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </Card>

      <div className="space-y-2">
        {schools.map((s) => (
          <Card key={s.id} className="space-y-3 p-4">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">{s.status === 'active' ? 'Ativa' : 'Inativa'}</p>
            </div>
            <SchoolCodes school={s} />
            <Link to={`/admin/escolas/${s.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir ficha
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}