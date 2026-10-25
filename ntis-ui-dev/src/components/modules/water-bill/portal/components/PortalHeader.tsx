"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, Menu, Phone, User, X } from "lucide-react";

import { PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalLanguage, PortalSectionProps } from "@/types/water-bill/portal.types";
import PortalNavItem from "./PortalNavItem";

export interface PortalHeaderProps extends PortalSectionProps {
  onToggleLanguage: () => void;
}

export default function PortalHeader({ config, lang, t, onToggleLanguage }: PortalHeaderProps) {
  const theme = config.theme;
  const sortedNav = [...config.navigation].sort((a, b) => a.displayOrder - b.displayOrder);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-11 w-11 sm:h-14 sm:w-14 shrink-0 rounded-full bg-[var(--portal-primary)]/10 flex items-center justify-center overflow-hidden">
              <Image
                src={config.portal.departmentLogo}
                alt={config.portal.portalTitle}
                width={56}
                height={56}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl font-bold text-[#0436ba] leading-tight">
                {t(config.portal.portalTitleLocal, config.portal.portalTitleLocal)}
              </p>
              <p className="hidden sm:block text-xl font-bold text-[#0436ba] leading-tight">
                {config.portal.portalTitle}
              </p>
              <p className="hidden sm:block text-sm text-gray-500">
                {config.contact.addressLocal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {config.header.showAdminLogin && (
              <a
                href={config.header.adminLoginUrl}
                aria-label={t(config.header.adminLoginText, config.header.adminLoginText)}
                className="flex shrink-0 items-center justify-center rounded-full border border-[var(--portal-primary)]/30 p-2.5 text-[var(--portal-primary)] hover:bg-[var(--portal-primary)]/10"
              >
                <User className="h-4 w-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-md p-2 text-[var(--portal-primary)] hover:bg-[var(--portal-primary)]/10"
              aria-label={t(PORTAL_EN.header.openMenu, PORTAL_MR.header.openMenu)}
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-5">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
            <div className="leading-tight">
              <p className="text-xs text-gray-500">{t(PORTAL_EN.header.email, PORTAL_MR.header.email)}</p>
              <a href={`mailto:${config.contact.email}`} className="font-semibold text-[var(--portal-primary)]">
                {config.contact.email}
              </a>
            </div>
          </div>

          <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-[var(--portal-primary)]" />
            <div className="leading-tight">
              <p className="text-xs text-gray-500">{t(PORTAL_EN.header.helpline, PORTAL_MR.header.helpline)}</p>
              <p className="font-semibold text-[var(--portal-primary)]">{config.contact.helplineNo}</p>
              <p className="text-xs text-gray-400">({config.contact.officeHours})</p>
            </div>
          </div>

          <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden="true" />

          <div className="h-16 w-16 shrink-0">
            <Image
              src={config.portal.governmentLogo}
              alt="Government of Maharashtra"
              width={64}
              height={64}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Desktop nav bar */}
      <nav
        className="hidden lg:block w-full bg-[#013270] text-white shadow-sm"
      >
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <ul className="flex flex-wrap items-center">
            {sortedNav.map((item) => (
              <PortalNavItem key={item.code} item={item} t={t} variant="desktop" />
            ))}
          </ul>

          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={t(PORTAL_EN.header.switchLanguage, PORTAL_MR.header.switchLanguage)}
              className="relative inline-flex h-8 w-[104px] items-center rounded-full border border-white/40 bg-white/10 p-1 text-[11px] font-semibold transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  (lang as PortalLanguage) === "mr" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                }`}
              />
              <span
                className={`relative z-10 flex-1 text-center ${
                  (lang as PortalLanguage) === "en" ? "text-[#013270]" : "text-white/80"
                }`}
              >
                {t(PORTAL_EN.header.english, PORTAL_MR.header.english)}
              </span>
              <span
                className={`relative z-10 flex-1 text-center ${
                  (lang as PortalLanguage) === "mr" ? "text-[#013270]" : "text-white/80"
                }`}
              >
                {t(PORTAL_EN.header.marathi, PORTAL_MR.header.marathi)}
              </span>
            </button>
            {config.header.showAdminLogin && (
              <a
                href={config.header.adminLoginUrl}
                className="rounded-md border border-white/70 px-4 py-1.5 text-sm font-semibold hover:bg-white/10 transition"
              >
                {t(config.header.adminLoginText, config.header.adminLoginText)}
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile backdrop */}
      <div
        onClick={closeMobileMenu}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(PORTAL_EN.header.navigationMenu, PORTAL_MR.header.navigationMenu)}
        className={`fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: theme.headerBackgroundColor, color: theme.headerTextColor }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <span className="text-base font-bold">{t(PORTAL_EN.header.menu, PORTAL_MR.header.menu)}</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label={t(PORTAL_EN.header.closeMenu, PORTAL_MR.header.closeMenu)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul>
          {sortedNav.map((item) => (
            <PortalNavItem
              key={item.code}
              item={item}
              t={t}
              variant="mobile"
              onNavigate={closeMobileMenu}
            />
          ))}
        </ul>

        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 shrink-0 opacity-80" />
            <a href={`mailto:${config.contact.email}`} className="truncate font-medium">
              {config.contact.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 opacity-80" />
            <div>
              <p className="font-medium">{config.contact.helplineNo}</p>
              <p className="text-xs opacity-70">({config.contact.officeHours})</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onToggleLanguage}
              className="text-xs font-semibold rounded border border-white/40 px-3 py-1.5 opacity-90 hover:opacity-100"
            >
              {(lang as PortalLanguage) === "en" ? PORTAL_MR.header.marathi : PORTAL_EN.header.english}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
