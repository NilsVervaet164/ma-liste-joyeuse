import { useState, useEffect } from "react";
import { Task } from "./TasksTab";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useTaskHierarchy } from "@/hooks/useTaskHierarchy";
import { useSubTasks } from "@/hooks/useSubTasks";

type TaskRowProps = {
  task: Task;
  level: number;
  onEdit: (task: Task) => void;
  onDelete?: (id: string) => void;
  onToggleComplete: (task: Task) => void;
};

const TaskRow = ({ task, level, onEdit, onDelete, onToggleComplete }: TaskRowProps) => {
  const [projet, setProjet] = useState<{ nom: string; couleur: string } | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const { createSubTask } = useTaskHierarchy();
  const { subTasks, stats, toggleExpanded, isExpanded } = useSubTasks(task.id);

  const isRootTask = level === 0;
  const hasSubTasks = subTasks.length > 0;
  const expanded = isExpanded(task.id);
  const canAddSubTask = level < 2;

  useEffect(() => {
    if (task.projet_id && isRootTask) {
      supabase
        .from('projets')
        .select('nom, couleur')
        .eq('id', task.projet_id)
        .single()
        .then(({ data }) => setProjet(data));
    }
  }, [task.projet_id, isRootTask]);

  const getTailleBadgeColor = (taille: number | null) => {
    if (!taille) return "bg-muted";
    if (taille <= 2) return "bg-mint text-foreground";
    if (taille <= 5) return "bg-primary text-primary-foreground";
    if (taille <= 13) return "bg-secondary text-secondary-foreground";
    return "bg-coral text-white";
  };

  const handleAddSubTask = async () => {
    if (newSubTaskTitle.trim()) {
      const newTask = await createSubTask(task.id, newSubTaskTitle.trim(), task.niveau || 0);
      if (newTask) {
        setNewSubTaskTitle("");
        setShowAddInput(false);
        if (!expanded) {
          toggleExpanded(task.id);
        }
      }
    } else {
      // Quick add without title
      const newTask = await createSubTask(task.id, "Nouvelle sous-tâche", task.niveau || 0);
      if (newTask && !expanded) {
        toggleExpanded(task.id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubTask();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewSubTaskTitle("");
    }
  };

  const indentPadding = level * 24;

  return (
    <div 
      className="task-row"
      style={{
        borderLeftColor: isRootTask && projet ? projet.couleur : 'transparent',
        borderLeftWidth: isRootTask ? '3px' : '0',
      }}
    >
      {/* Main Row */}
      <div
        className="flex items-center gap-3 py-3 px-4 hover:bg-muted/30 transition-colors cursor-pointer group"
        style={{ paddingLeft: `${16 + indentPadding}px` }}
        onClick={() => onEdit(task)}
      >
        {/* Expand/Collapse */}
        {hasSubTasks ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(task.id);
            }}
            className="shrink-0 w-5 h-5 flex items-center justify-center"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 ${task.completed ? 'animate-checkbox-pulse' : ''}`}
        />

        {/* Title */}
        <span className={`flex-1 min-w-0 truncate ${
          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
        } ${isRootTask ? 'font-medium' : 'text-sm'}`}>
          {task.titre}
        </span>

        {/* Mini Progress Indicators (only for root tasks) */}
        {isRootTask && !task.completed && (
          <div className="hidden sm:flex items-center gap-3">
            {/* Importance */}
            <div className="flex items-center gap-1.5" title={`Importance: ${task.importance}`}>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Imp</span>
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${task.importance}%` }}
                />
              </div>
            </div>
            {/* Priority */}
            <div className="flex items-center gap-1.5" title={`Priorité: ${task.priorite}`}>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Pri</span>
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all"
                  style={{ width: `${task.priorite}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {hasSubTasks && (
            <Badge variant="secondary" className="text-xs">
              {stats.completed}/{stats.total}
            </Badge>
          )}
          {task.taille && (
            <Badge className={`${getTailleBadgeColor(task.taille)} text-xs`}>
              {task.taille}
            </Badge>
          )}
        </div>

        {/* Add SubTask Button */}
        {canAddSubTask && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (isRootTask) {
                handleAddSubTask();
              } else {
                setShowAddInput(true);
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Add SubTask Input (for non-root tasks) */}
      {showAddInput && (
        <div 
          className="py-2 px-4 bg-muted/20"
          style={{ paddingLeft: `${40 + indentPadding + 24}px` }}
        >
          <Input
            autoFocus
            placeholder="Nouvelle sous-tâche..."
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newSubTaskTitle.trim()) {
                setShowAddInput(false);
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* SubTasks */}
      {expanded && hasSubTasks && (
        <div className="animate-accordion-down">
          {subTasks.map((subTask) => (
            <TaskRow
              key={subTask.id}
              task={subTask}
              level={level + 1}
              onEdit={onEdit}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskRow;
