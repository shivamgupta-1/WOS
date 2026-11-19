import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "./cn";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface MenuProps {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  className?: string;
  showChevron?: boolean;
}

export function Menu({ label, trigger, items, className, showChevron = true }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const firstItem = itemsRef.current.findIndex((item) => !item.disabled);
    if (firstItem >= 0) itemRefs.current[firstItem]?.focus();
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      close(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const enabled = items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0);
    if (enabled.length === 0) return;
    event.preventDefault();
    const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
    const activePosition = enabled.indexOf(activeIndex);
    const nextPosition = event.key === "Home"
      ? 0
      : event.key === "End"
        ? enabled.length - 1
        : (activePosition + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
    const nextIndex = enabled[nextPosition];
    if (nextIndex !== undefined) itemRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-13 font-medium text-foreground-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        {trigger}
        {showChevron && <ChevronDown aria-hidden="true" className="size-4 text-foreground-tertiary" />}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-50 mt-1 min-w-44 rounded-md border border-border bg-surface p-1 shadow-md"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { itemRefs.current[index] = element; }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              tabIndex={-1}
              onClick={() => {
                item.onSelect();
                close(true);
              }}
              className="flex min-h-8 w-full items-center rounded-sm px-2 text-left text-13 text-foreground-primary hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
