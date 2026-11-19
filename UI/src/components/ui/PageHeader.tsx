import type { ReactNode } from "react";
import { cn } from "./cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="grid gap-1">
        {eyebrow && <p className="text-12 font-medium uppercase tracking-wide text-foreground-secondary">{eyebrow}</p>}
        <h1 className="text-24 font-semibold tracking-tight text-foreground-primary">{title}</h1>
        {description && <p className="max-w-prose text-14 text-foreground-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
