import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  retryLabel = "Try again",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <section role="alert" className={cn("grid justify-items-start gap-2 py-6", className)}>
      <CircleAlert aria-hidden="true" className="size-5 text-danger" />
      <h2 className="text-14 font-semibold text-foreground-primary">{title}</h2>
      {description && <p className="max-w-prose text-13 text-foreground-secondary">{description}</p>}
      {action ?? (onRetry && <Button size="sm" onClick={onRetry}>{retryLabel}</Button>)}
    </section>
  );
}
