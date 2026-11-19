import { ChevronRight } from "lucide-react";
import { cn } from "./cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  label?: string;
}

export function Breadcrumbs({ items, className, label = "Breadcrumb" }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-13">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-foreground-tertiary" />}
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined} className={cn("truncate", current ? "font-medium text-foreground-primary" : "text-foreground-secondary")}>
                  {item.label}
                </span>
              ) : (
                <a className="truncate text-foreground-secondary hover:text-foreground-primary" href={item.href}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
