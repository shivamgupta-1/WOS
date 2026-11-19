import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type TableSortDirection = "asc" | "desc";
export type TableSortValue = string | number | Date | null | undefined;

export interface TableSort {
  id: string;
  direction: TableSortDirection;
}

export interface TableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  sortLabel?: string;
  sortValue?: (row: Row) => TableSortValue;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => string | number;
  caption: string;
  emptyState?: ReactNode;
  initialSort?: TableSort;
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort) => void;
  className?: string;
  dense?: boolean;
}

function compareValues(left: TableSortValue, right: TableSortValue) {
  if (left == null) return right == null ? 0 : -1;
  if (right == null) return 1;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

const alignment: Record<NonNullable<TableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyState = "No results.",
  initialSort,
  sort,
  onSortChange,
  className,
  dense = true,
}: TableProps<Row>) {
  const [uncontrolledSort, setUncontrolledSort] = useState<TableSort | null>(initialSort ?? null);
  const activeSort = sort === undefined ? uncontrolledSort : sort;
  const sortedRows = useMemo(() => {
    const column = columns.find((item) => item.id === activeSort?.id);
    if (!column?.sortValue || !activeSort) return rows;
    const direction = activeSort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => direction * compareValues(column.sortValue?.(a), column.sortValue?.(b)));
  }, [activeSort, columns, rows]);

  function changeSort(column: TableColumn<Row>) {
    if (!column.sortValue) return;
    const next: TableSort = {
      id: column.id,
      direction: activeSort?.id === column.id && activeSort.direction === "asc" ? "desc" : "asc",
    };
    if (sort === undefined) setUncontrolledSort(next);
    onSortChange?.(next);
  }

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className="w-full border-collapse text-13">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface-muted text-12 font-medium text-foreground-secondary">
          <tr>
            {columns.map((column) => {
              const sortDirection = activeSort?.id === column.id ? activeSort.direction : null;
              const ariaSort = !column.sortValue ? undefined : sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none";
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn("whitespace-nowrap border-b border-border px-3 text-left font-medium", dense ? "h-9" : "h-11", alignment[column.align ?? "left"], column.className)}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => changeSort(column)}
                      className="inline-flex items-center gap-1.5 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                      aria-label={`Sort by ${column.sortLabel ?? column.id}`}
                    >
                      {column.header}
                      {sortDirection === "asc"
                        ? <ArrowUp aria-hidden="true" className="size-3.5" />
                        : sortDirection === "desc"
                          ? <ArrowDown aria-hidden="true" className="size-3.5" />
                          : <ArrowUpDown aria-hidden="true" className="size-3.5" />}
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedRows.length === 0 ? (
            <tr><td className="px-3 py-8 text-center text-foreground-secondary" colSpan={columns.length}>{emptyState}</td></tr>
          ) : sortedRows.map((row, index) => (
            <tr key={getRowKey(row, index)} className="h-10 text-foreground-primary hover:bg-surface-muted">
              {columns.map((column) => (
                <td key={column.id} className={cn("px-3", dense ? "py-2" : "py-3", alignment[column.align ?? "left"], column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
