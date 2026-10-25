"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Droplet } from "lucide-react";

import {
  CITIZEN_SERVICE_ICONS,
  CITIZEN_SERVICE_TILE_STYLES,
  DEFAULT_CITIZEN_SERVICE_ICON,
} from "../constants";
import { formatTranslation, PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalSectionProps } from "@/types/water-bill/portal.types";
import type { CitizenServiceItem } from "@/types/water-bill/citizenService.types";

export interface CitizenServicesGridProps extends PortalSectionProps {
  services: CitizenServiceItem[];
}

const MOBILE_CAROUSEL_QUERY = "(max-width: 639.98px)";

function ServiceCard({
  service,
  index,
  t,
  className = "",
}: {
  service: CitizenServiceItem;
  index: number;
  t: PortalSectionProps["t"];
  className?: string;
}) {
  const Icon = (service.iconName && CITIZEN_SERVICE_ICONS[service.iconName]) || DEFAULT_CITIZEN_SERVICE_ICON;
  const style = CITIZEN_SERVICE_TILE_STYLES[index % CITIZEN_SERVICE_TILE_STYLES.length];
  const title = t(service.title, service.titleLocal || service.title);
  const description = t(service.description ?? "", service.descriptionLocal || service.description || "");

  return (
    <a
      href={service.referenceLink || "#"}
      target={service.openInNewTab ? "_blank" : undefined}
      rel={service.openInNewTab ? "noopener noreferrer" : undefined}
      className={`group ${style.bg} rounded-xl p-5 flex flex-col items-center gap-2.5 text-center hover:shadow-md transition cursor-pointer ${className}`}
    >
      <div className={`h-12 w-12 rounded-full ${style.iconBg} shadow-sm flex items-center justify-center`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#1e2681]">{title}</p>
        {description && <p className="mt-1 text-xs text-gray-500 leading-snug">{description}</p>}
      </div>
      <span
        className="mt-1 rounded-full bg-blue-200 border-2 border-white h-7 w-7 flex items-center justify-center shadow-sm text-blue-700 transition group-hover:translate-x-1"
        aria-hidden="true"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </a>
  );
}

export default function CitizenServicesGrid({ config, t, services }: CitizenServicesGridProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);

  const setCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) cardsRef.current.set(index, el);
    else cardsRef.current.delete(index);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof window === "undefined") return;

    // The carousel markup stays mounted (hidden via CSS) at sm+ so SSR output
    // doesn't depend on viewport size. The observer itself must not attach
    // while that container is display:none though — observing elements
    // inside a hidden/zero-size root is unreliable across browsers and has
    // no purpose once the carousel isn't the thing on screen.
    const mql = window.matchMedia(MOBILE_CAROUSEL_QUERY);
    let observer: IntersectionObserver | null = null;

    const attach = () => {
      observer?.disconnect();
      if (!mql.matches) {
        observer = null;
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          for (const [idx, el] of cardsRef.current) {
            if (el === visible.target) {
              setActiveIndex(idx);
              break;
            }
          }
        },
        { root: scroller, threshold: 0.6 }
      );
      cardsRef.current.forEach((el) => observer!.observe(el));
    };

    attach();
    mql.addEventListener("change", attach);

    return () => {
      mql.removeEventListener("change", attach);
      observer?.disconnect();
    };
  }, [services]);

  if (!config.sectionSettings.showCitizenServices || services.length === 0) return null;

  const scrollToIndex = (index: number) => {
    cardsRef.current.get(index)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h2 className="inline-flex items-center gap-2 border-b-3 border-[var(--portal-primary)] pb-2 text-lg font-bold text-gray-900">
        <Droplet className="h-5 w-5 fill-[var(--portal-primary)] text-[var(--portal-primary)]" />
        {t(config.sectionSettings.citizenServicesTitle, config.sectionSettings.citizenServicesTitleLocal)}
      </h2>

      {/* Mobile: horizontally snapping carousel */}
      <div
        ref={scrollerRef}
        className="mt-3 -mx-5 flex sm:hidden snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {services.map((service, index) => (
          <div
            key={service.id}
            ref={(el) => setCardRef(index, el)}
            className="w-[75%] shrink-0 snap-center"
          >
            <ServiceCard service={service} index={index} t={t} className="h-full" />
          </div>
        ))}
      </div>

      {services.length > 1 && (
        <div className="mt-3 flex sm:hidden items-center justify-center gap-1.5">
          {services.map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={t(
                formatTranslation(PORTAL_EN.citizenServices.goToSlide, { n: index + 1 }),
                formatTranslation(PORTAL_MR.citizenServices.goToSlide, { n: index + 1 })
              )}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-[var(--portal-primary)]" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Tablet and up: responsive grid */}
      <div className="mt-3 hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {services.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} t={t} />
        ))}
      </div>
    </section>
  );
}
