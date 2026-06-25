"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/api/tasks";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import Task, { TaskData } from "@/app/components/Task";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Card from "@/app/components/ui/Card";
import Badge, { statusToTone } from "@/app/components/ui/Badge";
import IconButton from "@/app/components/ui/IconButton";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/search UI state
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
          prev.map((t) =>
            t.id === updatedFromServer.id ? updatedFromServer : t
          )
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
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-sm text-danger">Error loading tasks: {error}</p>
        <Button variant="secondary" onClick={() => router.push("/login")}>
          Re-Login
        </Button>
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

  const pageButton =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
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

      {/* Filter & search */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:w-44">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter tasks by status"
          >
            <option value="all">All tasks</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
          </Select>
        </div>
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            placeholder="Search tasks…"
          />
        </div>
      </div>

      {/* Task list */}
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        My Tasks
        <span className="ml-2 text-muted-foreground/70">
          {filteredTasks.length}
        </span>
      </h2>

      {filteredTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
          <Button variant="secondary" size="sm" onClick={handleCreateTask}>
            <Plus className="h-4 w-4" />
            Create your first task
          </Button>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {currentTasks.map((task) => (
              <li key={task.id}>
                <Card className="p-4 transition-colors hover:border-border-strong">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-foreground">
                      {task.title}
                    </h3>
                    <Badge tone={statusToTone(task.status)}>
                      {task.status.toUpperCase()}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {task.description.length > 120
                        ? task.description.slice(0, 120) + "…"
                        : task.description}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <IconButton onClick={() => handleEditTask(task)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </IconButton>
                    <IconButton
                      variant="danger"
                      onClick={() => handleInlineDelete(task.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </IconButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={cn(
                  pageButton,
                  "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        pageButton,
                        currentPage === page
                          ? "border-transparent bg-accent text-accent-foreground"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-muted"
                      )}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
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
    </div>
  );
}
