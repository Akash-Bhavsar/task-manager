"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTasks, TaskRecord, TasksQuery } from "@/lib/api/tasks";

export interface UseTasks {
  items: TaskRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  status: string;
  q: string;
  sort: string;
  label: number | null;
  setStatus: (s: string) => void;
  setQ: (q: string) => void;
  setSort: (s: string) => void;
  setLabel: (id: number | null) => void;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  reload: () => Promise<void>;
}

// Single server-driven data source shared by every task view (list, table, …).
// Owns filter/search/sort/pagination state and refetches when any changes;
// search is debounced and filter changes reset to page 1.
export function useTasks(initial?: Partial<TasksQuery>): UseTasks {
  const [pageSize, setPageSize] = useState(initial?.pageSize ?? 5);
  const [status, setStatus] = useState(initial?.status ?? "all");
  const [q, setQ] = useState(initial?.q ?? "");
  const [sort, setSort] = useState(initial?.sort ?? "updated");
  const [label, setLabel] = useState<number | null>(initial?.label ?? null);
  const [page, setPage] = useState(initial?.page ?? 1);

  const [items, setItems] = useState<TaskRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search term so typing doesn't fire a request per keystroke.
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter/search/sort change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [status, sort, debouncedQ, pageSize, label]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTasks({
        status,
        q: debouncedQ,
        sort,
        page,
        pageSize,
        label: label ?? undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedQ, sort, page, pageSize, label]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    total,
    page,
    pageSize,
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
    reload: load,
  };
}
