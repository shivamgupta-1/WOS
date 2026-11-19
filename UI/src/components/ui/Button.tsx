import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-action text-white hover:bg-action-hover",
  secondary: "border-border bg-surface text-foreground-primary hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-foreground-secondary hover:bg-surface-muted hover:text-foreground-primary",
  danger: "border-transparent bg-red-700 text-white hover:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 gap-1.5 px-2.5 text-12",
  md: "min-h-9 gap-2 px-3 text-14",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    type = "button",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
