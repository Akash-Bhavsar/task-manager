"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";
import Input from "@/app/components/ui/Input";
import Textarea from "@/app/components/ui/Textarea";
import Select from "@/app/components/ui/Select";
import Button from "@/app/components/ui/Button";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  DEFAULT_STATUS,
  DEFAULT_PRIORITY,
  normalizeStatus,
} from "@/lib/taskConstants";

export interface TaskData {
  id?: number;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
}

// HTML date input wants YYYY-MM-DD; tolerate ISO datetime from the API.
function toDateInput(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

interface TaskProps {
  isOpen: boolean;
  onClose: () => void;
  // If editing, we pass an existing task
  initialTask?: TaskData;
  // Pre-selected status when creating (e.g. the Kanban column the "+" came from).
  defaultStatus?: string;
  // Pre-filled due date when creating (e.g. the calendar day the "+" came from).
  defaultDueDate?: string;
  // Called on create or edit submission
  onSubmit: (task: TaskData) => Promise<void>;
  // Called if user wants to delete the task
  onDelete?: (taskId: number) => Promise<void> | void;
}

const Task: React.FC<TaskProps> = ({
  isOpen,
  onClose,
  initialTask,
  defaultStatus,
  defaultDueDate,
  onSubmit,
  onDelete,
}) => {
  // Create defaults to `defaultStatus` (the column its "+" came from), else draft.
  const initialStatus = initialTask
    ? normalizeStatus(initialTask.status)
    : defaultStatus
      ? normalizeStatus(defaultStatus)
      : DEFAULT_STATUS;

  // Create pre-fills the due date from `defaultDueDate` (the calendar day clicked).
  const initialDue = toDateInput(initialTask ? initialTask.dueDate : defaultDueDate);

  const [task, setTask] = useState<TaskData>({
    id: initialTask?.id,
    title: initialTask?.title || "",
    description: initialTask?.description || "",
    status: initialStatus,
    priority: initialTask?.priority || DEFAULT_PRIORITY,
    dueDate: initialDue,
  });

  useEffect(() => {
    // Re-initialize the form each time the modal opens (or the edited task
    // changes). Keying on `isOpen` is what resets the form after a create —
    // otherwise a second "Create" keeps the previous task's values.
    if (!isOpen) return;
    setTask({
      id: initialTask?.id,
      title: initialTask?.title || "",
      description: initialTask?.description || "",
      status: initialStatus,
      priority: initialTask?.priority || DEFAULT_PRIORITY,
      dueDate: initialDue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTask, isOpen, defaultStatus, defaultDueDate]);

  // Toast / Error management
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType | null;
  }>({ message: "", type: null });

  const handleCloseToast = () => {
    setToast({ message: "", type: null });
  };

  // Update local state on input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  // Delete handler: calls parent onDelete if provided
  const handleDelete = async () => {
    if (task.id && onDelete) {
      try {
        await onDelete(task.id);
        setToast({ message: "Task deleted successfully", type: "success" });
        onClose();
      } catch (err) {
        console.error(err);
        setToast({
          message: `Failed to delete task: ${String(err)}`,
          type: "danger",
        });
      }
    }
  };

  // Form submit handler: calls parent onSubmit to create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(task);
      onClose();
    } catch (err) {
      console.error(err);
      setToast({
        message: `Failed to save task: ${String(err)}`,
        type: "danger",
      });
    }
  };

  // If not open, render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/20 p-4 backdrop-blur-sm animate-fade-in">
      {/* If there's a toast message, show the ErrorPopup */}
      {toast.message && toast.type && (
        <ErrorPopup
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
          autoClose
          duration={5000}
        />
      )}

      {/* Modal container */}
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-surface p-8 shadow-xl animate-scale-in">
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="mb-5 text-lg font-semibold tracking-tight text-foreground">
          {initialTask ? "Edit Task" : "Create New Task"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="taskTitle"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Title
            </label>
            <Input
              id="taskTitle"
              name="title"
              type="text"
              value={task.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <label
              htmlFor="taskDescription"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Textarea
              id="taskDescription"
              name="description"
              value={task.description}
              onChange={handleChange}
              placeholder="Add more details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="taskStatus"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Status
              </label>
              <Select
                id="taskStatus"
                name="status"
                value={normalizeStatus(task.status)}
                onChange={handleChange}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label
                htmlFor="taskPriority"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Priority
              </label>
              <Select
                id="taskPriority"
                name="priority"
                value={task.priority || DEFAULT_PRIORITY}
                onChange={handleChange}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label
              htmlFor="taskDueDate"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Due date
            </label>
            <Input
              id="taskDueDate"
              name="dueDate"
              type="date"
              value={task.dueDate || ""}
              onChange={handleChange}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-2 flex items-center justify-between gap-2">
            {task.id && onDelete ? (
              <Button type="button" variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{initialTask ? "Save" : "Create"}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Task;
