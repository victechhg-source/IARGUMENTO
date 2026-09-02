import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { architectureFor } from '@/data/agentArchitectures';
import { BookOpen, Award, School, Layers, Cpu, Scale } from 'lucide-react';

// Detalhe completo de uma banca: critérios oficiais, pesos, arquitetura
// de correção e grade específica. Usa os dados estáticos de bancas.js e
// agentArchitectures.js — mesma fonte de verdade dos corretores.
export default function BancaGuide({ banca }) {
  const arch = architectureFor(banca.id);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da banca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Image
              src={banca.logo_url}
              alt={banca.name}
              fittingType="fit"
              className="h-16 w-16 rounded-2xl border border-border bg-white p-1"
            />
            <div className="flex-1">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">{banca.name}</h2>
              <p className="text-sm text-muted-foreground">{banca.full_name}</p>
              <p className="mt-1 text-sm text-card-foreground/80">{banca.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="banca-grade"><Award className="w-3.5 h-3.5" />Nota máx. {banca.max_grade}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                <Layers className="w-3.5 h-3.5" />{banca.theme}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pesos por critério */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <CardTitle>Pesos e critérios oficiais</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Critério</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 text-right font-semibold">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {banca.stages.map((stage, i) => (
                  <tr key={i} className="bg-card">
                    <td className="px-4 py-3 font-semibold">{stage.name}</td>
                    <td className="px-4 py-3 text-card-foreground/75">{stage.description}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap">
                      {stage.max_score > 0 ? `${stage.max_score} pts` : '−1,0 penal.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Critérios oficiais */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle>Manual de correção oficial</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground/85">
            {banca.official_criteria}
          </p>
        </CardContent>
      </Card>

      {/* Critérios complementares da escola */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <School className="w-5 h-5 text-primary" />
          <CardTitle>Complementos da Escola Argumento</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground/85">
            {banca.school_criteria}
          </p>
        </CardContent>
      </Card>

      {/* Grade específica de correção (se houver) */}
      {banca.agent_guidance && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle>Grade específica de correção</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground/85">
              {banca.agent_guidance}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Arquitetura de correção do sistema */}
      {arch && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <CardTitle>Como a correção é feita</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm leading-relaxed text-card-foreground/85">{arch.architecture}</p>
            {arch.specialists && arch.specialists.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {arch.specialists.map((sp, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="font-semibold text-sm">{sp.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sp.role}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}