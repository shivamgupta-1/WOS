import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export type ToastVariant = "success" | "warning" | "danger" | "info";

export interface ToastProps {
  open: boolean;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ReactNode;
  onDismiss: () => void;
  className?: string;
}

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: AlertCircle,
  info: Info,
} as const;

const colors = {
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
  info: "text-info-text",
} as const;

export function Toast({
  open,
  title,
  description,
  variant = "info",
  action,
  onDismiss,
  className,
}: ToastProps) {
  if (!open) return null;
  const Icon = icons[variant];

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      aria-live={variant === "danger" ? "assertive" : "polite"}
      className={cn("flex w-full max-w-sm items-start gap-3 rounded-md border border-border bg-surface p-3 shadow-md", className)}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", colors[variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-13 font-medium text-foreground-primary">{title}</p>
        {description && <p className="mt-1 text-12 text-foreground-secondary">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      <Button
        aria-label="Dismiss notification"
        size="sm"
        variant="ghost"
        leadingIcon={<X aria-hidden="true" className="size-4" />}
        onClick={onDismiss}
      />
    </div>
  );
}
