import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/tasks/TasksTab";
import { useToast } from "@/hooks/use-toast";

export const useTaskHierarchy = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSubTask = async (
    parentId: string,
    titre: string,
    parentNiveau: number
  ): Promise<Task | null> => {
    if (parentNiveau >= 2) {
      toast({
        title: "Limite atteinte",
        description: "Impossible de créer plus de 3 niveaux de sous-tâches",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    // Récupérer l'ordre maximum actuel
    const { data: siblings } = await supabase
      .from('tasks')
      .select('ordre')
      .eq('parent_id', parentId)
      .order('ordre', { ascending: false })
      .limit(1);

    const nextOrdre = siblings && siblings.length > 0 ? siblings[0].ordre + 1 : 0;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        titre,
        parent_id: parentId,
        ordre: nextOrdre,
        completed: false,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sous-tâche",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Succès",
      description: "Sous-tâche créée",
    });

    return data;
  };

  const updateTaskOrder = async (taskId: string, newOrdre: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ ordre: newOrdre })
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser les tâches",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const deleteTaskWithSubTasks = async (taskId: string) => {
    // La suppression en cascade est gérée par la base de données
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Succès",
      description: "Tâche et sous-tâches supprimées",
    });

    return true;
  };

  const getTaskWithDescendants = async (taskId: string): Promise<Task[]> => {
    // Requête simple pour obtenir tous les descendants
    const descendants: Task[] = [];
    const queue = [taskId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', currentId);
      
      if (data) {
        descendants.push(...data);
        queue.push(...data.map(t => t.id));
      }
    }

    return descendants;
  };

  return {
    loading,
    createSubTask,
    updateTaskOrder,
    deleteTaskWithSubTasks,
    getTaskWithDescendants,
  };
};
