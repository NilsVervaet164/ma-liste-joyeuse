import { useState, useEffect } from "react";
import { Task } from "./TasksTab";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import SubTaskList from "./SubTaskList";
import { useTaskHierarchy } from "@/hooks/useTaskHierarchy";
import { useSubTasks } from "@/hooks/useSubTasks";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
};

const TaskCard = ({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const [projet, setProjet] = useState<{ nom: string; couleur: string } | null>(null);
  const [showSubTasks, setShowSubTasks] = useState(false);
  const { createSubTask } = useTaskHierarchy();
  const { subTasks, stats } = useSubTasks(task.id);

  // Ne montrer les sous-tâches que pour les tâches de niveau 0 (racine)
  const isRootTask = !task.parent_id;
  const hasSubTasks = subTasks.length > 0;

  useEffect(() => {
    if (task.projet_id) {
      supabase
        .from('projets')
        .select('nom, couleur')
        .eq('id', task.projet_id)
        .single()
        .then(({ data }) => setProjet(data));
    }
  }, [task.projet_id]);

  const getTailleBadgeColor = (taille: number | null) => {
    if (!taille) return "bg-muted";
    if (taille <= 2) return "bg-mint text-foreground";
    if (taille <= 5) return "bg-primary text-primary-foreground";
    if (taille <= 13) return "bg-secondary text-secondary-foreground";
    return "bg-coral text-white";
  };

  const handleAddSubTask = async () => {
    const newTask = await createSubTask(task.id, "Nouvelle sous-tâche", task.niveau || 0);
    if (newTask && !showSubTasks) {
      setShowSubTasks(true);
    }
  };

  return (
    <div 
      className={`card-soft p-4 space-y-3 border-l-4 ${
        task.completed ? 'opacity-60 animate-card-lift' : ''
      }`}
      style={{
        borderLeftColor: projet ? projet.couleur : 'transparent'
      }}
    >
      <div className="flex items-start justify-between gap-2" onClick={() => onEdit(task)}>
        <div className="flex items-start gap-3 flex-1">
          {/* Expand/Collapse button for subtasks */}
          {isRootTask && hasSubTasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubTasks(!showSubTasks);
              }}
              className="mt-1"
            >
              {showSubTasks ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          
          {isRootTask && !hasSubTasks && <div className="w-4 mt-1" />}

          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task)}
            onClick={(e) => e.stopPropagation()}
            className={`mt-1 ${task.completed ? 'animate-checkbox-pulse' : ''}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-foreground ${task.completed ? 'line-through opacity-50' : ''}`}>
                {task.titre}
              </h3>
              {isRootTask && hasSubTasks && (
                <Badge variant="secondary" className="text-xs">
                  {stats.completed}/{stats.total}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Add SubTask Button */}
        {isRootTask && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleAddSubTask();
            }}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress bars - uniquement pour les tâches principales */}
      {isRootTask && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Importance</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ 
                  width: task.completed ? '0%' : `${task.importance}%`,
                  transitionDelay: task.completed ? '100ms' : '0ms'
                }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{task.importance}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Priorité</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-300"
                style={{ 
                  width: task.completed ? '0%' : `${task.priorite}%`,
                  transitionDelay: task.completed ? '150ms' : '0ms'
                }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{task.priorite}</span>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {task.taille && (
          <Badge className={getTailleBadgeColor(task.taille)}>
            {task.taille}
          </Badge>
        )}
        {isRootTask && stats.totalPoints > 0 && (
          <Badge variant="outline" className="text-xs">
            Total: {stats.totalPoints} pts
          </Badge>
        )}
      </div>

      {/* SubTasks Section */}
      {isRootTask && showSubTasks && hasSubTasks && (
        <SubTaskList
          parentTask={task}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
        />
      )}
    </div>
  );
};

export default TaskCard;
