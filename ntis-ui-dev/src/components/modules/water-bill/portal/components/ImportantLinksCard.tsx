"use client";

import { useState } from "react";
import { ChevronDown, FileText, Link2 } from "lucide-react";

import { CONTENT_ICONS } from "../constants";
import { formatTranslation, PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalSectionProps } from "@/types/water-bill/portal.types";
import type { PortalContentItem } from "@/types/water-bill/portalContent.types";

export interface ImportantLinksCardProps extends PortalSectionProps {
  links: PortalContentItem[];
}

const DEFAULT_VISIBLE_COUNT = 6;

export default function ImportantLinksCard({ config, t, links }: ImportantLinksCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!config.sectionSettings.showImportantLinks || links.length === 0) return null;

  const hasMore = links.length > DEFAULT_VISIBLE_COUNT;
  const visible = expanded ? links : links.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="flex items-center gap-2 font-bold text-[var(--portal-primary)]">
          <Link2 className="h-4 w-4" />
          {t(config.sectionSettings.importantLinksTitle, config.sectionSettings.importantLinksTitle)}
        </h3>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-sm font-medium text-[var(--portal-primary)] hover:underline"
          >
            {expanded
              ? t(PORTAL_EN.importantLinks.showLess, PORTAL_MR.importantLinks.showLess)
              : t(
                  formatTranslation(PORTAL_EN.importantLinks.viewAll, { count: links.length }),
                  formatTranslation(PORTAL_MR.importantLinks.viewAll, { count: links.length })
                )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 p-5">
        {visible.map((link) => {
          const Icon = (link.iconName && CONTENT_ICONS[link.iconName]) || FileText;
          return (
            <a
              key={link.id}
              href={link.referenceLink || "#"}
              target={link.openInNewTab ? "_blank" : undefined}
              rel={link.openInNewTab ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2.5 rounded-lg bg-blue-50 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-100 transition"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className="h-4 w-4 text-[var(--portal-primary)]" />
              </span>
              {t(link.title, link.titleLocal || link.title)}
            </a>
          );
        })}
      </div>
    </div>
  );
}
