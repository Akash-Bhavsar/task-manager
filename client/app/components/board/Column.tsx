"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import { TaskRecord } from "@/lib/api/tasks";
import { STATUS_LABELS, type TaskStatus } from "@/lib/taskConstants";

interface ColumnProps {
  status: TaskStatus;
  tasks: TaskRecord[];
  onAdd: (status: TaskStatus) => void;
  onEditTask: (task: TaskRecord) => void;
  onDeleteTask: (task: TaskRecord) => void;
}

export default function Column({
  status,
  tasks,
  onAdd,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  // Whole column is a drop target so cards can be dropped into an empty column.
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-full min-w-0 flex-col rounded-xl border border-border bg-surface-muted/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {STATUS_LABELS[status]}
          </h3>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Add task to ${STATUS_LABELS[status]}`}
          onClick={() => onAdd(status)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex min-h-24 flex-1 flex-col gap-2.5 px-2.5 pb-3 transition-colors ${
            isOver ? "bg-accent/5" : ""
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
          {tasks.length === 0 && (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground/60">
              Drop tasks here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
