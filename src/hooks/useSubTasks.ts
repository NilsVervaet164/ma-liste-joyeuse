import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/tasks/TasksTab";

export const useSubTasks = (parentId: string | null) => {
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!parentId) {
      setSubTasks([]);
      return;
    }

    fetchSubTasks();

    // Subscribe to realtime updates for subtasks
    const channel = supabase
      .channel(`subtasks-${parentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `parent_id=eq.${parentId}`
        },
        () => {
          fetchSubTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId]);

  const fetchSubTasks = async () => {
    if (!parentId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .order('ordre', { ascending: true });

    if (!error && data) {
      setSubTasks(data);
    }
    setLoading(false);
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const isExpanded = (taskId: string) => expandedTasks.has(taskId);

  const calculateStats = () => {
    const completed = subTasks.filter(t => t.completed).length;
    const total = subTasks.length;
    const totalPoints = subTasks.reduce((sum, t) => sum + (t.taille || 0), 0);
    
    return { completed, total, totalPoints };
  };

  return {
    subTasks,
    loading,
    expandedTasks,
    toggleExpanded,
    isExpanded,
    stats: calculateStats(),
    refetch: fetchSubTasks
  };
};
