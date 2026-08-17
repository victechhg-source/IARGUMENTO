import React from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

const PLAYBOOK = [
  {
    role: 'Diretor',
    steps: [
      'Assuma o papel “Diretor” com a escola de teste selecionada.',
      'Abra o painel do diretor e confirme as métricas: alunos, professores, turmas, redações, solicitações e média geral.',
      'Confira o gráfico de média por banca e as listas de turmas e professores da escola.',
      'Troque a escola de teste e confirme que os dados mudam (nenhum dado de outra escola aparece junto).',
    ],
  },
  {
    role: 'Professor',
    steps: [
      'Assuma o papel “Professor” com a escola de teste selecionada.',
      'Abra o painel do professor e crie uma turma; anote o código gerado.',
      'Volte para “Aluno” em outra sessão/janela e solicite entrada com esse código.',
      'Como professor, aprove a solicitação pendente e confirme o aluno na lista da turma.',
      'Após a correção de uma redação, confirme que ela aparece nas métricas e nos insights da turma.',
    ],
  },
  {
    role: 'Aluno',
    steps: [
      'Assuma o papel “Aluno” com a escola de teste selecionada.',
      'Em “Minhas turmas”, entre com o código da turma criada pelo professor e verifique o status pendente.',
      'Abra “Correção”, escolha a banca, envie uma imagem de redação e revise a transcrição do OCR.',
      'Aprove a transcrição, aguarde a correção e confira notas, marcações e sugestões.',
      'Em “Histórico”, confirme a redação na banca correta, o gráfico de progressão e a exclusão da redação.',
    ],
  },
  {
    role: 'Segurança (voltando a admin)',
    steps: [
      'Volte a admin e confirme que /admin segue acessível.',
      'Como aluno, tente abrir /professor, /diretor e /admin: todos devem bloquear o acesso.',
      'Como professor, tente abrir /diretor e /admin: ambos devem bloquear.',
      'Verifique que um aluno vê apenas as próprias redações no histórico.',
    ],
  },
];

export default function RoleTestPlaybook() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold mb-4 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Roteiro de testes</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {PLAYBOOK.map(({ role, steps }) => (
          <div key={role}>
            <p className="text-sm font-bold mb-2">{role}</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              {steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </Card>
  );
}