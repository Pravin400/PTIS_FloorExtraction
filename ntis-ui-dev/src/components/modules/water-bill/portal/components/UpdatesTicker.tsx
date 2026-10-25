"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone, Pause, Play } from "lucide-react";

import { PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalSectionProps, PortalUpdateItem } from "@/types/water-bill/portal.types";

export interface UpdatesTickerProps extends PortalSectionProps {
  updates: PortalUpdateItem[];
  intervalMs?: number;
}

export default function UpdatesTicker({ config, t, updates, intervalMs = 4000 }: UpdatesTickerProps) {
  const [tickerPaused, setTickerPaused] = useState(false);
  const [direction, setDirection] = useState<"normal" | "reverse">("normal");

  const marqueeItems = useMemo(() => [...updates, ...updates], [updates]);
  const marqueeDuration = Math.max(12, updates.length * 4.5, intervalMs / 1000);

  if (!config.sectionSettings.showLatestUpdates || updates.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <div
          className="flex items-center gap-2 shrink-0 rounded-full sm:rounded-md bg-gradient-to-r from-[#08488B] to-[#075CB3] p-2 sm:px-3 sm:py-1.5 text-white font-semibold text-sm"
          title={t(config.sectionSettings.latestUpdatesTitle, config.sectionSettings.latestUpdatesTitle)}
        >
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">
            {t(config.sectionSettings.latestUpdatesTitle, config.sectionSettings.latestUpdatesTitle)}
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden h-6">
          <div
            className="flex w-max items-center gap-8 whitespace-nowrap pr-8"
            style={{
              animation: `portal-ticker-marquee ${marqueeDuration}s linear infinite`,
              animationDirection: direction,
              animationPlayState: tickerPaused ? "paused" : "running",
            }}
          >
            {marqueeItems.map((update, idx) => (
              <div key={`${update.text}-${idx}`} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {update.tag}
                </span>
                <span className="truncate">{update.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTickerPaused((p) => !p)}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label={
              tickerPaused
                ? t(PORTAL_EN.ticker.play, PORTAL_MR.ticker.play)
                : t(PORTAL_EN.ticker.pause, PORTAL_MR.ticker.pause)
            }
          >
            {tickerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setDirection("reverse");
              setTickerPaused(false);
            }}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label={t(PORTAL_EN.ticker.previous, PORTAL_MR.ticker.previous)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setDirection("normal");
              setTickerPaused(false);
            }}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label={t(PORTAL_EN.ticker.next, PORTAL_MR.ticker.next)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes portal-ticker-marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
