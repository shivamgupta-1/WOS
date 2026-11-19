import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

const labels: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
  maintenance: "Maintenance",
  unknown: "Unknown",
};

const dotColors: Record<ServiceStatus, string> = {
  operational: "bg-status-operational-text",
  degraded: "bg-status-degraded-text",
  outage: "bg-status-outage-text",
  maintenance: "bg-status-maintenance-text",
  unknown: "bg-status-unknown-text",
};

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  status: ServiceStatus;
  label?: string;
}

export function StatusDot({ status, label, className, ...props }: StatusDotProps) {
  return (
    <span {...props} className={cn("inline-flex items-center gap-2 text-13 text-foreground-primary", className)}>
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dotColors[status])} />
      <span>{label ?? labels[status]}</span>
    </span>
  );
}
