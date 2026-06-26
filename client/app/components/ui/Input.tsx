import React from "react";
import { cn } from "@/lib/cn";

export const fieldClasses =
  "w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--ring)]";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClasses, className)} {...props} />
));
Input.displayName = "Input";

export default Input;
