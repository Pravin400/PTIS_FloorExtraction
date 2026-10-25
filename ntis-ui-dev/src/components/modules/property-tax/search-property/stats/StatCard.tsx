"use client";

import React from "react";
import {
  CheckCircle2,
  ClipboardList,
  Database,
  FileCheck,
  FileText,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Button } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type {
  PropertyStatIconName,
  StatCardProps,
} from "@/types/property-search";

const ICONS: Record<PropertyStatIconName, React.ElementType> = {
  "register-property": FileText,
  "geo-sequencing": MapPin,
  survey: ClipboardList,
  "data-processing": Database,
  "quality-analysis": CheckCircle2,
  "assessment-completed": FileCheck,
};

export function StatCard({
  visual,
  count,
  index,
  selected,
  disabled,
  onClick,
}: StatCardProps) {
  const t = useTranslations("propertySearch.stats");
  const Icon = ICONS[visual.iconName];
  const displayLabel = t(visual.i18nKey);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-pressed={selected}
      title={
        selected
          ? `${displayLabel} — ${t("activeFilter")}`
          : `${displayLabel} — ${t("filterHint")}`
      }
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        "group relative !flex !h-auto min-h-[84px] w-full min-w-0 cursor-pointer flex-row items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left shadow-sm",
        "bg-gradient-to-br transition-all duration-300 ease-out",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        "motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-xl",
        "motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
        "hover:!bg-transparent !justify-start !font-normal [&>span]:contents",
        disabled &&
          "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-md",
        selected
          ? [
              "z-[1] -translate-y-0.5 border-transparent text-white shadow-lg ring-2 ring-offset-1",
              visual.activeGradient,
              visual.activeRing,
            ]
          : [
              visual.idleGradient,
              visual.idleBorder,
              visual.hoverShadow,
              "hover:border-opacity-100 hover:brightness-[1.02]",
            ]
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]"
        aria-hidden
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      </span>

      {selected && (
        <>
          <span
            className={cn(
              "absolute bottom-0 left-0 top-0 w-1.5 rounded-l-[10px]",
              visual.activeBar
            )}
            aria-hidden
          />
          <Badge
            variant="default"
            size="sm"
            className="absolute right-1.5 top-1.5 z-[2] rounded-md border border-white/30 bg-white/20 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            {t("activeFilter")}
          </Badge>
        </>
      )}

      <span
        className={cn(
          "relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-all duration-300",
          visual.iconBg,
          selected
            ? "scale-110 bg-white/25 ring-2 ring-white/40"
            : "group-hover:scale-110 group-hover:-rotate-6 motion-safe:group-hover:shadow-xl"
        )}
      >
        <Icon
          className={cn(
            "h-[22px] w-[22px]",
            selected ? "text-white" : visual.iconColor
          )}
        />
      </span>

      <span className="relative z-[1] min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[11px] font-bold uppercase leading-tight tracking-wide transition-colors duration-200",
            selected ? "text-white/90" : visual.idleLabel
          )}
        >
          {displayLabel}
        </span>
        <span
          className={cn(
            "mt-1 block text-xl font-extrabold leading-tight tabular-nums transition-all duration-300",
            selected ? "text-white drop-shadow-sm" : visual.idleCount,
            !selected && "group-hover:scale-105"
          )}
        >
          {count}
        </span>
      </span>
    </Button>
  );
}
