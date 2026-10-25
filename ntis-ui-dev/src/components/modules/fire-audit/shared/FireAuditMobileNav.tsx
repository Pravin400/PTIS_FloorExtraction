"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList, FilePlus, Gavel, Home, LogIn } from "lucide-react";
import { isFireCitizenPath } from "./fire-audit-nav";

export function FireAuditMobileNav() {
  const t = useTranslations("fireAudit");
  const locale = useLocale();
  const pathname = usePathname() || "";
  const citizen = isFireCitizenPath(pathname);
  const root = `/${locale}/fire-audit`;

  const items = citizen
    ? [
        { href: `${root}/citizen`, label: t("citizenNav.home"), icon: Home },
        { href: `${root}/citizen/applications`, label: t("citizenNav.applications"), icon: ClipboardList },
        { href: `${root}/citizen/applications/new`, label: t("citizenNav.newApplication"), icon: FilePlus, featured: true },
        { href: `${root}/citizen/login`, label: t("citizenNav.signIn"), icon: LogIn },
      ]
    : [
        { href: root, label: t("home.title"), icon: Home },
        { href: `${root}/clerk`, label: t("routes.clerk.title"), icon: ClipboardList },
        { href: `${root}/masters/jurisdiction`, label: t("masters.jurisdiction.title"), icon: Gavel, featured: true },
        { href: `${root}/certificates`, label: t("routes.certificates.title"), icon: FilePlus },
      ];

  return (
    <nav
      aria-label={t("shell.titleFull")}
      className="grid grid-cols-4 items-center border-t border-[#D8E2E6] bg-white px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === root
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-semibold ${
              item.featured ? "text-[#D94A27]" : active ? "text-[#123B4A]" : "text-[#607681]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
