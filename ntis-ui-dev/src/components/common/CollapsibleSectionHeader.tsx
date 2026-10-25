"use client";

import { ChevronUp, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CollapsibleSectionHeaderProps {
  /** Title text to display */
  title: string;
  /** Icon component to show before the title */
  icon?: LucideIcon;
  /** Whether the section is currently open */
  isOpen: boolean;
  /** Callback when the header is clicked to toggle */
  onToggle: () => void;
  /** Optional className for the button */
  className?: string;
  /** Variant style for different themes */
  variant?: "primary" | "secondary" | "outline";
}

/**
 * CollapsibleSectionHeader
 * 
 * A reusable header button for collapsible sections with icon, title, and chevron indicator.
 * 
 * @example
 * ```tsx
 * <CollapsibleSectionHeader
 *   title="Basic Information"
 *   icon={User}
 *   isOpen={isBasicInfoOpen}
 *   onToggle={toggleBasicInfo}
 * />
 * ```
 */
export function CollapsibleSectionHeader({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  className,
  variant = "primary",
}: CollapsibleSectionHeaderProps) {
  const variantStyles = {
    primary: "bg-blue-600 text-gray-100 hover:bg-blue-700",
    secondary: "bg-gray-600 text-gray-100 hover:bg-gray-700",
    outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full px-4 py-3 flex items-center justify-between transition",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        <span className="font-semibold text-sm">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-5 h-5" />
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </button>
  );
}

CollapsibleSectionHeader.displayName = "CollapsibleSectionHeader";
