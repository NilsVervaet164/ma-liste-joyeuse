import { useRef, useState } from "react";
import { Task } from "@/components/tasks/TasksTab";
import { CanvasTaskNode } from "./CanvasTaskNode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TaskCanvasProps {
  tasks: Task[];
  subTasksMap: Map<string, Task[]>;
  onUpdateTask: (taskId: string, importance: number, priority: number) => void;
  showSubTasks: boolean;
  onToggleSubTasks: (value: boolean) => void;
}

export const TaskCanvas = ({ tasks, subTasksMap, onUpdateTask, showSubTasks, onToggleSubTasks }: TaskCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggingId(taskId);
  };

  const handleDragEnd = (taskId: string, x: number, y: number) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const priority = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const importance = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    
    onUpdateTask(taskId, Math.round(importance), Math.round(priority));
    setDraggingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-subtasks"
          checked={showSubTasks}
          onCheckedChange={onToggleSubTasks}
        />
        <Label htmlFor="show-subtasks" className="text-sm text-muted-foreground cursor-pointer">
          Afficher sous-tâches
        </Label>
      </div>

      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">
          Importance →
        </div>
        
        {/* X-axis label */}
        <div className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
          Priorité →
        </div>

        {/* Canvas area */}
        <div 
          ref={canvasRef}
          className="relative w-full h-[600px] bg-card/50 rounded-xl border border-border/50 overflow-hidden ml-4"
        >
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            {[25, 50, 75].map(percent => (
              <div key={`v-${percent}`}>
                <div 
                  className="absolute top-0 bottom-0 w-px bg-border/30"
                  style={{ left: `${percent}%` }}
                />
                <div 
                  className="absolute left-0 right-0 h-px bg-border/30"
                  style={{ top: `${percent}%` }}
                />
              </div>
            ))}
          </div>

          {/* Quadrant labels */}
          <div className="absolute top-3 left-3 text-xs text-muted-foreground/50 font-medium">
            Important · Non urgent
          </div>
          <div className="absolute top-3 right-3 text-xs text-muted-foreground/50 font-medium">
            Important · Urgent
          </div>
          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/50 font-medium">
            Non important · Non urgent
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/50 font-medium">
            Non important · Urgent
          </div>

          {/* Task nodes */}
          {tasks.map(task => (
            <CanvasTaskNode
              key={task.id}
              task={task}
              subTasks={subTasksMap.get(task.id) || []}
              canvasRef={canvasRef}
              isDragging={draggingId === task.id}
              onDragStart={() => handleDragStart(task.id)}
              onDragEnd={(x, y) => handleDragEnd(task.id, x, y)}
              showSubTasks={showSubTasks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
