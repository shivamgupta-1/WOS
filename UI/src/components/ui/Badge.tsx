import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "operational"
  | "degraded"
  | "outage"
  | "maintenance"
  | "unknown";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-muted text-foreground-secondary",
  success: "border-success-border bg-success-bg text-success-text",
  warning: "border-warning-border bg-warning-bg text-warning-text",
  danger: "border-danger-border bg-danger-bg text-danger-text",
  info: "border-info-border bg-info-bg text-info-text",
  operational: "border-status-operational-border bg-status-operational-bg text-status-operational-text",
  degraded: "border-status-degraded-border bg-status-degraded-bg text-status-degraded-text",
  outage: "border-status-outage-border bg-status-outage-bg text-status-outage-text",
  maintenance: "border-status-maintenance-border bg-status-maintenance-bg text-status-maintenance-text",
  unknown: "border-status-unknown-border bg-status-unknown-bg text-status-unknown-text",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn("inline-flex min-h-5 items-center rounded-sm border px-1.5 text-12 font-medium leading-4", variants[variant], className)}
    >
      {children}
    </span>
  );
}
