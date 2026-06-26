"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Task, { TaskData } from "@/app/components/Task";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  TaskRecord,
} from "@/lib/api/tasks";
import {
  PRIORITY_COLOR,
  DEFAULT_PRIORITY,
  type TaskPriority,
} from "@/lib/taskConstants";
import { isOverdue } from "@/lib/date";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Local YYYY-MM-DD (no timezone conversion — the date the user picked).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// 42 cells (6 weeks, Sunday-first) covering the given month.
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarView({ reloadSignal }: { reloadSignal?: number }) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Which month is shown (1st of that month).
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // Modal + delete confirmation (owned here, like the board view).
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(undefined);
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TaskRecord | null>(null);

  // Own fetch: pull a wide page, bucket by due date locally.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ sort: "due", pageSize: 200 });
      setTasks(res.items);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadSignal]);

  // dueDate (YYYY-MM-DD) -> tasks on that day.
  const byDay = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [tasks]);

  const undated = useMemo(() => tasks.filter((t) => !t.dueDate).length, [tasks]);

  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );
  const todayKey = ymd(new Date());
  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  // --- Task modal / delete handlers (mirror the board view) ---

  const openCreate = (dateKey: string) => {
    setCurrentTask(undefined);
    setCreateDate(dateKey);
    setModalOpen(true);
  };

  const openEdit = (task: TaskRecord) => {
    setCreateDate(undefined);
    setCurrentTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels,
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (t: TaskData) => {
    try {
      if (t.id) {
        await updateTask(String(t.id), {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          labelIds: t.labelIds,
        });
      } else {
        await createTask({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          labelIds: t.labelIds,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save task.");
    }
  };

  const handleModalDelete = async (taskId: number) => {
    try {
      await deleteTask(String(taskId));
      setModalOpen(false);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  };

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    try {
      await deleteTask(String(target.id));
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  };

  return (
    <>
      {actionError && (
        <ErrorPopup
          message={actionError}
          type={"danger" as ToastType}
          onClose={() => setActionError(null)}
          autoClose
          duration={5000}
        />
      )}

      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {monthLabel}
          </h2>
          {undated > 0 && (
            <span className="text-xs text-muted-foreground">
              {undated} undated
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors cursor-pointer hover:text-foreground hover:bg-surface-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const n = new Date();
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-muted-foreground transition-colors cursor-pointer hover:text-foreground hover:bg-surface-muted"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors cursor-pointer hover:text-foreground hover:bg-surface-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[36rem] animate-pulse rounded-xl border border-border bg-surface-muted/40" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const key = ymd(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = key === todayKey;
              const dayTasks = byDay.get(key) ?? [];
              return (
                <div
                  key={i}
                  onClick={() => openCreate(key)}
                  className={cn(
                    "group min-h-[6.5rem] border-b border-r border-border p-1.5 transition-colors cursor-pointer hover:bg-surface-muted/50",
                    // last column / last row trim
                    (i + 1) % 7 === 0 && "border-r-0",
                    i >= 35 && "border-b-0",
                    !inMonth && "bg-surface-muted/30"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                        isToday
                          ? "bg-accent text-accent-foreground font-semibold"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <div className="flex flex-col gap-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const priority = PRIORITY_COLOR[task.priority as TaskPriority]
                        ? (task.priority as TaskPriority)
                        : DEFAULT_PRIORITY;
                      const overdue = isOverdue(task.dueDate, task.status);
                      const done = task.status === "completed";
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(task);
                          }}
                          title={task.title}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-1 text-left text-xs transition-colors hover:border-border-strong cursor-pointer",
                            overdue && "border-danger/40"
                          )}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: PRIORITY_COLOR[priority] }}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "truncate",
                              done
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            )}
                          >
                            {task.title}
                          </span>
                        </button>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="px-1 text-xs text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Task
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={currentTask}
        defaultDueDate={createDate}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete task?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently deleted.`
            : undefined
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
