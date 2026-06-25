import React from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "@/app/components/ui/Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClasses, "h-auto min-h-24 py-2 resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export default Textarea;
