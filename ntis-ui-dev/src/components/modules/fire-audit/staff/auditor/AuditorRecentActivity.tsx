"use client";

/**
 * Auditor Recent Activity Feed Component
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorRecentActivity.tsx
 *
 * Activity drawer, sidebar, and floating popover with live feed and period filtering.
 * Line ceiling: <= 300 lines.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AuditorRecentActivityItem } from "@/types/fire-audit/auditor.types";
import { Button, Card, Badge } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { Radio, Clock, X, ExternalLink, RotateCw } from "lucide-react";
import { AuditorActivityItem } from "./AuditorActivityItem";
import { isToday, isThisWeek } from "@/lib/utils/fire-audit/date-utils";

export interface AuditorRecentActivityProps {
  activities?: AuditorRecentActivityItem[];
  isOpen?: boolean;
  onClose: () => void;
  onViewAll?: () => void;
  onRefresh?: () => void | Promise<void>;
  isMobilePopover?: boolean;
  isFullColumn?: boolean;
  className?: string;
}

export function AuditorRecentActivity({
  activities = [],
  isOpen = true,
  onClose,
  onViewAll,
  onRefresh,
  isMobilePopover = false,
  isFullColumn = false,
  className,
}: AuditorRecentActivityProps) {
  const t = useTranslations("fireAudit.auditorDashboard.activity");
  const [activeTab, setActiveTab] = useState<"all" | "today" | "week">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter activities based on tab
  const todayActivities = activities.filter((act) =>
    isToday(act.createdAt || act.timestamp)
  );

  const weekActivities = activities.filter((act) =>
    isThisWeek(act.createdAt || act.timestamp)
  );

  const filteredActivities =
    activeTab === "today"
      ? todayActivities
      : activeTab === "week"
        ? weekActivities
        : activities;

  // 1. Mobile Floating Popover (< sm / < lg)
  if (isMobilePopover) {
    return (
      <Card
        padding="none"
        className="w-full max-w-[300px] rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Popover Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <span className="text-xs font-bold text-slate-800">
            {t("title")}
          </span>
          <Badge
            variant="success"
            size="sm"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 h-auto"
          >
            <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-600" />
            {t("liveFeed")}
          </Badge>
        </div>

        {/* Popover Items / Empty */}
        <div className="max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
          {activities.length === 0 ? (
            <Card
              padding="none"
              className="flex flex-col items-center justify-center py-7 px-3 text-center rounded-xl border border-slate-100 bg-slate-50/50 shadow-none"
            >
              <div className="rounded-full bg-sky-50 p-2.5 text-sky-500 mb-2 inline-flex items-center justify-center">
                <Clock className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-snug max-w-[200px]">
                {t("noActivity")}
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {activities.map((act) => (
                <AuditorActivityItem key={act.id} activity={act} isPopover />
              ))}
            </div>
          )}
        </div>

        {/* "View All Activity" Button -> Opens Vertical Column */}
        <Button
          variant="outline"
          size="sm"
          icon={ExternalLink}
          iconPosition="right"
          onClick={onViewAll}
          className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/70 py-2.5 px-3 text-xs font-semibold text-[#1A86E8] hover:bg-sky-100/80 transition-colors cursor-pointer h-auto"
        >
          {t("viewAllActivity")}
        </Button>
      </Card>
    );
  }

  // 2. Full Vertical Column Layout - Used for both Mobile Drawer & Desktop Sidebar
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-50/70",
        isFullColumn
          ? "w-full"
          : "w-80 shrink-0 border-l border-slate-200 min-h-screen p-4",
        className
      )}
    >
      {/* Top Filter Tabs & Close Button */}
      <div className="flex items-center justify-between gap-1.5 pb-2">
        <div role="tablist" aria-label={t("title")} className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: "all" as const, label: t("tabAll", { count: activities.length }) },
              { id: "today" as const, label: t("tabToday", { count: todayActivities.length }) },
              { id: "week" as const, label: t("tabThisWeek", { count: weekActivities.length }) },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                variant={isActive ? "primary" : "outline"}
                size="xs"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all h-auto cursor-pointer",
                  isActive
                    ? "bg-[#153746] hover:bg-[#0f2834] text-white border-transparent shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                )}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="xs"
          icon={X}
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors h-auto w-auto cursor-pointer"
          aria-label={t("close")}
        />
      </div>

      {/* Central Content Area (Card or List) */}
      <div className="flex-1 flex flex-col my-2">
        {filteredActivities.length === 0 ? (
          <Card
            padding="none"
            className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xs"
          >
            <div className="rounded-full bg-sky-50 p-4 text-[#1A86E8] mb-4 inline-flex items-center justify-center">
              <Clock className="h-8 w-8 stroke-[1.5]" />
            </div>
            <p className="text-base font-bold text-slate-900 leading-snug">
              {t("noActivity")}
            </p>
            <p className="text-xs text-slate-500 max-w-[260px] mt-2 leading-relaxed">
              {t("noActivityDesc")}
            </p>
          </Card>
        ) : (
          <Card
            padding="none"
            className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3 overflow-y-auto space-y-2 shadow-2xs"
          >
            {filteredActivities.map((act) => (
              <AuditorActivityItem key={act.id} activity={act} />
            ))}
          </Card>
        )}
      </div>

      {/* Bottom Refresh Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          icon={RotateCw}
          onClick={handleRefresh}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl bg-[#153746] hover:bg-[#0f2834] border-transparent py-3 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer",
            isRefreshing && "[&_svg]:animate-spin"
          )}
        >
          {t("refresh")}
        </Button>
      </div>
    </aside>
  );
}
