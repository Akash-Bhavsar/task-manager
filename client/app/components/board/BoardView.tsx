"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Column from "./Column";
import { TaskCardContent } from "./TaskCard";
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
  TASK_STATUSES,
  normalizeStatus,
  type TaskStatus,
} from "@/lib/taskConstants";
import { midpoint } from "@/lib/position";

type Columns = Record<TaskStatus, TaskRecord[]>;

const emptyColumns = (): Columns =>
  TASK_STATUSES.reduce((acc, s) => {
    acc[s] = [];
    return acc;
  }, {} as Columns);

// Which column currently holds a given task id.
function locate(cols: Columns, id: UniqueIdentifier): TaskStatus | undefined {
  return TASK_STATUSES.find((s) => cols[s].some((t) => t.id === id));
}

// `over.id` is either a column id (a status string) or a task id (a number).
function resolveContainer(
  cols: Columns,
  id: UniqueIdentifier
): TaskStatus | undefined {
  if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
  return locate(cols, id);
}

export default function BoardView({ reloadSignal }: { reloadSignal?: number }) {
  const [columns, setColumns] = useState<Columns>(emptyColumns);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Snapshot taken at drag start so a failed persist can roll the board back.
  const snapshot = useRef<Columns | null>(null);

  // Task modal + delete confirmation (board owns its own, like the list view).
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(undefined);
  const [createStatus, setCreateStatus] = useState<TaskStatus | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<TaskRecord | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Board owns its own fetch: pull a wide page sorted by position, group by status.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({ sort: "position", pageSize: 100 });
      const next = emptyColumns();
      for (const task of res.items) {
        next[normalizeStatus(task.status)].push(task);
      }
      setColumns(next);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadSignal]);

  const activeTask = activeId
    ? Object.values(columns)
        .flat()
        .find((t) => t.id === activeId) ?? null
    : null;

  // Persist a single moved card (status + fractional position). Roll back on error.
  const persist = async (id: number, status: TaskStatus, position: number) => {
    try {
      await updateTask(String(id), { status, position });
    } catch (e) {
      if (snapshot.current) setColumns(snapshot.current);
      setActionError(e instanceof Error ? e.message : "Failed to move task");
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id);
    snapshot.current = columns;
  };

  // Live cross-column preview: move the card between column arrays as it hovers.
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    setColumns((prev) => {
      const from = locate(prev, active.id);
      const to = resolveContainer(prev, over.id);
      if (!from || !to || from === to) return prev;

      const fromItems = prev[from];
      const toItems = prev[to];
      const activeIndex = fromItems.findIndex((t) => t.id === active.id);
      if (activeIndex < 0) return prev;

      const overIndex = toItems.findIndex((t) => t.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;
      const moved = { ...fromItems[activeIndex], status: to };

      return {
        ...prev,
        [from]: fromItems.filter((t) => t.id !== active.id),
        [to]: [
          ...toItems.slice(0, insertAt),
          moved,
          ...toItems.slice(insertAt),
        ],
      };
    });
  };

  // Finalize: same-column reorder + compute the new position, then persist.
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    setColumns((prev) => {
      const container = resolveContainer(prev, over.id);
      const from = locate(prev, active.id);
      if (!container || !from) return prev;

      let items = prev[container];
      const droppedOnColumn = TASK_STATUSES.includes(over.id as TaskStatus);

      if (from === container && active.id !== over.id && !droppedOnColumn) {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0) {
          items = arrayMove(items, oldIndex, newIndex);
        }
      }

      const idx = items.findIndex((t) => t.id === active.id);
      if (idx < 0) return prev;
      const newPos = midpoint(items[idx - 1]?.position, items[idx + 1]?.position);
      items = items.map((t) =>
        t.id === active.id ? { ...t, position: newPos, status: container } : t
      );

      void persist(active.id as number, container, newPos);
      return { ...prev, [container]: items };
    });
  };

  // --- Task modal / delete handlers (mirror the list view) ---

  const openCreate = (status: TaskStatus) => {
    setCurrentTask(undefined);
    setCreateStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: TaskRecord) => {
    setCreateStatus(undefined);
    setCurrentTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
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
      setActionError(
        err instanceof Error ? err.message : "Failed to delete task."
      );
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
      setActionError(
        err instanceof Error ? err.message : "Failed to delete task."
      );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TASK_STATUSES.map((s) => (
          <div
            key={s}
            className="h-72 animate-pulse rounded-xl border border-border bg-surface-muted/40"
          />
        ))}
      </div>
    );
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              onAdd={openCreate}
              onEditTask={openEdit}
              onDeleteTask={setDeleteTarget}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardContent task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <Task
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={currentTask}
        defaultStatus={createStatus}
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
