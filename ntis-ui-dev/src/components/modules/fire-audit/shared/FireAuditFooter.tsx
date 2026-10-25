"use client";

/**
 * Demo workspace footer. Does not edit src/components/layout/Footer.tsx.
 */

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { isFireCitizenPath } from "./fire-audit-nav";

export function FireAuditFooter() {
  const t = useTranslations("fireAudit.shell");
  const pathname = usePathname() || "";
  const citizen = isFireCitizenPath(pathname);
  const year = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-[#D8E2E6] bg-white px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-9 print:hidden">
      <p className="text-xs font-medium text-[#607681]">
        {citizen ? t("footerCitizen") : t("footerStaff")}
        <span className="mx-2 hidden text-[#D8E2E6] sm:inline">·</span>
        <span>
          © {year} {t("copyright")}
        </span>
      </p>
      <p className="hidden max-w-md text-right text-[11px] text-[#607681] lg:block">
        {t("footerNote")}
      </p>
    </footer>
  );
}
