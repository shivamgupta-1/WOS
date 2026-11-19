import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  leading?: ReactNode;
  navigation?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
}

export function Topbar({ leading, navigation, search, actions, children, className, ...props }: TopbarProps) {
  return (
    <header
      {...props}
      className={cn("sticky top-0 z-30 flex min-h-14 items-center gap-4 border-b border-border bg-surface px-4", className)}
    >
      {leading && <div className="app-topbar-leading shrink-0">{leading}</div>}
      {navigation && <div className="app-topbar-navigation min-w-0">{navigation}</div>}
      <div className="app-topbar-content flex min-w-0 flex-1 items-center gap-4">
        {search && <div className="app-topbar-search-slot min-w-0 flex-1">{search}</div>}
        {children}
      </div>
      {actions && <div className="app-topbar-actions flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
