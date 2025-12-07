import { useState, useEffect, useRef, RefObject } from "react";
import { Task } from "@/components/tasks/TasksTab";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

interface CanvasTaskNodeProps {
  task: Task;
  subTasks: Task[];
  canvasRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  showSubTasks: boolean;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const CanvasTaskNode = ({
  task,
  subTasks,
  canvasRef,
  isDragging,
  onDragStart,
  onDragEnd,
  showSubTasks,
  onTaskClick,
  onToggleComplete,
}: CanvasTaskNodeProps) => {
  const [project, setProject] = useState<{ couleur: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const prevTaskRef = useRef({ importance: task.importance, priorite: task.priorite });

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

  // Clear pending position when task values are updated from database
  useEffect(() => {
    if (
      pendingPos &&
      (prevTaskRef.current.importance !== task.importance ||
        prevTaskRef.current.priorite !== task.priorite)
    ) {
      setPendingPos(null);
    }
    prevTaskRef.current = { importance: task.importance, priorite: task.priorite };
  }, [task.importance, task.priorite, pendingPos]);

  const getTailleBadgeColor = (taille: number | null) => {
    if (!taille) return "bg-muted text-muted-foreground";
    if (taille <= 2) return "bg-mint text-foreground";
    if (taille <= 5) return "bg-primary text-primary-foreground";
    if (taille <= 13) return "bg-secondary text-secondary-foreground";
    return "bg-coral text-white";
  };

  const getSize = (taille: number | null) => {
    if (!taille || taille <= 2) return { w: 120, h: 56 };
    if (taille <= 5) return { w: 140, h: 64 };
    if (taille <= 13) return { w: 160, h: 72 };
    return { w: 180, h: 80 };
  };

  const getFontConfig = (size: { w: number; h: number }) => {
    switch (size.w) {
      case 120: return { fontSize: 'text-xs', maxChars: 20, lineHeight: 'leading-tight' };
      case 140: return { fontSize: 'text-sm', maxChars: 24, lineHeight: 'leading-tight' };
      case 160: return { fontSize: 'text-sm', maxChars: 28, lineHeight: 'leading-snug' };
      default: return { fontSize: 'text-base', maxChars: 32, lineHeight: 'leading-snug' };
    }
  };

  const size = getSize(task.taille);
  const fontConfig = getFontConfig(size);
  const importance = task.importance ?? 50;
  const priority = task.priorite ?? 50;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let hasDragged = false;

    const handleMouseMove = (e: MouseEvent) => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
      );

      if (distance > 5 && !hasDragged) {
        hasDragged = true;
        onDragStart();
      }

      if (hasDragged && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDragPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (!hasDragged) {
        // C'était un clic, pas un drag
        onTaskClick(task);
      } else if (canvasRef.current) {
        // C'était un drag
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPendingPos({ x, y });
        setDragPos(null);
        onDragEnd(x, y);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Position: drag > pending > percentage
  const currentPos = dragPos || pendingPos;
  const baseX = currentPos ? currentPos.x : `${priority}%`;
  const baseY = currentPos ? currentPos.y : `${100 - importance}%`;
  const isAnimating = !dragPos && !pendingPos;

  const projectColor = project?.couleur || 'hsl(var(--primary))';

  // Distribute subtasks around the parent
  const subTaskRadius = Math.max(size.w, size.h) * 0.9;
  const subTaskSize = { w: 80, h: 36 };

  return (
    <div
      className={`absolute ${isAnimating ? 'transition-all duration-200' : ''}`}
      style={{
        left: typeof baseX === 'string' ? baseX : `${baseX}px`,
        top: typeof baseY === 'string' ? baseY : `${baseY}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 50 : 10,
      }}
    >
      {/* Connection lines to subtasks */}
      {showSubTasks && subTasks.length > 0 && (
        <svg
          className="absolute pointer-events-none"
          style={{
            width: subTaskRadius * 2 + subTaskSize.w,
            height: subTaskRadius * 2 + subTaskSize.h,
            left: -(subTaskRadius + subTaskSize.w / 2 - size.w / 2),
            top: -(subTaskRadius + subTaskSize.h / 2 - size.h / 2),
          }}
        >
          {subTasks.map((_, index) => {
            const angle = (index / subTasks.length) * 2 * Math.PI - Math.PI / 2;
            const x = (subTaskRadius + subTaskSize.w / 2) + Math.cos(angle) * subTaskRadius;
            const y = (subTaskRadius + subTaskSize.h / 2) + Math.sin(angle) * subTaskRadius;
            const centerX = subTaskRadius + subTaskSize.w / 2;
            const centerY = subTaskRadius + subTaskSize.h / 2;
            
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
      )}

      {/* Subtask nodes */}
      {showSubTasks && subTasks.map((subTask, index) => {
        const angle = (index / subTasks.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * subTaskRadius;
        const y = Math.sin(angle) * subTaskRadius;
        
        return (
          <div
            key={subTask.id}
            className={`absolute rounded-xl bg-card shadow-sm flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:scale-105 transition-transform cursor-pointer ${subTask.completed ? 'opacity-50' : ''}`}
            style={{
              width: subTaskSize.w,
              height: subTaskSize.h,
              left: x - subTaskSize.w / 2 + size.w / 2,
              top: y - subTaskSize.h / 2 + size.h / 2,
              borderColor: projectColor,
              borderWidth: 2,
              borderStyle: subTask.completed ? 'dashed' : 'solid',
            }}
            title={subTask.titre}
            onClick={() => onTaskClick(subTask)}
          >
            <Checkbox
              checked={subTask.completed}
              className="h-3.5 w-3.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onCheckedChange={() => onToggleComplete(subTask)}
            />
            {subTask.taille && (
              <span className={`${getTailleBadgeColor(subTask.taille)} text-[9px] px-1.5 py-0.5 rounded-full font-medium`}>
                {subTask.taille}
              </span>
            )}
          </div>
        );
      })}

      {/* Main task node */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          relative rounded-2xl bg-card border-2 shadow-lg flex items-center gap-1.5 px-2
          cursor-grab active:cursor-grabbing hover:shadow-xl transition-shadow
          ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${task.completed ? 'opacity-60' : ''}
        `}
        style={{
          width: size.w,
          height: size.h,
          borderColor: projectColor,
          borderStyle: task.completed ? 'dashed' : 'solid',
          backgroundColor: `color-mix(in srgb, ${projectColor} 10%, hsl(var(--card)))`,
        }}
      >
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <Checkbox
            checked={task.completed}
            className="h-4 w-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onCheckedChange={() => onToggleComplete(task)}
          />
          {task.taille && (
            <span className={`${getTailleBadgeColor(task.taille)} text-[9px] px-1.5 py-0 rounded-full font-medium`}>
              {task.taille}
            </span>
          )}
        </div>
        <span 
          className={`${fontConfig.fontSize} ${fontConfig.lineHeight} font-medium text-center flex-1 line-clamp-2 ${task.completed ? 'line-through' : ''}`}
          title={task.titre}
        >
          {task.titre.length > fontConfig.maxChars ? task.titre.substring(0, fontConfig.maxChars - 2) + '...' : task.titre}
        </span>
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
