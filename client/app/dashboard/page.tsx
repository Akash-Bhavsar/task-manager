"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/api/tasks";
import { FaEdit, FaTrash, FaTasks, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Task, { TaskData } from "@/app/components/Task";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown & filter/search UI state
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskData | undefined>(
    undefined
  );

  // Fetch tasks on mount
  useEffect(() => {
    const getTasks = async () => {
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        if (err instanceof Error) {
          // If 401/403, probably not authenticated => redirect to login
          if (err.message.includes("401") || err.message.includes("403")) {
            router.push("/login");
            return;
          }
          setError(err.message);
        } else {
          setError("Unknown error occurred while fetching tasks.");
        }
      } finally {
        setLoading(false);
      }
    };

    getTasks();
  }, [router]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Rest of your handlers...
  const handleCreateTask = () => {
    setCurrentTask(undefined);
    setModalOpen(true);
  };

  const handleEditTask = (task: TaskData) => {
    setCurrentTask(task);
    setModalOpen(true);
  };

  const handleModalSubmit = async (newOrUpdatedTask: TaskData) => {
    try {
      if (newOrUpdatedTask.id) {
        const updatedFromServer = await updateTask(
          String(newOrUpdatedTask.id),
          {
            title: newOrUpdatedTask.title,
            description: newOrUpdatedTask.description,
            status: newOrUpdatedTask.status,
          }
        );

        setTasks((prev) =>
          prev.map((t) => (t.id === updatedFromServer.id ? updatedFromServer : t))
        );
      } else {
        const createdFromServer = await createTask({
          title: newOrUpdatedTask.title,
          description: newOrUpdatedTask.description,
          status: newOrUpdatedTask.status,
        });

        setTasks((prev) => [...prev, createdFromServer]);
      }
      setModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while saving task.");
      }
    }
  };

  const handleModalDelete = async (taskId: number) => {
    try {
      await deleteTask(String(taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while deleting task.");
      }
    }
  };

  const handleInlineDelete = async (taskId: number) => {
    try {
      await deleteTask(String(taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while deleting task.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-lightGreen p-4">
        <h2 className="text-xl font-semibold text-foreground">
          Loading tasks...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-redish p-4">
        <h2 className="text-xl font-semibold text-background">
          Error loading tasks: {error}
        </h2>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 bg-yellowish hover:bg-yellow-400 text-background py-2 px-4 rounded focus:outline-none transition"
        >
          Re-Login
        </button>
      </div>
    );
  }

  // Filter + search
  const filteredTasks = tasks.filter((task) => {
    if (filter !== "all" && task.status !== filter) return false;
    if (
      searchTerm &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastTask = currentPage * itemsPerPage;
  const indexOfFirstTask = indexOfLastTask - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-3xl bg-green-25 mx-auto rounded-md shadow-md p-6">
        {/* Top Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaTasks className="text-foreground" />
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            </div>
            <button
              onClick={handleCreateTask}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
            >
              <FaPlus />
              Create Task
            </button>
          </div>

          {/* Filter & search */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-foreground bg-green-100 border border-yellowish rounded-lg hover:bg-green-200 focus:outline-none"
                  type="button"
                >
                  Filter by: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute z-10 mt-1 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44">
                    <ul className="py-2 text-sm text-foreground">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter("all");
                            setShowDropdown(false);
                          }}
                          className="inline-flex w-full px-4 py-2 hover:bg-green-100"
                        >
                          All
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter("completed");
                            setShowDropdown(false);
                          }}
                          className="inline-flex w-full px-4 py-2 hover:bg-green-100"
                        >
                          Completed
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter("in-progress");
                            setShowDropdown(false);
                          }}
                          className="inline-flex w-full px-4 py-2 hover:bg-green-100"
                        >
                          In Progress
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Search bar */}
              <div className="relative flex-grow">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block p-2.5 w-full text-sm text-foreground bg-white rounded-lg border border-yellowish focus:ring-greenish focus:border-greenish"
                  placeholder="Search tasks..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <h2 className="text-xl font-semibold text-foreground mb-4">My Tasks</h2>
        {filteredTasks.length === 0 ? (
          <div className="text-foreground">No tasks available.</div>
        ) : (
          <>
            <ul className="space-y-3">
              {currentTasks.map((task) => (
                <li
                  key={task.id}
                  className="p-4 border border-yellowish rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-foreground">
                      {task.title}
                    </div>
                    <span
                      className={
                        task.status === "completed"
                          ? "text-greenish font-semibold ml-2"
                          : "text-orange-500 font-semibold ml-2"
                      }
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-foreground overflow-hidden">
                    {task.description.length > 80
                      ? task.description.slice(0, 80) + "..."
                      : task.description}
                  </p>

                  {/* Edit & Delete buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleInlineDelete(task.id!)}
                      className="bg-redish hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none flex items-center"
                    >
                      <FaTrash className="mr-2" />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md flex items-center ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 text-foreground hover:bg-green-200"
                  }`}
                >
                  <FaChevronLeft className="mr-1" />
                  Prev
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? "bg-green-500 text-white"
                          : "bg-green-100 text-foreground hover:bg-green-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md flex items-center ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 text-foreground hover:bg-green-200"
                  }`}
                >
                  Next
                  <FaChevronRight className="ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Our Task Modal */}
      <Task
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={currentTask}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
      />
    </div>
  );
}
