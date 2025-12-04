import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/tasks/TasksTab";
import { TaskCanvas } from "./TaskCanvas";

export const CanvasTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('canvas-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .order('ordre', { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleUpdateTask = async (taskId: string, importance: number, priority: number) => {
    await supabase
      .from('tasks')
      .update({ importance, priorite: priority })
      .eq('id', taskId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const rootTasks = tasks.filter(t => t.parent_id === null);
  const subTasksMap = new Map<string, Task[]>();
  
  tasks.forEach(t => {
    if (t.parent_id) {
      const existing = subTasksMap.get(t.parent_id) || [];
      subTasksMap.set(t.parent_id, [...existing, t]);
    }
  });

  return (
    <TaskCanvas 
      tasks={rootTasks} 
      subTasksMap={subTasksMap}
      onUpdateTask={handleUpdateTask} 
    />
  );
};
