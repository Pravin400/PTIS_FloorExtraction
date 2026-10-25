"use client";

import { createElement, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { resolveIcon } from "@/lib/utils/icon-mapping";
import type { PortalNavigationItem } from "@/types/water-bill/portalConfig.types";
import { formatTranslation, PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { TranslateFn } from "@/types/water-bill/portal.types";

export interface PortalNavItemProps {
  item: PortalNavigationItem;
  t: TranslateFn;
  /** "desktop" opens a hover/focus dropdown; "mobile" expands an inline accordion on tap. */
  variant?: "desktop" | "mobile";
  /** Called when a link (parent or child) is activated — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/** Resolves and renders a nav item's icon via createElement (not JSX) so the resolved component reference isn't flagged as being created during render. */
function NavItemIcon({ icon, title }: { icon?: string | null; title: string }) {
  if (!icon) return null;
  return createElement(resolveIcon(icon, title), { className: "h-4 w-4 shrink-0" });
}

export default function PortalNavItem({ item, t, variant = "desktop", onNavigate }: PortalNavItemProps) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const sortedChildren = hasChildren
    ? [...item.children!].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];
  const isMobile = variant === "mobile";

  const openMenu = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  if (isMobile) {
    return (
      <li className="border-b border-white/10 last:border-b-0">
        <div className="flex items-center">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex-1 px-4 py-3.5 text-left text-base font-medium active:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <NavItemIcon icon={item.icon} title={item.title} />
                {t(item.title, item.titleLocal)}
              </span>
            </button>
          ) : (
            <a
              href={item.url}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={onNavigate}
              className="flex-1 px-4 py-3.5 text-base font-medium active:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <NavItemIcon icon={item.icon} title={item.title} />
                {t(item.title, item.titleLocal)}
              </span>
            </a>
          )}
          {hasChildren && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={
                open
                  ? t(
                      formatTranslation(PORTAL_EN.nav.collapseSubmenu, { title: item.title }),
                      formatTranslation(PORTAL_MR.nav.collapseSubmenu, { title: item.titleLocal })
                    )
                  : t(
                      formatTranslation(PORTAL_EN.nav.expandSubmenu, { title: item.title }),
                      formatTranslation(PORTAL_MR.nav.expandSubmenu, { title: item.titleLocal })
                    )
              }
              className={`mr-1 rounded-full p-2 transition-colors active:bg-white/10 ${open ? "bg-white/10" : ""}`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {hasChildren && (
          <ul
            className={`overflow-hidden bg-black/10 transition-[max-height,opacity] duration-300 ease-in-out ${
              open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="ml-6 space-y-0.5 border-l-2 border-white/15 py-1.5">
              {sortedChildren.map((child) => (
                <li key={child.url}>
                  <a
                    href={child.url}
                    target={child.openInNewTab ? "_blank" : undefined}
                    rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                    onClick={onNavigate}
                    className="flex items-center gap-2 py-2.5 pl-4 pr-4 text-sm opacity-85 transition-colors active:bg-white/10 active:opacity-100"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
                    {t(child.title, child.titleLocal)}
                  </a>
                </li>
              ))}
            </div>
          </ul>
        )}
      </li>
    );
  }

  return (
    <li
      className="relative"
      onMouseEnter={hasChildren ? openMenu : undefined}
      onMouseLeave={hasChildren ? scheduleClose : undefined}
    >
      <a
        href={item.url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        onClick={hasChildren ? (e) => e.preventDefault() : onNavigate}
        onFocus={hasChildren ? openMenu : undefined}
        className="flex items-center gap-1 px-4 py-3 text-sm font-medium opacity-90 hover:opacity-100 hover:bg-white/10 transition"
        aria-haspopup={hasChildren ? "menu" : undefined}
        aria-expanded={hasChildren ? open : undefined}
      >
        <span className="flex items-center gap-2">
          <NavItemIcon icon={item.icon} title={item.title} />
          {t(item.title, item.titleLocal)}
        </span>
        {hasChildren && (
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </a>

      {hasChildren && (
        <div
          className={`absolute left-0 top-full z-40 pt-2 transition-all duration-200 ease-out ${
            open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
          }`}
        >
          {/* Small caret pointing up at the trigger */}
          <div className="ml-5 h-2.5 w-2.5 rotate-45 border-l border-t border-gray-100 bg-white shadow-[-2px_-2px_4px_rgba(0,0,0,0.03)]" />

          <ul
            role="menu"
            className="-mt-[7px] min-w-[240px] overflow-hidden rounded-xl border-t-2 border-[var(--portal-primary)] bg-white py-1.5 text-gray-700 shadow-xl ring-1 ring-black/5"
          >
            {sortedChildren.map((child) => (
              <li key={child.url} role="none">
                <a
                  href={child.url}
                  target={child.openInNewTab ? "_blank" : undefined}
                  rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                  role="menuitem"
                  onClick={onNavigate}
                  className="group/item flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--portal-primary)]/5 hover:text-[var(--portal-primary)]"
                >
                  <span className="transition-transform duration-150 group-hover/item:translate-x-0.5">
                    {t(child.title, child.titleLocal)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-150 -translate-x-1 group-hover/item:translate-x-0 group-hover/item:opacity-70" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
