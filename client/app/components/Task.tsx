"use client";

import React, { useState, useEffect } from "react";
import ErrorPopup, { ToastType } from "@/app/components/Errorpopup";

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  // Delete handler: calls parent onDelete if provided
  const handleDelete = async () => {
    if (task.id && onDelete) {
      try {
        // Some parent might do an API call internally, so we await:
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
      setToast({ message: "Task saved successfully", type: "success" });
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
    <div className="fixed z-50 inset-0 overflow-y-auto bg-opacity-30 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300 ease-out opacity-100">
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
      <div className="bg-white rounded shadow-lg w-3/4 h-3/4 p-6 relative transition-transform duration-300 ease-out transform scale-95 animate-scaleIn">
        {/* Close button */}
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 focus:outline-none"
          onClick={onClose}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold mb-4">
          {initialTask ? "Edit Task" : "Create New Task"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="taskTitle"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="taskTitle"
              name="title"
              type="text"
              value={task.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 mt-1"
              required
            />
          </div>

          {/* Description */}
          {/* Could integrate something like Editor.js or a WYSIWYG if needed */}
          <div>
            <label
              htmlFor="taskDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="taskDescription"
              name="description"
              value={task.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="taskStatus"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="taskStatus"
              name="status"
              value={task.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            >
              <option value="Draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              {/* Add more statuses as needed */}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 mt-4">
            {/* Delete button if editing existing task */}
            {task.id && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
            >
              {initialTask ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Task;
