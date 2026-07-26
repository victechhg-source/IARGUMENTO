import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function StudentRow({ membership, essays }) {
  const average = essays.length ? Math.round(essays.reduce((sum, e) => sum + (e.final_grade / (e.max_grade || 100)) * 100, 0) / essays.length) : 0;
  return <Link to={`/professor/aluno/${membership.student_id}`}><Card className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"><div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{(membership.student_name || 'A').charAt(0).toUpperCase()}</div><div className="flex-1 min-w-0"><p className="font-medium truncate">{membership.student_name}</p><p className="text-sm text-muted-foreground truncate">{membership.student_email}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{average}%</p><p className="text-xs text-muted-foreground">{essays.length} redações</p></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></Card></Link>;
}