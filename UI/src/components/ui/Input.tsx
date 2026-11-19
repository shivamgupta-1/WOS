import type { InputHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, className, wrapperClassName, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [props["aria-describedby"], hint ? hintId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("grid gap-1.5", wrapperClassName)}>
      {label && <label className="text-13 font-medium text-foreground-primary" htmlFor={inputId}>{label}</label>}
      <input
        {...props}
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={describedBy}
        className={cn(
          "min-h-9 w-full rounded-md border border-border bg-surface px-3 text-14 text-foreground-primary placeholder:text-foreground-tertiary focus-visible:border-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
          error && "border-danger focus-visible:ring-red-200",
          className,
        )}
      />
      {hint && !error && <p className="text-12 text-foreground-secondary" id={hintId}>{hint}</p>}
      {error && <p className="text-12 text-danger" id={errorId}>{error}</p>}
    </div>
  );
});
