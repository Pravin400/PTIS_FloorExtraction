"use client";

import { Leaf, Waves } from "lucide-react";
import { PORTAL_EN, PORTAL_MR } from "../portal-translations";
import type { PortalSectionProps } from "@/types/water-bill/portal.types";

type Props = Pick<PortalSectionProps, "t"> & {
  /** Pass theme.footerBackgroundColor: the banner fades down into it */
  footerColor?: string;
};

/** Colour at the water surface. The front wave and the top of the banner gradient both use it, so there is no seam. */
const TOP_COLOR = "#010a1c";

const BUBBLES = [
  { left: 5, size: 8, duration: 9, delay: 0 },
  { left: 16, size: 6, duration: 8, delay: 3.5 },
  { left: 28, size: 10, duration: 10, delay: 2 },
  { left: 44, size: 6, duration: 8, delay: 4 },
  { left: 58, size: 12, duration: 11, delay: 1 },
  { left: 72, size: 7, duration: 9, delay: 3 },
  { left: 84, size: 10, duration: 10, delay: 0.5 },
  { left: 96, size: 8, duration: 9, delay: 5 },
];

export default function WaterConservationBanner({ t, footerColor = "#043f80" }: Props) {
  const title = t(PORTAL_EN.banner.saveWaterTitle, PORTAL_MR.banner.saveWaterTitle);
  const words = title.split(" ");
  const lastWord = words.pop();
  const firstWords = words.join(" ");

  return (
    <div className="water-banner relative">
      {/* Waves on top: transparent above the crest, so the page background shows through.
          -mb-2 (instead of a hairline -mb-px) + the section below sitting at a higher
          z-index guarantees the section's gradient (which starts on the same TOP_COLOR)
          paints over any sub-pixel rounding gap from the percentage-sized SVG waves,
          instead of leaving a thin seam of the wrapper's own transparent background. */}
      <div
        className="pointer-events-none relative z-0 -mb-2 h-16 overflow-hidden sm:h-24"
        aria-hidden="true"
      >
        <svg
          className="wave wave-back absolute bottom-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wbRibbonBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="wbRibbonMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="wbCrest" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.35" />
              <stop offset="25%" stopColor="#a5f3fc" stopOpacity="1" />
              <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#a5f3fc" stopOpacity="1" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wbRibbonBack)"
            d="M0,55 Q180,5 360,55 T720,55 T1080,55 T1440,55 T1800,55 T2160,55 T2520,55 T2880,55 V125 H0 Z"
          />
        </svg>

        <svg
          className="wave wave-mid absolute bottom-0 h-[85%] w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#wbRibbonMid)"
            d="M0,62 Q120,18 240,62 T480,62 T720,62 T960,62 T1200,62 T1440,62 T1680,62 T1920,62 T2160,62 T2400,62 T2640,62 T2880,62 V125 H0 Z"
          />
        </svg>

        {/* Front wave: same colour as the top of the banner, with a glowing crest line */}
        <svg
          className="wave wave-front absolute bottom-0 h-[68%] w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <path
            fill={TOP_COLOR}
            d="M0,70 Q90,30 180,70 T360,70 T540,70 T720,70 T900,70 T1080,70 T1260,70 T1440,70 T1620,70 T1800,70 T1980,70 T2160,70 T2340,70 T2520,70 T2700,70 T2880,70 V125 H0 Z"
          />
          <path
            fill="none"
            stroke="url(#wbCrest)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            d="M0,70 Q90,30 180,70 T360,70 T540,70 T720,70 T900,70 T1080,70 T1260,70 T1440,70 T1620,70 T1800,70 T1980,70 T2160,70 T2340,70 T2520,70 T2700,70 T2880,70"
          />
        </svg>
      </div>

      <section
        aria-label={t(PORTAL_EN.banner.waterConservation, PORTAL_MR.banner.waterConservation)}
        className="relative z-10 isolate overflow-hidden border-0 text-white"
        style={{
          // Starts on the wave colour, ends on the footer colour: no seam at either end
          background: `linear-gradient(180deg, ${TOP_COLOR} 0%, #03264d 45%, ${footerColor} 100%)`,
        }}
      >
        {/* Soft light on the right (centred low so it never tints the wave seam) */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(50% 60% at 88% 55%, rgba(56,189,248,0.30) 0%, rgba(14,116,220,0.14) 45%, transparent 75%)",
          }}
        />

        {/* Text */}
        <div className="relative z-30 mx-auto max-w-7xl px-4 pb-8 pt-4 sm:pt-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              <Waves className="h-3 w-3 text-cyan-300" />
              {t(PORTAL_EN.banner.everyDropMatters, PORTAL_MR.banner.everyDropMatters)}
              <Leaf className="h-3 w-3 text-cyan-300" />
            </span>

            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {firstWords && <span className="text-white">{firstWords} </span>}
              <span className="text-cyan-300">{lastWord}</span>
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200 sm:text-base">
              {t(PORTAL_EN.banner.saveWaterDescription, PORTAL_MR.banner.saveWaterDescription)}
            </p>
          </div>
        </div>

        {/* Bubbles */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="bubble absolute bottom-0 rounded-full border border-cyan-200/50 bg-cyan-100/15"
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
      </section>

      <style jsx>{`
        .wave {
          will-change: transform;
        }
        .wave-back {
          animation: drift 18s linear infinite;
        }
        .wave-mid {
          animation: drift 12s linear infinite reverse;
        }
        .wave-front {
          animation: drift 9s linear infinite;
        }
        @keyframes drift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }

        .bubble {
          opacity: 0;
          animation-name: rise;
          animation-timing-function: ease-in;
          animation-iteration-count: infinite;
        }
        @keyframes rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate3d(6px, -160px, 0); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wave, .bubble { animation: none !important; }
          .bubble { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}