import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TaskList from "./TaskList";
import TaskDialog from "./TaskDialog";
import TaskFilters from "./TaskFilters";

export type Task = {
  id: string;
  titre: string;
  description: string | null;
  priorite: number;
  importance: number;
  taille: number | null;
  type_id: string | null;
  projet_id: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  niveau: number;
  ordre: number;
};

const TasksTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterProjet, setFilterProjet] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"importance" | "priorite" | "taille">("importance");
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = [...tasks];
    
    // Filtrer uniquement les tâches de niveau 0 (racine)
    filtered = filtered.filter(t => !t.parent_id);
    
    if (!showCompleted) {
      // Garder les tâches récemment complétées pour permettre l'animation
      filtered = filtered.filter(t => !t.completed || recentlyCompleted.has(t.id));
    }
    
    if (filterProjet) {
      filtered = filtered.filter(t => t.projet_id === filterProjet);
    }
    
    if (filterType) {
      filtered = filtered.filter(t => t.type_id === filterType);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "taille") {
        return (b.taille || 0) - (a.taille || 0);
      }
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });
    
    setFilteredTasks(filtered);
  }, [tasks, filterProjet, filterType, sortBy, showCompleted, recentlyCompleted]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive",
      });
      return;
    }

    setTasks(data || []);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Tâche supprimée",
    });
  };

  const handleToggleComplete = async (task: Task) => {
    if (!task.completed && !showCompleted) {
      // Marquer comme récemment complété pour garder l'animation
      setRecentlyCompleted(prev => new Set(prev).add(task.id));
      
      // Retirer après l'animation (600ms pour toutes les animations)
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }, 600);
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <TaskFilters
        filterProjet={filterProjet}
        setFilterProjet={setFilterProjet}
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
      />
        <Button
          onClick={() => {
            setEditingTask(null);
            setIsDialogOpen(true);
          }}
          className="btn-playful bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <TaskList
        tasks={filteredTasks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleComplete={handleToggleComplete}
      />

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TasksTab;
