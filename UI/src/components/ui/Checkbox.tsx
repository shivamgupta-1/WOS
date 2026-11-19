import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { cn } from "./cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
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
      <label className="inline-flex w-fit cursor-pointer items-start gap-2 text-14 text-foreground-primary">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={describedBy}
          className={cn("mt-0.5 size-4 rounded-sm border-border accent-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500", className)}
        />
        <span>{label}</span>
      </label>
      {hint && !error && <p className="pl-6 text-12 text-foreground-secondary" id={hintId}>{hint}</p>}
      {error && <p className="pl-6 text-12 text-danger" id={errorId}>{error}</p>}
    </div>
  );
});
