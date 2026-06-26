"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { fetchLabels, type Label as LabelType } from "@/lib/api/labels";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  CalendarClock,
  List,
  LayoutGrid,
  Rows3,
  Calendar as CalendarIcon,
} from "lucide-react";
import Task, { TaskData } from "@/app/components/Task";
import BoardView from "@/app/components/board/BoardView";
import TableView from "@/app/components/table/TableView";
import CalendarView from "@/app/components/calendar/CalendarView";
import { useTasks } from "@/app/hooks/useTasks";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Card from "@/app/components/ui/Card";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";
import LabelChips from "@/app/components/ui/LabelChips";
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
    label,
    setStatus,
    setQ,
    setSort,
    setLabel,
    setPage,
    setPageSize,
    reload,
  } = useTasks({ pageSize: 5 });

  // Labels for the filter dropdown (refetched alongside task reloads).
  const [allLabels, setAllLabels] = useState<LabelType[]>([]);

  // Modal + dialog state (UI only — data lives in the hook).
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TaskData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // List / Board / Table / Calendar view, persisted across sessions. Defaults to Kanban.
  const [view, setView] = useState<"list" | "board" | "table" | "calendar">(
    "board"
  );
  // Bumped after a global-Create/edit/delete so the board refetches too (it owns
  // its own data source, separate from the list's useTasks hook).
  const [boardReloadKey, setBoardReloadKey] = useState(0);
  useEffect(() => {
    const saved = localStorage.getItem("task-view");
    if (
      saved === "board" ||
      saved === "list" ||
      saved === "table" ||
      saved === "calendar"
    )
      setView(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("task-view", view);
  }, [view]);
  // Refetch labels whenever a create/edit/delete bumps the reload key (a new
  // label may have been added from the modal).
  useEffect(() => {
    fetchLabels()
      .then(setAllLabels)
      .catch(() => setAllLabels([]));
  }, [boardReloadKey]);
  // The table is denser than the list — give it more rows per page. Board and
  // calendar own their own fetch, so the hook's page size is irrelevant there.
  useEffect(() => {
    if (view === "list" || view === "table") setPageSize(view === "table" ? 10 : 5);
  }, [view, setPageSize]);

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
      await reload();
      setBoardReloadKey((k) => k + 1);
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
      setBoardReloadKey((k) => k + 1);
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
      setBoardReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete task."
      );
    }
  };

  const pageButton =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-10 sm:px-6",
        // Board and table use the full screen; the list stays narrow for readability.
        view === "list" ? "max-w-3xl" : "max-w-screen-2xl"
      )}
    >
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
        <div className="flex items-center gap-2">
          {/* List / Board / Table view switcher */}
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {(["list", "board", "table", "calendar"] as const).map((v) => {
              const Icon =
                v === "list"
                  ? List
                  : v === "board"
                    ? LayoutGrid
                    : v === "table"
                      ? Rows3
                      : CalendarIcon;
              return (
                <button
                  key={v}
                  type="button"
                  aria-label={`${v} view`}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
                    view === v
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <BoardView reloadSignal={boardReloadKey} />
      ) : view === "calendar" ? (
        <CalendarView reloadSignal={boardReloadKey} />
      ) : (
      <>
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
        {allLabels.length > 0 && (
          <div className="sm:w-44">
            <Select
              value={label ?? ""}
              onChange={(e) =>
                setLabel(e.target.value ? Number(e.target.value) : null)
              }
              aria-label="Filter tasks by label"
            >
              <option value="">All labels</option>
              {allLabels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        )}
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

      {error ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-danger">Couldn’t load tasks. {error}</p>
          <Button variant="secondary" size="sm" onClick={() => reload()}>
            Retry
          </Button>
        </Card>
      ) : !loading && items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {status !== "all" || q ? "No tasks match your filters." : "No tasks yet."}
          </p>
          <Button variant="secondary" size="sm" onClick={handleCreateTask}>
            <Plus className="h-4 w-4" />
            Create your first task
          </Button>
        </Card>
      ) : view === "table" ? (
        <TableView
          items={items}
          sort={sort}
          onSort={setSort}
          onEditTask={handleEditTask}
          onDeleteTask={(t) => setDeleteTarget(t)}
          loading={loading}
          onBulkComplete={async () => {
            await reload();
            setBoardReloadKey((k) => k + 1);
          }}
        />
      ) : loading ? (
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
      ) : (
          <ul className="flex flex-col gap-2.5">
            {items.map((task) => {
              const priority = PRIORITY_COLOR[task.priority as TaskPriority]
                ? (task.priority as TaskPriority)
                : DEFAULT_PRIORITY;
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li key={task.id}>
                  <Card
                    className="cursor-pointer border-l-[3px] p-4 transition-colors hover:border-border-strong"
                    style={{ borderLeftColor: PRIORITY_COLOR[priority] }}
                    onClick={() => handleEditTask(task)}
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

                    <LabelChips labels={task.labels} className="mt-2.5" />

                    <div className="mt-4 flex gap-2">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </IconButton>
                      <IconButton
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(task);
                        }}
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
      )}

      {/* Pagination — shared by list & table */}
      {!loading && !error && totalPages > 1 && (
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
