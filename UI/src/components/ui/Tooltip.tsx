import { cloneElement, useId } from "react";
import type { ReactElement } from "react";
import { cn } from "./cn";

export interface TooltipProps {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");
  const child = cloneElement(children, { "aria-describedby": describedBy });

  return (
    <span className={cn("group relative inline-flex", className)}>
      {child}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden max-w-64 -translate-x-1/2 rounded-md border border-border bg-surface px-2 py-1 text-12 text-foreground-primary shadow-sm group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
