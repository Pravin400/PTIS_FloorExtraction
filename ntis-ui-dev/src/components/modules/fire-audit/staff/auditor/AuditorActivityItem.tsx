/**
 * Auditor Activity Item Component
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorActivityItem.tsx
 *
 * Renders individual activity feed item with dynamic icon badge.
 * Line ceiling: <= 300 lines.
 */

import { FileText, UserCheck, Calendar, ChevronRight } from "lucide-react";
import type { AuditorRecentActivityItem } from "@/types/fire-audit/auditor.types";
import { cn } from "@/lib/utils/cn";

export interface AuditorActivityItemProps {
  activity: AuditorRecentActivityItem;
  onClick?: () => void;
  className?: string;
  isPopover?: boolean;
}

export function getActivityIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("new") || lower.includes("application")) {
    return {
      icon: FileText,
      bg: "bg-sky-50",
      color: "text-sky-600",
    };
  }
  if (
    lower.includes("scrutiny") ||
    lower.includes("assigned") ||
    lower.includes("verification")
  ) {
    return {
      icon: UserCheck,
      bg: "bg-amber-50",
      color: "text-amber-600",
    };
  }
  if (
    lower.includes("survey") ||
    lower.includes("schedule") ||
    lower.includes("inspection")
  ) {
    return {
      icon: Calendar,
      bg: "bg-blue-50",
      color: "text-blue-600",
    };
  }
  return {
    icon: FileText,
    bg: "bg-slate-50",
    color: "text-slate-600",
  };
}

export function AuditorActivityItem({
  activity,
  onClick,
  className,
  isPopover = false,
}: AuditorActivityItemProps) {
  const itemStyle = getActivityIcon(activity.title);
  const Icon = itemStyle.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors cursor-pointer group",
        !isPopover && "border border-slate-100",
        className
      )}
    >
      <div className={cn("rounded-xl p-2 shrink-0", itemStyle.bg, itemStyle.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800 leading-tight">
          {activity.title}
        </p>
        <p className="truncate text-[11px] font-medium text-slate-500 mt-0.5">
          {activity.building}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{activity.timestamp}</p>
      </div>
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 text-slate-300 transition-all shrink-0",
          isPopover && "group-hover:text-slate-500 group-hover:translate-x-0.5"
        )}
      />
    </div>
  );
}
