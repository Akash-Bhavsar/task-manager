"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";
import Input from "@/app/components/ui/Input";
import Textarea from "@/app/components/ui/Textarea";
import Select from "@/app/components/ui/Select";
import Button from "@/app/components/ui/Button";

export interface TaskData {
  id?: number;
  title: string;
  description: string;
  status: string;
}

interface TaskProps {
  isOpen: boolean;
  onClose: () => void;
  // If editing, we pass an existing task
  initialTask?: TaskData;
  // Called on create or edit submission
  onSubmit: (task: TaskData) => Promise<void>;
  // Called if user wants to delete the task
  onDelete?: (taskId: number) => Promise<void> | void;
}

const Task: React.FC<TaskProps> = ({
  isOpen,
  onClose,
  initialTask,
  onSubmit,
  onDelete,
}) => {
  const [task, setTask] = useState<TaskData>({
    id: initialTask?.id,
    title: initialTask?.title || "",
    description: initialTask?.description || "",
    status: initialTask?.status || "Draft",
  });

  useEffect(() => {
    // Update local state if the parent changes "initialTask"
    setTask({
      id: initialTask?.id,
      title: initialTask?.title || "",
      description: initialTask?.description || "",
      status: initialTask?.status || "Draft",
    });
  }, [initialTask]);

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
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl animate-scale-in">
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
              value={task.status}
              onChange={handleChange}
            >
              <option value="Draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
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
