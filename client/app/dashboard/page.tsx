"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTasks } from "@/lib/api/tasks";
import { FaEdit, FaTrash, FaTasks, FaPlus } from "react-icons/fa";
// import { deleteTask } from "@/lib/api/tasks"; // Uncomment if you have a delete API

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const getTasks = async () => {
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        if (err instanceof Error) {
          if (
            err.message.includes("401") ||
            err.message.includes("403")
          ) {
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Uncomment and adapt the line below if a deleteTask API is available:
      // await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleEditTask = (taskId: string) => {
    router.push(`/tasks/${taskId}/edit`);
  };

  const handleCreateTask = () => {
    router.push("/tasks/create");
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
          className="mt-4 bg-yellowish hover:bg-yellow-500 text-background py-2 px-4 rounded focus:outline-none transition"
        >
          Re-Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-3xl bg-green-25 mx-auto rounded-md shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaTasks className="text-foreground" />
              <h1 className="text-2xl font-bold text-foreground">
              Dashboard
              </h1>
            </div>
            <button
              onClick={handleCreateTask}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
            >
              <FaPlus />
              Create Task
            </button>
            </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-foreground bg-green-100 border border-yellowish rounded-lg hover:bg-green-200 focus:outline-none"
                  type="button"
                >
                  Filter by: {filter.charAt(0).toUpperCase() + filter.slice(1)}{" "}
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
        <h2 className="text-xl font-semibold text-foreground mb-4">
          My Tasks
        </h2>
        {tasks.length === 0 ? (
          <div className="text-foreground">No tasks available.</div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-4 border border-yellowish rounded-lg shadow-sm"
              >
                <div className="font-bold text-lg text-foreground">
                  {task.title}
                </div>
                <p className="text-foreground">
                  {task.description}
                </p>
                <span
                  className={
                    task.status === "completed"
                      ? "text-greenish font-semibold"
                      : "text-orange-500 font-semibold"
                  }
                >
                  {task.status.toUpperCase()}
                </span>
                <div className="mt-4 flex gap-2">
                  <button
                  onClick={() => handleEditTask(task.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"
                  >
                  <FaEdit className="mr-2" />
                  Edit
                  </button>
                  <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center"
                  >
                  <FaTrash className="mr-2" />
                  Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
