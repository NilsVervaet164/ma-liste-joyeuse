import { useState } from "react";
import { Task } from "./TasksTab";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubTasks } from "@/hooks/useSubTasks";
import { useTaskHierarchy } from "@/hooks/useTaskHierarchy";
import { useToast } from "@/hooks/use-toast";

type SubTaskItemProps = {
  task: Task;
  level: number;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  type?: { nom: string } | null;
};

const SubTaskItem = ({ task, level, onEdit, onToggleComplete, type }: SubTaskItemProps) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const { subTasks, toggleExpanded, isExpanded, stats } = useSubTasks(task.id);
  const { createSubTask } = useTaskHierarchy();
  const { toast } = useToast();

  const hasSubTasks = subTasks.length > 0;
  const expanded = isExpanded(task.id);
  const canAddSubTask = level < 2;

  const indentStyle = {
    paddingLeft: `${level * 24}px`,
    opacity: level === 0 ? 1 : level === 1 ? 0.85 : 0.7,
  };

  const getTailleBadgeColor = (taille: number | null) => {
    if (!taille) return "bg-muted";
    if (taille <= 2) return "bg-mint text-foreground";
    if (taille <= 5) return "bg-primary text-primary-foreground";
    if (taille <= 13) return "bg-secondary text-secondary-foreground";
    return "bg-coral text-white";
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) return;

    const newTask = await createSubTask(task.id, newSubTaskTitle.trim(), task.niveau || 0);
    
    if (newTask) {
      setNewSubTaskTitle("");
      setShowAddInput(false);
      if (!expanded && hasSubTasks) {
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

  return (
    <div className="subtask-connector">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
        style={indentStyle}
      >
        {/* Expand/Collapse Icon */}
        {hasSubTasks && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(task.id);
            }}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
        
        {!hasSubTasks && <div className="w-4" />}

        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          onClick={(e) => e.stopPropagation()}
          className={task.completed ? 'animate-checkbox-pulse' : ''}
        />

        {/* Task Title */}
        <div
          className="flex-1 min-w-0"
          onClick={() => onEdit(task)}
        >
          <span className={`text-sm ${task.completed ? 'line-through opacity-50' : ''}`}>
            {task.titre}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {task.taille && (
            <Badge className={`${getTailleBadgeColor(task.taille)} text-xs`}>
              {task.taille}
            </Badge>
          )}
          {type && (
            <Badge variant="outline" className="text-xs border-accent text-accent-foreground">
              {type.nom}
            </Badge>
          )}
          {hasSubTasks && (
            <Badge variant="secondary" className="text-xs">
              {stats.completed}/{stats.total}
            </Badge>
          )}
        </div>

        {/* Add SubTask Button */}
        {canAddSubTask && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddInput(true);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Add SubTask Input */}
      {showAddInput && (
        <div className="py-2 px-3" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
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

      {/* Recursive SubTasks */}
      {expanded && hasSubTasks && (
        <div className="animate-accordion-down">
          {subTasks.map((subTask) => (
            <SubTaskItem
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

export default SubTaskItem;
