import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SchoolCodes from '@/components/admin/SchoolCodes';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code = (prefix) => `${prefix}-${Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')}`;

export default function SchoolManager({ schools, onChange }) {
  const [name, setName] = useState('');

  const create = async (e) => {
    e.preventDefault();
    await base44.entities.School.create({
      name,
      institutional_code: code('ESC'),
      student_code: code('ALU'),
      teacher_code: code('PRO'),
      director_code: code('DIR'),
      status: 'active',
    });
    setName('');
    onChange();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-1 font-semibold">Cadastrar escola</h2>
        <p className="mb-3 text-sm text-muted-foreground">Cada escola recebe três códigos de acesso. O código entregue define o perfil de quem se cadastra.</p>
        <form onSubmit={create} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da escola" aria-label="Nome da escola" required />
          <Button><Plus className="mr-2 h-4 w-4" />Cadastrar</Button>
        </form>
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