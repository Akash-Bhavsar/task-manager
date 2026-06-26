"use client";

import { Pencil, Trash2, CalendarClock, ChevronUp, ChevronDown } from "lucide-react";
import { TaskRecord } from "@/lib/api/tasks";
import { cn } from "@/lib/cn";
import {
  PRIORITY_COLOR,
  PRIORITY_LABELS,
  DEFAULT_PRIORITY,
  statusLabel,
  type TaskPriority,
} from "@/lib/taskConstants";
import { formatDueDate, isOverdue } from "@/lib/date";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";

interface TableViewProps {
  items: TaskRecord[];
  sort: string;
  onSort: (value: string) => void;
  onEditTask: (task: TaskRecord) => void;
  onDeleteTask: (task: TaskRecord) => void;
  loading: boolean;
}

// Columns the server can sort on cleanly (see server/routes/tasks.ts). Priority
// and Status aren't sortable yet — that needs DB enums (roadmap "Cross-cutting").
const COLUMNS: { key: string; label: string; sort?: string }[] = [
  { key: "title", label: "Title", sort: "title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due", sort: "due" },
  { key: "updated", label: "Updated", sort: "updated" },
  { key: "actions", label: "" },
];

const th =
  "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide";
const td = "px-4 py-3 align-middle text-sm";

export default function TableView({
  items,
  sort,
  onSort,
  onEditTask,
  onDeleteTask,
  loading,
}: TableViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => {
              const active = col.sort && sort === col.sort;
              return (
                <th key={col.key} className={th} scope="col">
                  {col.sort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.sort!)}
                      aria-pressed={!!active}
                      className={cn(
                        "inline-flex items-center gap-1 rounded transition-colors cursor-pointer hover:text-foreground",
                        active && "text-foreground"
                      )}
                    >
                      {col.label}
                      {active ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={td}>
                      <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-surface-muted" />
                    </td>
                  ))}
                </tr>
              ))
            : items.map((task) => {
                const priority = PRIORITY_COLOR[task.priority as TaskPriority]
                  ? (task.priority as TaskPriority)
                  : DEFAULT_PRIORITY;
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <tr
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-surface-muted"
                  >
                    <td className={cn(td, "font-medium text-foreground")}>
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLOR[priority] }}
                          aria-hidden
                        />
                        {task.title}
                      </span>
                    </td>
                    <td className={td}>
                      <Badge tone={statusToTone(task.status)}>
                        {statusLabel(task.status)}
                      </Badge>
                    </td>
                    <td className={cn(td, "text-muted-foreground")}>
                      {PRIORITY_LABELS[priority]}
                    </td>
                    <td className={td}>
                      {task.dueDate ? (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-xs",
                            overdue ? "text-danger" : "text-muted-foreground"
                          )}
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          {overdue ? "Overdue · " : ""}
                          {formatDueDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className={cn(td, "text-xs text-muted-foreground")}>
                      {formatDueDate(task.updatedAt) || "—"}
                    </td>
                    <td className={td} onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <IconButton
                          aria-label="Edit task"
                          onClick={() => onEditTask(task)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          variant="danger"
                          aria-label="Delete task"
                          onClick={() => onDeleteTask(task)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
