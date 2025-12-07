import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/tasks/TasksTab";
import { TaskCanvas } from "./TaskCanvas";
import TaskDialog from "@/components/tasks/TaskDialog";

export const CanvasTab = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [fadingOutTasks, setFadingOutTasks] = useState<Set<string>>(new Set());

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
    // Fetch ALL tasks (including completed subtasks)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
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

  const handleToggleExpand = (taskId: string) => {
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

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleting = !task.completed;
    
    // If completing a root task, trigger fade-out animation first
    if (isCompleting && task.parent_id === null) {
      setFadingOutTasks(prev => new Set(prev).add(task.id));
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setFadingOutTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
    
    await supabase
      .from('tasks')
      .update({ 
        completed: isCompleting,
        completed_at: isCompleting ? new Date().toISOString() : null
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

  // Filter: show only non-completed root tasks (+ those fading out)
  const rootTasks = tasks.filter(t => 
    t.parent_id === null && (!t.completed || fadingOutTasks.has(t.id))
  );
  
  // Subtasks map: include ALL subtasks (completed ones will be grayed out)
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
        expandedTasks={expandedTasks}
        onToggleExpand={handleToggleExpand}
        onTaskClick={handleTaskClick}
        onToggleComplete={handleToggleComplete}
        fadingOutTasks={fadingOutTasks}
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
