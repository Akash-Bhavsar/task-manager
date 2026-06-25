"use client";

import { useEffect } from "react";
import Button from "@/app/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {message && (
          <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
