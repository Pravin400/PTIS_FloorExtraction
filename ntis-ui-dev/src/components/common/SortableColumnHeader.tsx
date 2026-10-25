"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SortDirection = "asc" | "desc" | null;

export interface SortableColumnHeaderProps {
  /** Column label text */
  label: string;
  /** Current sort direction (null = unsorted) */
  sortDirection?: SortDirection;
  /** Callback when clicked to toggle sort */
  onSort?: () => void;
  /** Whether sorting is enabled for this column */
  sortable?: boolean;
  /** Optional className */
  className?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** "box" (default) is a grey button; "plain" has no box and takes the colour of the table header it sits in */
  variant?: "box" | "plain";
}

/**
 * SortableColumnHeader
 * 
 * A reusable button for table column headers with optional sort indicator.
 * 
 * @example
 * ```tsx
 * <SortableColumnHeader
 *   label="Floor"
 *   sortDirection={sortConfig.floor}
 *   onSort={() => handleSort("floor")}
 * />
 * ```
 */
export function SortableColumnHeader({
  label,
  sortDirection,
  onSort,
  sortable = true,
  className,
  size = "xs",
  variant = "box",
}: SortableColumnHeaderProps) {
  const sizeStyles = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  if (!sortable) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold whitespace-nowrap text-gray-700",
          sizeStyles[size],
          className
        )}
      >
        {label}
      </span>
    );
  }

  // Determine which icon to render based on sort direction
  let IconComponent: LucideIcon;
  if (sortDirection === "asc") {
    IconComponent = ArrowUp;
  } else if (sortDirection === "desc") {
    IconComponent = ArrowDown;
  } else {
    IconComponent = ArrowUpDown;
  }

  return (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "inline-flex items-center gap-1 font-semibold whitespace-nowrap",
        variant === "plain"
          ? "rounded cursor-pointer uppercase tracking-wider hover:opacity-75 focus:outline-none focus-visible:ring-1 focus-visible:ring-current"
          : "bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500",
        variant === "box" && sizeStyles[size],
        className
      )}
    >
      {label}
      <IconComponent className={cn(iconSizes[size], variant === "plain" ? (sortDirection ? "opacity-100" : "opacity-35") : "text-gray-500")} />
    </button>
  );
}

SortableColumnHeader.displayName = "SortableColumnHeader";
