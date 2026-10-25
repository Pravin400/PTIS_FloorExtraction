"use client";
import React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  Download,
  Share,
  Save,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  Check,
  Eraser,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Eye,
  EyeOff,
  FileSpreadsheet,
  History,
  Play,
  Lock,
  Unlock,
  Search,
  Settings,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button, type ButtonProps } from "./ActionButton";
import { cn } from "@/lib/utils/cn";

/* ----------------------------------------------------------
   SHARED PROPS
---------------------------------------------------------- */

export type LabeledActionButtonProps = Omit<
  ButtonProps,
  "icon" | "variant"
> & {
  label?: string;
};

export type IconOnlyButtonProps = Omit<
  ButtonProps,
  "children" | "icon"
> & {
  icon: React.ElementType;
  variant?: "primary" | "danger";
};

export type PageNumberButtonProps = {
  page: number;
  active?: boolean;
  onClick?: () => void;
};

// TabButton: for tab-like navigation with icon and label
export interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

// IconOnlyActionButton: Fully customizable icon-only button
export interface IconOnlyActionButtonProps extends Omit<ButtonProps, "children"> {
  icon: React.ElementType;
  "aria-label": string;
}

export type SortButtonProps = {
  label: string;
};

export type ExportButtonProps = {
  isExporting: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
};

export type EyeIconButtonProps = {
  isAutoScrolling: boolean;
  onClick: () => void;
  startTitle: string;
  stopTitle: string;
};

/* ----------------------------------------------------------
   LABELED ACTION BUTTONS
---------------------------------------------------------- */

export function AddButton({
  label = "Add",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={Plus} {...props}>
      {label}
    </Button>
  );
}
export function UpdateButton({
  label = "Update",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={RefreshCw} {...props}>
      {label}
    </Button>
  );
}

export function ConfigureButton({
  label = "Configure",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={Settings} {...props}>
      {label}
    </Button>
  );
}

export function ApplyButton({
  label = "Apply",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="success" icon={Check} {...props}>
      {label}
    </Button>
  );
}

export function LockButton({
  label = "Lock",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="danger" icon={Lock} {...props}>
      {label}
    </Button>
  );
}

export function UnlockButton({
  label = "Unlock",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="success" icon={Unlock} {...props}>
      {label}
    </Button>
  );
}

export function ClearButton({
  label = "Clear",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="secondary" icon={Eraser} {...props}>
      {label}
    </Button>
  );
}

export function SelectAllButton({
  label = "Select All",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={CheckSquare} {...props}>
      {label}
    </Button>
  );
}
export function SaveButton({
  label = "Save",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="success" icon={Save} {...props}>
      {label}
    </Button>
  );
}

export function CancelButton({
  label = "Cancel",
  variant = "secondary",
  ...props
}: Omit<ButtonProps, "icon"> & { label?: string }): React.ReactElement {
  return (
    <Button variant={variant} icon={X} {...props}>
      {label}
    </Button>
  );
}

export function OkButton({
  label = "OK",
  icon = CheckCircle,
  variant = "success",
  ...props
}: Omit<ButtonProps, "icon"> & { label?: string; icon?: React.ElementType }): React.ReactElement {
  return (
    <Button variant={variant} icon={icon} {...props}>
      {label}
    </Button>
  );
}

export function RefreshButton({
  label = "Refresh",
  variant = "secondary",
  ...props
}: Omit<ButtonProps, "icon"> & { label?: string }): React.ReactElement {
  return (
    <Button variant={variant} icon={RefreshCw} {...props}>
      {label}
    </Button>
  );
}

export function UploadButton({
  label = "Upload",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={Upload} {...props}>
      {label}
    </Button>
  );
}

export function ExportButton({
  label = "Export",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="secondary" icon={Share} {...props}>
      {label}
    </Button>
  );
}

export function ImportButton({
  label = "Import",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="secondary" icon={Download} {...props}>
      {label}
    </Button>
  );
}

export function DownloadButton({
  label = "Download",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="secondary" icon={Download} {...props}>
      {label}
    </Button>
  );
}


export function EditLabelButton({
  label = "Edit",
  size = "sm",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="edit" icon={Pencil} size={size} {...props}>
      {label}
    </Button>
  );
}

export function DeleteLabelButton({
  label = "Delete",
  size = "sm",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="delete" icon={Trash2} size={size} {...props}>
      {label}
    </Button>
  );
}

/* ----------------------------------------------------------
   PREVIEW BUTTON
---------------------------------------------------------- */

export function PreviewButton({
  label = "Preview",
  variant = "primary",
  ...props
}: Omit<ButtonProps, "icon"> & { label?: string }): React.ReactElement {
  return (
    <Button variant={variant} icon={Eye} {...props}>
      {label}
    </Button>
  );
}

export function ShowHistoryButton({
  label = "Show History",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="secondary" icon={History} {...props}>
      {label}
    </Button>
  );
}

export function RetrospectiveDetailsButton({
  label = "Retrospective Details",
  size = "md",
  className = "",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={Clock}
      size={size}
      className={cn(
        "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-indigo-200 hover:bg-indigo-100",
        className
      )}
      {...props}
    >
      {label}
    </Button>
  );
}

export function Section129Button({
  label = "Section 129",
  size = "xs",
  className = "",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={ArrowUpRight}
      size={size}
      className={cn(
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        className
      )}
      {...props}
    >
      {label}
    </Button>
  );
}

export function SearchButton({
  label = "Search",
  ...props
}: LabeledActionButtonProps): React.ReactElement {
  return (
    <Button variant="primary" icon={Search} {...props}>
      {label}
    </Button>
  );
}

export function SortButton({
  label,
}: SortButtonProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      icon={ArrowUpDown}
      iconPosition="right"
      className="h-6 flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-gray-100 text-[11px] font-semibold text-gray-900 hover:bg-gray-200 pr-1.5"
    >
      <span className="truncate">{label}</span>
    </Button>
  );
}

export function ExportIconButton({
  isExporting,
  disabled = false,
  onClick,
  title,
}: ExportButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={cn(
        "p-2 rounded-md border transition-all duration-200 flex items-center justify-center min-w-[36px] h-[36px]",
        isExporting
          ? "bg-green-100 text-green-600 border-green-300 cursor-wait"
          : "bg-white text-green-600 border-gray-300 hover:border-green-500 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title={title}
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
    </button>
  );
}

export function EyeIconButton({
  onClick,
  startTitle,
  stopTitle,
  isAutoScrolling,
}: EyeIconButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "p-2 rounded-md border transition-all duration-200 flex items-center justify-center min-w-[36px] h-[36px]",
        isAutoScrolling
          ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md animate-pulse"
          : "bg-white text-gray-500 border-gray-300 hover:border-[#1E3A8A] hover:text-[#1E3A8A] hover:bg-gray-50"
      )}
      title={isAutoScrolling ? stopTitle : startTitle}
    >
      {isAutoScrolling ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

/* ----------------------------------------------------------
   ICON-ONLY ACTION BUTTON (FULLY CUSTOMIZABLE)
---------------------------------------------------------- */

/**
 * A fully customizable icon-only button component
 * 
 * @example
 * // Basic usage
 * <IconOnlyActionButton 
 *   icon={Pencil} 
 *   aria-label="Edit item" 
 *   onClick={() => console.log('Edit')}
 * />
 * 
 * @example
 * // With custom variant and size
 * <IconOnlyActionButton 
 *   icon={Trash2} 
 *   variant="delete"
 *   size="lg"
 *   aria-label="Delete item"
 * />
 * 
 * @example
 * // With custom className
 * <IconOnlyActionButton 
 *   icon={Save} 
 *   variant="success"
 *   size="md"
 *   className="rounded-full shadow-lg"
 *   aria-label="Save changes"
 * />
 */
export function IconOnlyActionButton({
  icon: Icon,
  variant = "secondary",
  size = "sm",
  "aria-label": ariaLabel,
  className = "",
  disabled = false,
  onClick,
  ...props
}: IconOnlyActionButtonProps): React.ReactElement {
  return (
    <Button
      variant={variant}
      icon={Icon}
      size={size}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center",
        className
      )}
      {...props}
    />
  );
}

/* ----------------------------------------------------------
   ICON-ONLY CRUD BUTTONS
---------------------------------------------------------- */

export function EditButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="edit"
      icon={Pencil}
      size="sm"
      aria-label={ariaLabel ?? "Edit"}
      {...props}
    />
  );
}

export function DeleteButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="delete"
      icon={Trash2}
      size="sm"
      aria-label={ariaLabel ?? "Delete"}
      {...props}
    />
  );
}

export function ExecuteTestButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="edit"
      icon={Play}
      size="sm"
      aria-label={ariaLabel ?? "Test/Execute"}
      className={cn(
        "text-indigo-600 hover:bg-indigo-50 border-indigo-400 focus:ring-indigo-300",
        className
      )}
      {...props}
    />
  );
}

export function ViewButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={Eye}
      size="sm"
      aria-label={ariaLabel ?? "View"}
      className={cn(
        "text-blue-600 hover:bg-blue-50 border-blue-400 focus:ring-blue-300",
        className
      )}
      {...props}
    />
  );
}


export function DownloadIconButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={Download}
      size="sm"
      aria-label={ariaLabel ?? "Download"}
      className={cn(
        "text-green-600 hover:bg-green-50 border-green-400 focus:ring-green-300",
        className
      )}
      {...props}
    />
  );
}

export function CloseIconButton({
  title = "Close",
  onClick,
  className = "",
  size = 18,
}: {
  title?: string;
  onClick?: () => void;
  className?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 shadow-sm ${className}`}
      style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10 }}
    >
      <X size={size} />
    </button>
  );
}
/* ----------------------------------------------------------
   PAGINATION BUTTONS
---------------------------------------------------------- */

export function FirstPageButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={ChevronsLeft}
      size="sm"
      aria-label={ariaLabel ?? "Go to first page"}
      {...props}
    />
  );
}

export function PrevPageButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={ChevronLeft}
      size="sm"
      aria-label={ariaLabel ?? "Go to previous page"}
      {...props}
    />
  );
}

export function NextPageButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={ChevronRight}
      size="sm"
      aria-label={ariaLabel ?? "Go to next page"}
      {...props}
    />
  );
}

export function LastPageButton(
  { ["aria-label"]: ariaLabel, ...props }: Omit<ButtonProps, "icon" | "variant">
): React.ReactElement {
  return (
    <Button
      variant="secondary"
      icon={ChevronsRight}
      size="sm"
      aria-label={ariaLabel ?? "Go to last page"}
      {...props}
    />
  );
}
/* ----------------------------------------------------------
   ICON-ONLY FANCY BUTTON
---------------------------------------------------------- */

export function IconButton({
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}: IconOnlyButtonProps): React.ReactElement {
  const gradientClass =
    variant === "danger"
      ? "bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 hover:shadow-red-300/50"
      : "bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 hover:shadow-cyan-300/50";

  return (
    <button
      className={cn(
        "group relative h-8 w-8 rounded-lg inline-flex items-center justify-center text-white overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50",
        gradientClass,
        className
      )}
      {...props}
    >
      <Icon className="w-4 h-4 transition-transform group-hover:rotate-12" />
    </button>
  );
}

/* ----------------------------------------------------------
   PAGE NUMBER BUTTON
---------------------------------------------------------- */

export function PageNumberButton({
  page,
  active = false,
  onClick,
}: PageNumberButtonProps): React.ReactElement {
  return (
    <Button
      size="sm"
      onClick={onClick}
      variant={active ? "primary" : "secondary"}
      className={cn(
        "min-w-9 px-3 text-sm font-medium",
        active
          ? "bg-[#2563EB] text-white border border-[#2563EB]"
          : "bg-white border border-[#DCEAFF] text-[#1E3A8A] hover:bg-gray-50"
      )}
      aria-label={`Go to page ${page}`}
    >
      {page}
    </Button>
  );
}

/* ----------------------------------------------------------
   ICON-ONLY SORT BUTTONS
---------------------------------------------------------- */

export function SortAscButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant" | "children">
): React.ReactElement {
  return (
    <Button
      variant="ghost"
      icon={ArrowUp}
      size="sm"
      aria-label={ariaLabel ?? "Sort ascending"}
      className={cn("hover:bg-transparent hover:text-blue-600 focus:!ring-0 focus:!ring-offset-0", className)}
      {...props}
    />
  );
}

export function SortDescButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant" | "children">
): React.ReactElement {
  return (
    <Button
      variant="ghost"
      icon={ArrowDown}
      size="sm"
      aria-label={ariaLabel ?? "Sort descending"}
      className={cn("hover:bg-transparent hover:text-blue-600 focus:ring-0! focus:ring-offset-0!", className)}
      {...props}
    />
  );
}

export function SortDefaultButton(
  { ["aria-label"]: ariaLabel, className = "", ...props }: Omit<ButtonProps, "icon" | "variant" | "children">
): React.ReactElement {
  return (
    <Button
      variant="ghost"
      icon={ArrowUpDown}
      size="sm"
      aria-label={ariaLabel ?? "Sort"}
      className={cn("hover:bg-transparent hover:text-blue-600 focus:ring-0! focus:ring-offset-0!", className)}
      {...props}
    />
  );
}

//Tab like button with icon and label, used for navigation between sections
export function TabButton({ icon: Icon, label, active, className = "", ...props }: TabButtonProps) {
  return (
    <button
      type="button"
      className={
        `w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-all ` +
        (active
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        ) +
        ` ${className}`
      }
      {...props}
    >
      <Icon size={18} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
/* ----------------------------------------------------------
   BADGE LIST BUTTON
---------------------------------------------------------- */

export type BadgeListButtonProps = {
  /** Array of items to display as badges */
  items: string[];
  /** Maximum number of badges to display before showing "+N" (default: 3) */
  maxVisible?: number;
  /** Click handler for the button */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Title attribute for the button */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** CSS class for individual badge items */
  badgeClassName?: string;
  /** CSS class for the overflow count badge */
  overflowBadgeClassName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Aria label for accessibility */
  "aria-label"?: string;
};

/**
 * A button that displays a list of badges with an overflow count.
 * Useful for showing multiple tags/codes in a compact format.
 */
export function BadgeListButton({
  items,
  maxVisible = 3,
  onClick,
  title,
  className = "",
  badgeClassName = "",
  overflowBadgeClassName = "",
  disabled = false,
  "aria-label": ariaLabel,
}: BadgeListButtonProps): React.ReactElement {
  const displayItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onClick && !disabled) {
      onClick(e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex flex-wrap gap-1 items-center cursor-pointer hover:opacity-80 transition-opacity",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {displayItems.map((item, idx) => (
        <span
          key={idx}
          className={cn(
            "px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold",
            badgeClassName
          )}
        >
          {item}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            "px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium",
            overflowBadgeClassName
          )}
        >
          +{remainingCount}
        </span>
      )}
    </button>
  );
}
