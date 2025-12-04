import { Task } from "./TasksTab";
import TaskRow from "./TaskRow";

type TaskListProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
};

const TaskList = ({ tasks, onEdit, onDelete, onToggleComplete }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="card-soft p-12 text-center">
        <p className="text-muted-foreground text-lg">
          Aucune tâche pour le moment 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft divide-y divide-border/50">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
};

export default TaskList;
