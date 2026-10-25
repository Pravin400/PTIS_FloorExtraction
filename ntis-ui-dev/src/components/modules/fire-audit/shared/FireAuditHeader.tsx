"use client";

/**
 * Demo workspace top bar: white paper, ink title, ember role label.
 * This is a Fire Audit header. It does not edit src/components/layout/Header.tsx.
 */

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Menu } from "lucide-react";
import { switchLocale, localeNames, type Locale } from "@/i18n/config";
import { getCookieValue } from "@/lib/utils/cookie";
import { fireAuditPageHeading, isFireCitizenPath } from "./fire-audit-nav";

const NEXT_LOCALE: Record<Locale, Locale> = {
  en: "mr",
  mr: "hi",
  hi: "en",
};

export function FireAuditHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const t = useTranslations("fireAudit");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || "";
  const citizen = isFireCitizenPath(pathname);
  const headingKey = fireAuditPageHeading(pathname);
  const heading =
    headingKey === "home"
      ? t("shell.titleFull")
      : headingKey === "jurisdiction" ||
          headingKey === "occupancy" ||
          headingKey === "bands" ||
          headingKey === "checklistItems" ||
          headingKey === "matrix" ||
          headingKey === "applicationTypes" ||
          headingKey === "documentTypes" ||
          headingKey === "stations" ||
          headingKey === "feeHeads" ||
          headingKey === "feeRules" ||
          headingKey === "statuses"
        ? t(`masters.${headingKey}.title`)
        : t(`routes.${headingKey}.title`);
  const council =
    (typeof window !== "undefined" ? getCookieValue("ulb_name") : undefined) ||
    tCommon("app.defaultUlbName");

  return (
    <header className="sticky top-0 z-50 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#D8E2E6] bg-white px-3 py-2 sm:min-h-[78px] sm:px-6 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D8E2E6] text-[#123B4A] md:hidden"
          aria-label={t("shell.openNav")}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#B9381D] sm:text-[11px]">
            {citizen ? t("shell.citizenServices") : t("shell.staffWorkspace")}
          </p>
          <h1 className="truncate text-base font-extrabold tracking-[-0.03em] text-[#153746] sm:text-lg">
            {heading}
          </h1>
          <p className="hidden truncate text-[11px] text-[#607681] sm:block">{council}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => switchLocale(NEXT_LOCALE[locale as Locale] || "en", pathname, router)}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#153746] hover:bg-[#EEF3F5]"
        title={tCommon("language.select")}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{localeNames[locale as Locale] || localeNames.en}</span>
      </button>
    </header>
  );
}
