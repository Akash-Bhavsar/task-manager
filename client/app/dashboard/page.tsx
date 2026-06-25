"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  CalendarClock,
} from "lucide-react";
import Task, { TaskData } from "@/app/components/Task";
import { useTasks } from "@/app/hooks/useTasks";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Card from "@/app/components/ui/Card";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";
import { cn } from "@/lib/cn";
import {
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_COLOR,
  DEFAULT_PRIORITY,
  statusLabel,
  type TaskPriority,
} from "@/lib/taskConstants";
import { formatDueDate, isOverdue } from "@/lib/date";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "due", label: "Due date" },
  { value: "title", label: "Title A–Z" },
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    items,
    total,
    page,
    totalPages,
    loading,
    error,
    status,
    q,
    sort,
    setStatus,
    setQ,
    setSort,
    setPage,
    reload,
  } = useTasks({ pageSize: 5 });

  // Modal + dialog state (UI only — data lives in the hook).
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TaskData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auth errors from the fetch → bounce to login.
  useEffect(() => {
    if (error && (error.includes("401") || error.includes("403"))) {
      router.push("/login");
    }
  }, [error, router]);

  // Keyboard shortcuts: c = create, / = focus search, esc = close overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);

      if (e.key === "Escape") {
        setModalOpen(false);
        setDeleteTarget(null);
        return;
      }
      if (typing) return;
      if (e.key === "c") {
        e.preventDefault();
        setCurrentTask(undefined);
        setModalOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCreateTask = () => {
    setCurrentTask(undefined);
    setModalOpen(true);
  };

  const handleEditTask = (task: TaskData) => {
    setCurrentTask(task);
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
        });
      } else {
        await createTask({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save task."
      );
    }
  };

  const handleModalDelete = async (taskId: number) => {
    try {
      await deleteTask(String(taskId));
      setModalOpen(false);
      await reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete task."
      );
    }
  };

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    if (!target?.id) return;
    setDeleteTarget(null);
    try {
      await deleteTask(String(target.id));
      await reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete task."
      );
    }
  };

  const pageButton =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {actionError && (
        <ErrorPopup
          message={actionError}
          type={"danger" as ToastType}
          onClose={() => setActionError(null)}
          autoClose
          duration={5000}
        />
      )}

      {/* Top header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filter / sort / search */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:w-40">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter tasks by status"
          >
            <option value="all">All tasks</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-48">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort tasks"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            placeholder="Search tasks…  ( / )"
          />
        </div>
      </div>

      {/* Task list */}
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        My Tasks
        <span className="ml-2 text-muted-foreground/70">{total}</span>
      </h2>

      {loading ? (
        <ul className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="h-5 w-1/2 animate-pulse rounded bg-surface-muted" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
              <div className="mt-4 h-9 w-32 animate-pulse rounded-lg bg-surface-muted" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {status !== "all" || q ? "No tasks match your filters." : "No tasks yet."}
          </p>
          <Button variant="secondary" size="sm" onClick={handleCreateTask}>
            <Plus className="h-4 w-4" />
            Create your first task
          </Button>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {items.map((task) => {
              const priority = PRIORITY_COLOR[task.priority as TaskPriority]
                ? (task.priority as TaskPriority)
                : DEFAULT_PRIORITY;
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li key={task.id}>
                  <Card
                    className="border-l-[3px] p-4 transition-colors hover:border-border-strong"
                    style={{ borderLeftColor: PRIORITY_COLOR[priority] }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-foreground">
                        {task.title}
                      </h3>
                      <Badge tone={statusToTone(task.status)}>
                        {statusLabel(task.status)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {task.description.length > 120
                          ? task.description.slice(0, 120) + "…"
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

                    <div className="mt-4 flex gap-2">
                      <IconButton onClick={() => handleEditTask(task)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </IconButton>
                      <IconButton
                        variant="danger"
                        onClick={() => setDeleteTarget(task)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </IconButton>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={cn(
                  pageButton,
                  "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      pageButton,
                      p === page
                        ? "border-transparent bg-accent text-accent-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={cn(
                  pageButton,
                  "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Task modal */}
      <Task
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={currentTask}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
      />

      {/* Delete confirmation */}
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
    </div>
  );
}
