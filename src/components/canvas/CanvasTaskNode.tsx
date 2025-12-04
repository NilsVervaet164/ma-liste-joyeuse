import { useState, useEffect, RefObject } from "react";
import { Task } from "@/components/tasks/TasksTab";
import { supabase } from "@/integrations/supabase/client";

interface CanvasTaskNodeProps {
  task: Task;
  subTasks: Task[];
  canvasRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
}

export const CanvasTaskNode = ({
  task,
  subTasks,
  canvasRef,
  isDragging,
  onDragStart,
  onDragEnd,
}: CanvasTaskNodeProps) => {
  const [project, setProject] = useState<{ couleur: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (task.projet_id) {
      supabase
        .from('projets')
        .select('couleur')
        .eq('id', task.projet_id)
        .single()
        .then(({ data }) => setProject(data));
    }
  }, [task.projet_id]);

  const getSize = (taille: number | null) => {
    if (!taille || taille <= 2) return 56;
    if (taille <= 5) return 72;
    if (taille <= 13) return 88;
    return 104;
  };

  const size = getSize(task.taille);
  const importance = task.importance ?? 50;
  const priority = task.priorite ?? 50;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart();

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setDragPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDragEnd(x, y);
      setDragPos(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate position based on importance (Y inverted) and priority (X)
  const baseX = dragPos ? dragPos.x : `${priority}%`;
  const baseY = dragPos ? dragPos.y : `${100 - importance}%`;

  const projectColor = project?.couleur || 'hsl(var(--primary))';

  // Distribute subtasks in a circle around the parent
  const subTaskRadius = size * 0.9;
  const subTaskSize = 32;

  return (
    <div
      className="absolute transition-all duration-200"
      style={{
        left: typeof baseX === 'string' ? baseX : `${baseX}px`,
        top: typeof baseY === 'string' ? baseY : `${baseY}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 50 : 10,
      }}
    >
      {/* Connection lines to subtasks */}
      <svg
        className="absolute pointer-events-none"
        style={{
          width: subTaskRadius * 2 + subTaskSize,
          height: subTaskRadius * 2 + subTaskSize,
          left: -(subTaskRadius + subTaskSize / 2 - size / 2),
          top: -(subTaskRadius + subTaskSize / 2 - size / 2),
        }}
      >
        {subTasks.map((_, index) => {
          const angle = (index / subTasks.length) * 2 * Math.PI - Math.PI / 2;
          const x = (subTaskRadius + subTaskSize / 2) + Math.cos(angle) * subTaskRadius;
          const y = (subTaskRadius + subTaskSize / 2) + Math.sin(angle) * subTaskRadius;
          const centerX = subTaskRadius + subTaskSize / 2;
          const centerY = subTaskRadius + subTaskSize / 2;
          
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={projectColor}
              strokeWidth="1.5"
              strokeOpacity="0.3"
              strokeDasharray="4 2"
            />
          );
        })}
      </svg>

      {/* Subtask nodes */}
      {subTasks.map((subTask, index) => {
        const angle = (index / subTasks.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * subTaskRadius;
        const y = Math.sin(angle) * subTaskRadius;
        
        return (
          <div
            key={subTask.id}
            className="absolute rounded-full bg-card border border-border/50 shadow-sm flex items-center justify-center text-[10px] font-medium text-muted-foreground hover:scale-110 transition-transform cursor-default"
            style={{
              width: subTaskSize,
              height: subTaskSize,
              left: x - subTaskSize / 2 + size / 2,
              top: y - subTaskSize / 2 + size / 2,
              borderColor: projectColor,
              borderWidth: 2,
            }}
            title={subTask.titre}
          >
            {subTask.taille || ''}
          </div>
        );
      })}

      {/* Main task node */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          relative rounded-full bg-card border-2 shadow-lg flex flex-col items-center justify-center
          cursor-grab active:cursor-grabbing hover:shadow-xl transition-shadow
          ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        style={{
          width: size,
          height: size,
          borderColor: projectColor,
          backgroundColor: `color-mix(in srgb, ${projectColor} 10%, hsl(var(--card)))`,
        }}
      >
        <span 
          className="text-xs font-medium text-center px-2 line-clamp-2 leading-tight"
          title={task.titre}
        >
          {task.titre.length > 20 ? task.titre.substring(0, 18) + '...' : task.titre}
        </span>
        {task.taille && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {task.taille} pts
          </span>
        )}
      </div>

      {/* Subtask count badge */}
      {subTasks.length > 0 && (
        <div 
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
        >
          {subTasks.length}
        </div>
      )}
    </div>
  );
};
