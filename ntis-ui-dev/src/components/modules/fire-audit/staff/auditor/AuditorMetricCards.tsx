"use client";

/**
 * Auditor Metric Cards Component
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorMetricCards.tsx
 *
 * KPI summary cards row with accessible mobile swipe carousel and semantic buttons.
 * Line ceiling: <= 300 lines.
 */

import { useState, useRef, useMemo, memo } from "react";
import { useTranslations } from "next-intl";
import {
  AUDITOR_APPLICATION_STATUSES,
  STATUS_META,
  type AuditorApplicationStatus,
  type AuditorDashboardStats,
  type AuditorDashboardStatsKey,
} from "@/types/fire-audit/auditor.types";
import { Card } from "@/components/common";
import { cn } from "@/lib/utils/cn";

export interface AuditorMetricCardsProps {
  stats: AuditorDashboardStats;
  activeStatus?: string;
  onSelectStatus?: (status: string) => void;
  className?: string;
}

/**
 * Mobile carousel card width for horizontal snap scrolling.
 */
const MOBILE_CARD_WIDTH_PX = 148;

interface StaticMetricCardConfig {
  id: AuditorDashboardStatsKey;
  statusValue: AuditorApplicationStatus;
  titleKey: string;
  labelKey: string;
  iconColor: string;
  badgeBg: string;
  topBorderColor: string;
}

/**
 * Module-level static card definitions to prevent rebuilding on every render.
 */
const STATIC_METRIC_CARDS: readonly StaticMetricCardConfig[] =
  AUDITOR_APPLICATION_STATUSES.map((status) => {
    const meta = STATUS_META[status];
    return {
      id: meta.statKey,
      statusValue: status,
      titleKey: meta.titleKey,
      labelKey: meta.labelKey,
      iconColor: meta.iconColor,
      badgeBg: meta.badgeBg,
      topBorderColor: meta.topBorderColor,
    };
  });

function AuditorMetricCardsComponent({
  stats,
  activeStatus = "",
  onSelectStatus,
  className,
}: AuditorMetricCardsProps) {
  const t = useTranslations("fireAudit.auditorDashboard.stats");
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize dynamic card properties (translated title/label and live count)
  const cards = useMemo(
    () =>
      STATIC_METRIC_CARDS.map((cfg) => {
        const meta = STATUS_META[cfg.statusValue];
        return {
          ...cfg,
          title: t(cfg.titleKey),
          label: t(cfg.labelKey),
          count: stats[cfg.id] ?? 0,
          icon: meta.icon,
        };
      }),
    [stats, t]
  );

  const handleScroll = () => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.firstElementChild as HTMLElement | null;
      const stepWidth = firstChild?.offsetWidth || MOBILE_CARD_WIDTH_PX;
      const scrollLeft = scrollRef.current.scrollLeft;
      const index = Math.round(scrollLeft / stepWidth);
      setActiveSlide(Math.min(Math.max(index, 0), cards.length - 1));
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.firstElementChild as HTMLElement | null;
      const stepWidth = firstChild?.offsetWidth || MOBILE_CARD_WIDTH_PX;
      if (typeof scrollRef.current.scrollTo === "function") {
        scrollRef.current.scrollTo({
          left: index * stepWidth,
          behavior: "smooth",
        });
      } else {
        scrollRef.current.scrollLeft = index * stepWidth;
      }
      setActiveSlide(index);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal Swipe Carousel on Mobile (<sm) | 3-col on Tablet | 6-col on Desktop (>=lg) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex sm:grid gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory sm:snap-none scrollbar-none no-scrollbar sm:grid-cols-3 lg:grid-cols-6"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = Boolean(activeStatus && activeStatus === card.statusValue);

          return (
            <Card
              key={card.id}
              role="button"
              tabIndex={0}
              padding="none"
              aria-pressed={isSelected ? "true" : "false"}
              aria-label={`${card.title}: ${card.count} ${card.label}`}
              onClick={() => onSelectStatus?.(card.statusValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStatus?.(card.statusValue);
                }
              }}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl bg-white p-3 text-left transition-all duration-200 snap-center shrink-0 w-[148px] sm:w-auto border border-slate-200/80 border-t-[3.5px] focus:outline-none focus:ring-2 focus:ring-sky-500",
                onSelectStatus ? "cursor-pointer" : "cursor-default",
                card.topBorderColor,
                isSelected
                  ? "ring-2 ring-[#0284c7]/20 border-x-[#0284c7] border-b-[#0284c7] shadow-xs"
                  : onSelectStatus
                    ? "hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] shadow-2xs"
                    : "shadow-2xs"
              )}
            >
              {/* Top row: Status Tag (left) + Icon Badge (right) */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase truncate pr-1">
                  {card.title}
                </span>
                <div className={cn("rounded-lg p-1.5 shrink-0", card.badgeBg)}>
                  <Icon className={cn("h-3.5 w-3.5", card.iconColor)} aria-hidden />
                </div>
              </div>

              {/* Middle: Big Bold Count */}
              <div className="mt-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {card.count}
                </span>
              </div>

              {/* Bottom: Subtitle description */}
              <div className="mt-1 w-full">
                <p className="text-[11px] font-medium text-slate-500 truncate" title={card.label}>
                  {card.label}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dynamic Pagination Dots (Mobile Only) */}
      <div
        role="tablist"
        aria-label={t("title")}
        className="flex sm:hidden justify-center items-center gap-1.5 mt-2.5"
      >
        {cards.map((card, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "true" : undefined}
              aria-pressed={isActive}
              aria-label={`${card.title}: ${card.count}`}
              onClick={() => scrollToCard(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-400",
                isActive ? "w-4 bg-[#1A86E8]" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export const AuditorMetricCards = memo(AuditorMetricCardsComponent);
