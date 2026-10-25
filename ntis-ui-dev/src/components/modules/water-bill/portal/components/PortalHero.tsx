"use client";

import { Droplet } from "lucide-react";

import { FEATURE_ICONS } from "../constants";
import type { PortalSectionProps } from "@/types/water-bill/portal.types";

const FEATURE_STYLES: Record<string, { bg: string; icon: string }> = {
  droplet: { bg: "bg-blue-100", icon: "text-blue-600" },
  leaf: { bg: "bg-green-100", icon: "text-green-600" },
  users: { bg: "bg-sky-100", icon: "text-[#003B7A]" },
};

export default function PortalHero({ config, t }: PortalSectionProps) {
  const sortedFeatures = [...config.hero.features].sort((a, b) => a.displayOrder - b.displayOrder);
  const mediaType = config.hero.backgroundMediaType ?? "image";
  const isVideo = mediaType === "video" && Boolean(config.hero.backgroundVideoSrc);

  return (
    <section className="relative overflow-hidden">
      {isVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={config.hero.backgroundImage || undefined}
          aria-hidden="true"
        >
          <source src={config.hero.backgroundVideoSrc} type={config.hero.backgroundVideoType || "video/mp4"} />
        </video>
      ) : (
        <>
          {/* Mobile background (image or gif) */}
          <div
            className="absolute inset-0 bg-cover bg-center sm:hidden"
            style={{ backgroundImage: `url(${config.hero.mobileBackgroundImage || config.hero.backgroundImage})` }}
            aria-hidden="true"
          />
          {/* Desktop/tablet background (image or gif) */}
          <div
            className="absolute inset-0 hidden bg-cover bg-center sm:block"
            style={{ backgroundImage: `url(${config.hero.backgroundImage})` }}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:py-8 md:py-10">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#003B7A]"
          style={{ textShadow: "0 1px 10px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.9)" }}
        >
          {t(config.hero.title, config.hero.titleLocal)}
        </h1>
        <p
          className="mt-1.5 text-sm sm:text-base md:text-lg font-semibold text-gray-800"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.9)" }}
        >
          {t(config.hero.subTitle, config.hero.subTitleLocal)}
        </p>

        <div className="mt-5 sm:mt-6 flex flex-wrap gap-6 sm:gap-8">
          {sortedFeatures.map((feature) => {
            const Icon = FEATURE_ICONS[feature.icon] ?? Droplet;
            const style = FEATURE_STYLES[feature.icon] ?? FEATURE_STYLES.droplet;
            return (
              <div key={feature.displayOrder} className="flex flex-col items-center text-center gap-1.5 w-20 sm:w-24">
                <div
                  className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full ${style.bg} flex items-center justify-center`}
                  style={{ boxShadow: "0 2px 10px rgba(255,255,255,0.8)" }}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${style.icon}`} />
                </div>
                <p
                  className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight"
                  style={{ textShadow: "0 1px 6px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.9)" }}
                >
                  {t(feature.title, feature.titleLocal)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
