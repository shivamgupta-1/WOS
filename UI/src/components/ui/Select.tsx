import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { cn } from "./cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, className, wrapperClassName, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = [props["aria-describedby"], hint ? hintId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("grid gap-1.5", wrapperClassName)}>
      {label && <label className="text-13 font-medium text-foreground-primary" htmlFor={selectId}>{label}</label>}
      <span className="relative block">
        <select
          {...props}
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={describedBy}
          className={cn(
            "min-h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-14 text-foreground-primary focus-visible:border-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
            error && "border-danger focus-visible:ring-red-200",
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground-tertiary" />
      </span>
      {hint && !error && <p className="text-12 text-foreground-secondary" id={hintId}>{hint}</p>}
      {error && <p className="text-12 text-danger" id={errorId}>{error}</p>}
    </div>
  );
});
