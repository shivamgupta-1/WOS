import { createContext, useContext, useId, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

interface TabsState {
  id: string;
  value: string;
  label: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsState | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be rendered inside Tabs.");
  return context;
}

function tabId(id: string, value: string, part: "tab" | "panel") {
  return `${id}-${part}-${encodeURIComponent(value)}`;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, defaultValue = "", onValueChange, label, children, className }: TabsProps) {
  const id = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const setValue = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ id, value: selectedValue, label, setValue }}>
      <div className={cn("grid gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  const tabs = useTabs();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    if (buttons.length === 0) return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[role="tab"]')
      : null;
    const currentIndex = target ? buttons.indexOf(target) : -1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[nextIndex]?.focus();
    buttons[nextIndex]?.click();
  }

  return (
    <div {...props} role="tablist" aria-label={tabs.label} onKeyDown={handleKeyDown} className={cn("flex w-fit max-w-full gap-1 overflow-x-auto border-b border-border", className)}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, disabled, className, onClick, ...props }: TabsTriggerProps) {
  const tabs = useTabs();
  const selected = tabs.value === value;
  return (
    <button
      {...props}
      type="button"
      role="tab"
      id={tabId(tabs.id, value, "tab")}
      aria-controls={tabId(tabs.id, value, "panel")}
      aria-selected={selected}
      disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.setValue(value);
      }}
      className={cn(
        "relative -mb-px min-h-10 shrink-0 border-b-2 px-3 text-13 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-accent-600 text-accent-700" : "border-transparent text-foreground-secondary hover:text-foreground-primary",
        className,
      )}
    />
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const tabs = useTabs();
  const selected = tabs.value === value;
  return (
    <div
      {...props}
      id={tabId(tabs.id, value, "panel")}
      role="tabpanel"
      aria-labelledby={tabId(tabs.id, value, "tab")}
      tabIndex={0}
      hidden={!selected}
      className={cn("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500", className)}
    />
  );
}
