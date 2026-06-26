import React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "danger";

const variants: Record<Variant, string> = {
  default:
    "text-muted-foreground border-border hover:text-foreground hover:bg-surface-muted hover:border-border-strong",
  danger:
    "text-muted-foreground border-border hover:text-danger hover:border-danger hover:bg-danger/10",
};

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-surface px-3 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

export default IconButton;
