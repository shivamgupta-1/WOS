import { Inbox } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  const titleId = useId();
  return (
    <section className={cn("grid justify-items-start gap-2 py-8", className)} aria-labelledby={titleId}>
      <Inbox aria-hidden="true" className="size-5 text-foreground-tertiary" />
      <h2 className="text-14 font-semibold text-foreground-primary" id={titleId}>{title}</h2>
      {description && <p className="max-w-prose text-13 text-foreground-secondary">{description}</p>}
      {action}
    </section>
  );
}
