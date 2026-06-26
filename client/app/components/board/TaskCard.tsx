"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, CalendarClock, GripVertical } from "lucide-react";
import Card from "@/app/components/ui/Card";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";
import { TaskRecord } from "@/lib/api/tasks";
import {
  PRIORITY_COLOR,
  DEFAULT_PRIORITY,
  statusLabel,
  type TaskPriority,
} from "@/lib/taskConstants";
import { formatDueDate, isOverdue } from "@/lib/date";
import { cn } from "@/lib/cn";

interface TaskCardContentProps {
  task: TaskRecord;
  onEdit?: (task: TaskRecord) => void;
  onDelete?: (task: TaskRecord) => void;
  dragging?: boolean;
  overlay?: boolean;
}

// Presentational card body — no dnd hooks, so it can be reused inside both the
// sortable wrapper and the DragOverlay.
export function TaskCardContent({
  task,
  onEdit,
  onDelete,
  dragging,
  overlay,
}: TaskCardContentProps) {
  const priority = PRIORITY_COLOR[task.priority as TaskPriority]
    ? (task.priority as TaskPriority)
    : DEFAULT_PRIORITY;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card
      className={cn(
        "border-l-[3px] p-3.5 transition-shadow",
        overlay ? "shadow-xl" : "hover:border-border-strong",
        dragging && "opacity-40"
      )}
      style={{ borderLeftColor: PRIORITY_COLOR[priority] }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </h3>
        <Badge tone={statusToTone(task.status)}>{statusLabel(task.status)}</Badge>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {task.description.length > 100
            ? task.description.slice(0, 100) + "…"
            : task.description}
        </p>
      )}

      {task.dueDate && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs",
            overdue ? "text-danger" : "text-muted-foreground"
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          {overdue ? "Overdue · " : "Due "}
          {formatDueDate(task.dueDate)}
        </p>
      )}

      {!overlay && (
        <div className="mt-3 flex gap-2">
          <IconButton
            className="h-8 px-2.5 text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </IconButton>
          <IconButton
            variant="danger"
            className="h-8 px-2.5 text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </IconButton>
        </div>
      )}
    </Card>
  );
}

interface TaskCardProps {
  task: TaskRecord;
  onEdit: (task: TaskRecord) => void;
  onDelete: (task: TaskRecord) => void;
}

// Sortable, draggable wrapper. The whole card is the drag handle (PointerSensor
// with an 8px activation distance lets the action buttons still register clicks);
// the explicit grip is a visual cue.
export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative touch-none"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
      <TaskCardContent
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        dragging={isDragging}
      />
    </div>
  );
}
