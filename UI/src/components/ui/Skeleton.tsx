import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "text" | "line" | "circle" | "block";
  size?: "sm" | "md" | "lg";
}

const variants = {
  text: "h-3 w-2/3 rounded-sm",
  line: "h-3 w-full rounded-sm",
  circle: "size-8 rounded-full",
  block: "h-20 w-full rounded-md",
} as const;

const sizes = {
  sm: "min-h-3",
  md: "min-h-4",
  lg: "min-h-6",
} as const;

export function Skeleton({ variant = "text", size = "md", className, ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn("block animate-pulse bg-neutral-200 motion-reduce:animate-none", variants[variant], sizes[size], className)}
    />
  );
}
