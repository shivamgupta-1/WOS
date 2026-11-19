import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-auto max-h-[min(80vh,48rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-0 text-foreground-primary shadow-md backdrop:bg-gray-950/50",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="grid gap-1">
          <h2 className="text-16 font-semibold" id={titleId}>{title}</h2>
          {description && <p className="text-13 text-foreground-secondary" id={descriptionId}>{description}</p>}
        </div>
        <Button
          aria-label="Close dialog"
          size="sm"
          variant="ghost"
          leadingIcon={<X aria-hidden="true" className="size-4" />}
          onClick={() => onOpenChange(false)}
        />
      </header>
      <div className="px-5 py-4">{children}</div>
      {footer && <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>}
    </dialog>
  );
}
