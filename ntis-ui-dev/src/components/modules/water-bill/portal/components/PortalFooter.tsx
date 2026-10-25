"use client";

import { Facebook, ChevronRight, Mail, MapPin, Phone } from "lucide-react";

import { SOCIAL_ICONS } from "../constants";
import { PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalSectionProps } from "@/types/water-bill/portal.types";
import WaterConservationBanner from "./WaterConservationBanner";

type Props = PortalSectionProps & {
  /** Optional emblem/logo shown beside the corporation name, e.g. "/pmc-logo.png" */
  logoSrc?: string;
};

const FOOTER_BUBBLES = [
  { left: 4, size: 8, duration: 11, delay: 0 },
  { left: 31, size: 10, duration: 12, delay: 3 },
  { left: 58, size: 6, duration: 9, delay: 1.5 },
  { left: 83, size: 11, duration: 13, delay: 4 },
  { left: 97, size: 8, duration: 10, delay: 2 },
];

export function formatSocialMediaUrl(
  item: { platform?: string; icon?: string; url?: string } | string | undefined | null
): string | null {
  if (!item) return null;
  const rawUrl = typeof item === "string" ? item : item.url;
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "#" || /\s/.test(trimmed)) return null;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) return null;

  try {
    const normalized = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (
      (normalized.protocol !== "http:" && normalized.protocol !== "https:") ||
      !normalized.hostname ||
      normalized.username ||
      normalized.password
    ) {
      return null;
    }

    normalized.protocol = "https:";
    const url = normalized.toString();
    return normalized.pathname === "/" && !normalized.search && !normalized.hash
      ? url.slice(0, -1)
      : url;
  } catch {
    return null;
  }
}

export default function PortalFooter({ config, t, logoSrc }: Props) {
  const theme = config.theme;
  const sortedFooterLinks = [...config.footer.links].sort((a, b) => a.displayOrder - b.displayOrder);

  if (!config.footer.showFooter) return null;

  const iconCircle =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-cyan-300";

  return (
    // No background on the root: the area above the waves must stay transparent
    <footer className="portal-footer relative isolate" style={{ color: theme.footerTextColor }}>
      {/* Waves on top, then the banner, fading down into the footer colour */}
      <WaterConservationBanner t={t} footerColor={theme.footerBackgroundColor} />

      {/* Footer body: same colour the banner ends on, so the two read as one surface */}
      <div className="relative isolate overflow-hidden" style={{ backgroundColor: theme.footerBackgroundColor }}>
        {/* Bubbles drifting up through the footer */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          {FOOTER_BUBBLES.map((b, i) => (
            <span
              key={i}
              className="footer-bubble absolute bottom-0 rounded-full border border-cyan-200/40 bg-cyan-100/10"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-10 pt-4 md:grid-cols-[1.3fr_1fr_1fr]">
          {/* About */}
          <div className="flex items-start gap-4">
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-16 w-16 shrink-0 object-contain" />
            )}
            <div>
              <h4 className="text-lg font-bold">
                {t(config.footer.aboutTitle, config.footer.aboutTitleLocal)}
              </h4>
              <p className="mt-2 max-w-xs text-sm opacity-85">
                {t(config.footer.aboutDescription, config.footer.aboutDescriptionLocal)}
              </p>
              {config.footer.showSocialMedia && (
                <div className="mt-4 flex gap-3">
                  {config.footer.socialMedia.map((s) => {
                    const iconKey = (s.icon || s.platform || "").toLowerCase();
                    const Icon =
                      SOCIAL_ICONS[iconKey] ??
                      SOCIAL_ICONS[s.icon?.toLowerCase()] ??
                      SOCIAL_ICONS[s.platform?.toLowerCase()] ??
                      Facebook;
                    const externalUrl = formatSocialMediaUrl(s);

                    return (
                      <a
                        key={s.platform}
                        href={externalUrl ?? "#"}
                        target={externalUrl ? "_blank" : undefined}
                        rel={externalUrl ? "noopener noreferrer" : undefined}
                        onClick={!externalUrl ? (e) => e.preventDefault() : undefined}
                        aria-label={s.platform}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/25 hover:shadow-[0_6px_18px_rgba(34,211,238,0.25)]"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-lg font-bold">{t(PORTAL_EN.footer.quickLinks, PORTAL_MR.footer.quickLinks)}</h4>
            <ul className="mt-3 space-y-3 text-sm">
              {sortedFooterLinks.map((link) => (
                <li key={link.title}>
                  <a
                    href={link.url}
                    className="group inline-flex items-center gap-3 opacity-90 transition duration-200 hover:text-cyan-200 hover:opacity-100"
                  >
                    <ChevronRight className="h-4 w-4 text-cyan-300 transition-transform duration-200 group-hover:translate-x-0.5" />
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold">{t(PORTAL_EN.footer.contact, PORTAL_MR.footer.contact)}</h4>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className={iconCircle}>
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="opacity-90">{t(config.contact.address, config.contact.addressLocal)}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className={iconCircle}>
                  <Mail className="h-4 w-4" />
                </span>
                <span className="opacity-90">{config.contact.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className={iconCircle}>
                  <Phone className="h-4 w-4" />
                </span>
                <span className="opacity-90">{config.contact.helplineNo}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-10 py-4 text-center text-xs opacity-80">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          {config.footer.copyrightText}
        </div>
      </div>

      <style jsx>{`
        .footer-bubble {
          opacity: 0;
          animation-name: footer-rise;
          animation-timing-function: ease-in;
          animation-iteration-count: infinite;
        }
        @keyframes footer-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          20% { opacity: 0.7; }
          100% { transform: translate3d(8px, -190px, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .footer-bubble { animation: none !important; opacity: 0.25; }
        }
      `}</style>
    </footer>
  );
}