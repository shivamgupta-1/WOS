import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "./cn";

export const Card = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Card(
  { className, ...props },
  ref,
) {
  return <section {...props} ref={ref} className={cn("rounded-md border border-border bg-surface", className)} />;
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header {...props} className={cn("grid gap-1 border-b border-border px-4 py-3", className)} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cn("text-16 font-semibold text-foreground-primary", className)} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn("text-13 text-foreground-secondary", className)} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-4 py-3", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <footer {...props} className={cn("flex items-center gap-2 border-t border-border px-4 py-3", className)} />;
}
