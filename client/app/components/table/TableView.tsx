"use client";

import { useState } from "react";
import { Pencil, Trash2, CalendarClock, ChevronUp, ChevronDown, X } from "lucide-react";
import { TaskRecord, bulkUpdateStatus, bulkDeleteTasks } from "@/lib/api/tasks";
import { cn } from "@/lib/cn";
import {
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_COLOR,
  PRIORITY_LABELS,
  DEFAULT_PRIORITY,
  statusLabel,
  type TaskPriority,
} from "@/lib/taskConstants";
import { formatDueDate, isOverdue } from "@/lib/date";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";
import Button from "@/app/components/ui/Button";
import Select from "@/app/components/ui/Select";
import LabelChips from "@/app/components/ui/LabelChips";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";

interface TableViewProps {
  items: TaskRecord[];
  sort: string;
  onSort: (value: string) => void;
  onEditTask: (task: TaskRecord) => void;
  onDeleteTask: (task: TaskRecord) => void;
  loading: boolean;
  // Refetch after a bulk action mutates tasks.
  onBulkComplete: () => void | Promise<void>;
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
  onBulkComplete,
}: TableViewProps) {
  // Multi-select for bulk actions. Selection is scoped to the rows on screen.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const selectedIds = items.filter((t) => selected.has(t.id)).map((t) => t.id);
  const allOnPageSelected =
    items.length > 0 && items.every((t) => selected.has(t.id));

  const clearSelection = () => setSelected(new Set());

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allOnPageSelected ? new Set() : new Set(items.map((t) => t.id)));

  const afterBulk = async () => {
    clearSelection();
    await onBulkComplete();
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await bulkUpdateStatus(selectedIds, status);
      await afterBulk();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to update tasks.");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false);
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await bulkDeleteTasks(selectedIds);
      await afterBulk();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to delete tasks.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {bulkError && (
        <ErrorPopup
          message={bulkError}
          type={"danger" as ToastType}
          onClose={() => setBulkError(null)}
          autoClose
          duration={5000}
        />
      )}

      {/* Bulk action toolbar — appears once at least one row is selected. */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Select
              value=""
              disabled={busy}
              onChange={(e) => e.target.value && handleBulkStatus(e.target.value)}
              aria-label="Set status for selected tasks"
              className="h-9"
            >
              <option value="">Set status…</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmBulkDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <IconButton aria-label="Clear selection" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
      )}

    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={cn(th, "w-10")} scope="col">
              <input
                type="checkbox"
                aria-label="Select all tasks"
                className="h-4 w-4 cursor-pointer accent-[var(--accent)] align-middle"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el)
                    el.indeterminate =
                      selectedIds.length > 0 && !allOnPageSelected;
                }}
                onChange={toggleAll}
              />
            </th>
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
                  <td className={td} />
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
                const isSelected = selected.has(task.id);
                return (
                  <tr
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className={cn(
                      "border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-surface-muted",
                      isSelected && "bg-accent/5"
                    )}
                  >
                    <td className={td} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${task.title}`}
                        className="h-4 w-4 cursor-pointer accent-[var(--accent)] align-middle"
                        checked={isSelected}
                        onChange={() => toggleOne(task.id)}
                      />
                    </td>
                    <td className={cn(td, "font-medium text-foreground")}>
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLOR[priority] }}
                          aria-hidden
                        />
                        {task.title}
                      </span>
                      <LabelChips labels={task.labels} className="mt-1.5 pl-[1.125rem]" />
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

      <ConfirmDialog
        open={confirmBulkDelete}
        title="Delete selected tasks?"
        message={`${selectedIds.length} task${
          selectedIds.length === 1 ? "" : "s"
        } will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </>
  );
}
