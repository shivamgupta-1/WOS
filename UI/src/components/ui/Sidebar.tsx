import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  label?: string;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    brand,
    footer,
    collapsed = false,
    onCollapsedChange,
    label = "Primary navigation",
    children,
    className,
    ...props
  },
  ref,
) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      {...props}
      ref={ref}
      aria-label={label}
      className={cn("flex h-full min-h-0 flex-col border-r border-border bg-surface", collapsed ? "w-16" : "w-56", className)}
    >
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-3">
        {brand && <div className="min-w-0 truncate">{brand}</div>}
        {onCollapsedChange && (
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            size="sm"
            variant="ghost"
            leadingIcon={<ToggleIcon aria-hidden="true" className="size-4" />}
            onClick={() => onCollapsedChange(!collapsed)}
          />
        )}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label={label}>{children}</nav>
      {footer && <footer className="border-t border-border p-3">{footer}</footer>}
    </aside>
  );
});
