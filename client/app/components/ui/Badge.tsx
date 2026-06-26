import React from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "muted";

const tones: Record<Tone, string> = {
  success: "text-success border-success/30 bg-success/10",
  warning: "text-warning border-warning/30 bg-warning/10",
  muted: "text-muted-foreground border-border bg-surface-muted",
};

/** Map a task status string to a badge tone + label. */
export function statusToTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s === "completed") return "success";
  if (s === "in-progress") return "warning";
  return "muted";
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export default function Badge({
  tone = "muted",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </span>
  );
}
