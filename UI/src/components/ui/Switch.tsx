import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type"> {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  size?: "sm" | "md";
}

const sizes = {
  sm: { track: "h-5 w-9", thumb: "size-3.5", on: "translate-x-4" },
  md: { track: "h-6 w-11", thumb: "size-4", on: "translate-x-5" },
} as const;

export function Switch({
  checked,
  label,
  onCheckedChange,
  onClick,
  size = "md",
  disabled,
  className,
  ...props
}: SwitchProps) {
  const dimensions = sizes[size];
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={props["aria-label"] ?? label}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange(!checked);
      }}
      className={cn("inline-flex items-center gap-2 text-left text-14 text-foreground-primary disabled:cursor-not-allowed disabled:opacity-50", className)}
    >
      <span className={cn("relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150 ease-out", dimensions.track, checked ? "bg-action" : "bg-neutral-300")}>
        <span className={cn("absolute left-0.5 rounded-full bg-white transition-transform duration-150 ease-out", dimensions.thumb, checked && dimensions.on)} />
      </span>
      <span>{label}</span>
    </button>
  );
}
