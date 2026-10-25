"use client";

import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";

import { formatTranslation, PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalAnnouncementItem, PortalSectionProps } from "@/types/water-bill/portal.types";

export interface AnnouncementsCardProps extends PortalSectionProps {
  announcements: PortalAnnouncementItem[];
}

const DEFAULT_VISIBLE_COUNT = 4;

export default function AnnouncementsCard({ config, t, announcements }: AnnouncementsCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!config.sectionSettings.showAnnouncements) return null;

  const hasMore = announcements.length > DEFAULT_VISIBLE_COUNT;
  const visible = expanded ? announcements : announcements.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="flex items-center gap-2 font-bold text-[var(--portal-primary)]">
          <Bell className="h-4 w-4 fill-[var(--portal-primary)] text-[var(--portal-primary)]" />
          {t(config.sectionSettings.announcementsTitle, config.sectionSettings.announcementsTitle)}
        </h3>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-sm font-medium text-[var(--portal-primary)] hover:underline"
          >
            {expanded
              ? t(PORTAL_EN.announcements.showLess, PORTAL_MR.announcements.showLess)
              : t(
                  formatTranslation(PORTAL_EN.announcements.viewAll, { count: announcements.length }),
                  formatTranslation(PORTAL_MR.announcements.viewAll, { count: announcements.length })
                )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <ul className="divide-y divide-gray-100">
        {visible.map((a, idx) => (
          <li key={idx} className="flex gap-3 px-5 py-3">
            <div className="shrink-0 w-14 h-fit rounded-md bg-blue-50 py-1.5 text-center">
              <p className="text-base font-bold text-gray-700 leading-none">{a.date}</p>
              <p className="mt-1 text-[10px] text-gray-500">{a.month}</p>
            </div>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--portal-primary)]">
                {a.title}
                {a.isNew && (
                  <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t(PORTAL_EN.announcements.new, PORTAL_MR.announcements.new)}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{a.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
