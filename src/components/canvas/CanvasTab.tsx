import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/tasks/TasksTab";
import { TaskCanvas } from "./TaskCanvas";
import TaskDialog from "@/components/tasks/TaskDialog";

export const CanvasTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubTasks, setShowSubTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleToggleComplete = async (task: Task) => {
    await supabase
      .from('tasks')
      .update({ 
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null
      })
      .eq('id', task.id);
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
    <>
      <TaskCanvas 
        tasks={rootTasks} 
        subTasksMap={subTasksMap}
        onUpdateTask={handleUpdateTask}
        showSubTasks={showSubTasks}
        onToggleSubTasks={setShowSubTasks}
        onTaskClick={handleTaskClick}
        onToggleComplete={handleToggleComplete}
      />
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
};
