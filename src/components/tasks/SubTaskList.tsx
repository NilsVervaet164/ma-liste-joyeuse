import { Task } from "./TasksTab";
import SubTaskItem from "./SubTaskItem";
import { useSubTasks } from "@/hooks/useSubTasks";

type SubTaskListProps = {
  parentTask: Task;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
};

const SubTaskList = ({ parentTask, onEdit, onToggleComplete }: SubTaskListProps) => {
  const { subTasks, loading } = useSubTasks(parentTask.id);

  if (loading) {
    return (
      <div className="py-2 px-4">
        <p className="text-xs text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (subTasks.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border/50 mt-3 pt-3">
      {subTasks.map((subTask) => (
        <SubTaskItem
          key={subTask.id}
          task={subTask}
          level={1}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
};

export default SubTaskList;
