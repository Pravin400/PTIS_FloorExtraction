"use client";

import { useMemo, useState } from "react";

import type { CitizenServiceItem } from "@/types/water-bill/citizenService.types";
import type { PortalConfigJson } from "@/types/water-bill/portalConfig.types";
import type { PortalContentGrouped } from "@/types/water-bill/portalContent.types";
import {
  AnnouncementsCard,
  CitizenServicesGrid,
  ImportantLinksCard,
  PortalFooter,
  PortalHeader,
  PortalHero,
  UpdatesTicker,
} from "./components";
import type { PortalAnnouncementItem, PortalLanguage, PortalUpdateItem } from "@/types/water-bill/portal.types";

export interface PortalProps {
  config: PortalConfigJson;
  content: PortalContentGrouped;
  citizenServices: CitizenServiceItem[];
}

function formatAnnouncementDate(isoDate: string | null): { date: string; month: string } {
  if (!isoDate) return { date: "--", month: "" };

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return { date: "--", month: "" };

  return {
    date: parsed.toLocaleDateString("en-US", { day: "2-digit" }),
    month: parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  };
}

export default function Portal({ config, content, citizenServices }: PortalProps) {
  const [lang, setLang] = useState<PortalLanguage>(
    (config.portal.defaultLanguage as PortalLanguage) || "en"
  );

  const t = (en: string, local: string) => (lang === "mr" ? local : en);

  const updates: PortalUpdateItem[] = useMemo(
    () =>
      content.updates.map((item) => ({
        tag: item.badge ? t(item.badge, item.badge) : "",
        text: t(item.title, item.titleLocal || item.title),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content.updates, lang]
  );

  const announcements: PortalAnnouncementItem[] = useMemo(
    () =>
      content.announcements.map((item) => {
        const { date, month } = formatAnnouncementDate(item.publishFromDate ?? item.createdDate);
        return {
          date,
          month,
          isNew: Boolean(item.badge),
          title: t(item.title, item.titleLocal || item.title),
          desc: t(item.description ?? "", item.descriptionLocal || item.description || ""),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content.announcements, lang]
  );

  const theme = config.theme;

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={
        {
          "--portal-primary": theme.primaryColor,
          "--portal-secondary": theme.secondaryColor,
          "--portal-accent": theme.accentColor,
          "--portal-header-bg": theme.headerBackgroundColor,
          "--portal-header-text": theme.headerTextColor,
          "--portal-btn-bg": theme.buttonBackgroundColor,
          "--portal-btn-text": theme.buttonTextColor,
          "--portal-footer-bg": theme.footerBackgroundColor,
          "--portal-footer-text": theme.footerTextColor,
        } as React.CSSProperties
      }
    >
      <PortalHeader config={config} lang={lang} t={t} onToggleLanguage={() => setLang(lang === "en" ? "mr" : "en")} />

      <PortalHero config={config} lang={lang} t={t} />

      <UpdatesTicker config={config} lang={lang} t={t} updates={updates} />

      {/* pb-0: the light page background must not show as a strip above the banner */}
      <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-4">
        <CitizenServicesGrid config={config} lang={lang} t={t} services={citizenServices} />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <AnnouncementsCard config={config} lang={lang} t={t} announcements={announcements} />
          <ImportantLinksCard config={config} lang={lang} t={t} links={content.importantLinks} />
        </section>
      </main>

      {/* The water banner is rendered inside PortalFooter so the two share one seamless surface */}
      <PortalFooter config={config} lang={lang} t={t} />
    </div>
  );
}