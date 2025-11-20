import { useState, useEffect } from "react";
import { Task } from "./TasksTab";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
};

const TaskCard = ({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const [projet, setProjet] = useState<{ nom: string; couleur: string } | null>(null);
  const [type, setType] = useState<{ nom: string } | null>(null);

  useEffect(() => {
    if (task.projet_id) {
      supabase
        .from('projets')
        .select('nom, couleur')
        .eq('id', task.projet_id)
        .single()
        .then(({ data }) => setProjet(data));
    }
    
    if (task.type_id) {
      supabase
        .from('types')
        .select('nom')
        .eq('id', task.type_id)
        .single()
        .then(({ data }) => setType(data));
    }
  }, [task.projet_id, task.type_id]);

  const getTailleBadgeColor = (taille: number | null) => {
    if (!taille) return "bg-muted";
    if (taille <= 2) return "bg-mint text-foreground";
    if (taille <= 5) return "bg-primary text-primary-foreground";
    if (taille <= 13) return "bg-secondary text-secondary-foreground";
    return "bg-coral text-white";
  };

  return (
    <div 
      className={`card-soft p-4 space-y-3 transition-all duration-200 ${
        task.completed ? 'opacity-60' : ''
      }`}
      style={projet ? { borderLeft: `4px solid ${projet.couleur}` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-foreground ${task.completed ? 'line-through' : ''}`}>
              {task.titre}
            </h3>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            className="h-8 w-8 hover:bg-primary/10"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Importance</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${task.importance}%` }}
            />
          </div>
          <span className="text-xs font-medium w-8 text-right">{task.importance}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Priorité</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all"
              style={{ width: `${task.priorite}%` }}
            />
          </div>
          <span className="text-xs font-medium w-8 text-right">{task.priorite}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {task.taille && (
          <Badge className={getTailleBadgeColor(task.taille)}>
            {task.taille}
          </Badge>
        )}
        {type && (
          <Badge variant="outline" className="border-accent text-accent-foreground">
            {type.nom}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
