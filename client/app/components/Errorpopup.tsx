import React, { useEffect, useState } from "react";
import { X, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastType = "success" | "warning" | "danger";

interface ErrorPopupProps {
  message: string;
  type: ToastType;
  icon?: React.ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const accent: Record<ToastType, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const defaultIcon: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  danger: <AlertCircle className="h-5 w-5" />,
};

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  message,
  type = "danger",
  icon,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // Allow time for fade-out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose, autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-surface py-3 pl-4 pr-3 text-sm font-medium text-foreground shadow-lg transition-all duration-300",
          isVisible
            ? "translate-y-0 opacity-100 animate-toast-in"
            : "-translate-y-2 opacity-0"
        )}
      >
        <span className={accent[type]}>{icon || defaultIcon[type]}</span>
        <p className="mr-2 max-w-xs">{message}</p>
        <button
          onClick={handleClose}
          type="button"
          aria-label="close-error"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-muted cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
