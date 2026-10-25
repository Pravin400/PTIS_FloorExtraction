"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardList,
  FilePlus,
  Flame,
  Home,
  LogIn,
  Shield,
  UserPlus,
  Gavel,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { isFireCitizenPath } from "./fire-audit-nav";

export function FireAuditSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("fireAudit");
  const locale = useLocale();
  const pathname = usePathname() || "";
  const citizen = isFireCitizenPath(pathname);
  const root = `/${locale}/fire-audit`;

  const staffItems = [
    { href: root, label: t("home.title"), icon: Home },
    { href: `${root}/clerk`, label: t("routes.clerk.title"), icon: ClipboardCheck },
    { href: `${root}/surveyor`, label: t("routes.surveyor.title"), icon: Search },
    { href: `${root}/auditor`, label: t("routes.auditor.title"), icon: Shield },
    { href: `${root}/certificates`, label: t("routes.certificates.title"), icon: ClipboardList },
    { href: `${root}/masters/jurisdiction`, label: t("masters.jurisdiction.title"), icon: Gavel },
  ];

  const citizenItems = [
    { href: `${root}/citizen`, label: t("citizenNav.home"), icon: Home },
    { href: `${root}/citizen/applications`, label: t("citizenNav.applications"), icon: ClipboardList },
    { href: `${root}/citizen/applications/new`, label: t("citizenNav.newApplication"), icon: FilePlus },
    { href: `${root}/citizen/login`, label: t("citizenNav.signIn"), icon: LogIn },
    { href: `${root}/citizen/register`, label: t("citizenNav.register"), icon: UserPlus },
  ];

  const items = citizen ? citizenItems : staffItems;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0B2D3A]/40 md:hidden"
          aria-label={t("shell.closeNav")}
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#123B4A] text-white transition-transform md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex min-h-[86px] items-center gap-2.5 border-b border-white/10 bg-[#0B2D3A] px-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#D94A27]">
            <Flame className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight">{t("shell.titleFull")}</p>
            <p className="truncate text-[11px] text-white/75">
              {citizen ? t("shell.citizenServices") : t("shell.staffWorkspace")}
            </p>
          </div>
        </div>
        <p className="px-5 pt-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/55">
          {citizen ? t("shell.navHeader") : t("shell.staffNavHeader")}
        </p>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                onClick={onClose}
                className={`flex min-h-12 items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold ${
                  active
                    ? "bg-white/12 shadow-[inset_3px_0_0_#D94A27]"
                    : "text-white/75 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
