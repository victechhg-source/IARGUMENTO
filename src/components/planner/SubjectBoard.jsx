import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Inbox, Package, ArrowRight } from 'lucide-react';
import SubjectChip from '@/components/planner/SubjectChip';

// Duas áreas de arrastar-soltar: "Disponíveis" (pool) e "Minhas matérias"
// (caixa). O aluno monta a caixa arrastando. As sugeridas pelo planejador já
// começam dentro da caixa — incluindo revisões, pra não focar só nos erros.
export default function SubjectBoard({ subjects, value, onChange }) {
  const box = value || [];
  const pool = subjects.filter((s) => !box.includes(s.name));

  const onDragEnd = (res) => {
    const { source, destination } = res;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'box' && source.index !== destination.index) {
        const next = [...box];
        const [m] = next.splice(source.index, 1);
        next.splice(destination.index, 0, m);
        onChange(next);
      }
      return;
    }
    if (source.droppableId === 'pool' && destination.droppableId === 'box') {
      const item = pool[source.index];
      if (!item) return;
      const next = [...box];
      next.splice(destination.index, 0, item.name);
      onChange(next);
    } else if (source.droppableId === 'box' && destination.droppableId === 'pool') {
      const next = [...box];
      next.splice(source.index, 1);
      onChange(next);
    }
  };

  const removeFromBox = (name) => onChange(box.filter((n) => n !== name));

  const chip = (s, i, inBox, onRemove) => (
    <Draggable key={s.name} draggableId={s.name} index={i}>
      {(p, sn) => (
        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="mb-2">
          <SubjectChip subject={s} inBox={inBox} dragging={sn.isDragging} onRemove={onRemove} />
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Droppable droppableId="pool">
          {(provided, snap) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`rounded-3xl border border-dashed border-border bg-muted/30 p-3 min-h-48 transition-colors ${snap.isDraggingOver ? 'border-primary bg-accent/30' : ''}`}>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Inbox className="w-4 h-4" /> Disponíveis</p>
              {pool.length === 0 ? (
                <p className="px-1 py-8 text-center text-xs text-muted-foreground">Tudo já está na sua caixa.</p>
              ) : (
                pool.map((s, i) => chip(s, i, false))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Droppable droppableId="box">
          {(provided, snap) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`rounded-3xl border-2 border-primary/40 bg-accent/20 p-3 min-h-48 transition-colors ${snap.isDraggingOver ? 'border-primary bg-accent/50' : ''}`}>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Package className="w-4 h-4" /> Minhas matérias</p>
              {box.length === 0 ? (
                <p className="px-1 py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-1"><ArrowRight className="w-4 h-4" /> Arraste matérias para cá</p>
              ) : (
                box.map((name, i) => {
                  const s = subjects.find((x) => x.name === name);
                  return s ? chip(s, i, true, () => removeFromBox(name)) : null;
                })
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}