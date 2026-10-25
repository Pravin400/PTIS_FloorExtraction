"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ClerkMetricSummary } from "@/types/fire-audit/clerk.types";
import {
    FileText,
    AlertTriangle,
    Calendar,
    Search,
    AlertCircle,
    RotateCcw,
    CheckCircle,
    XCircle,
} from "lucide-react";

interface ClerkMetricCardsProps {
    metrics: ClerkMetricSummary;
    activeStatusFilter?: string;
    onSelectFilter?: (status: string) => void;
}

export function ClerkMetricCards({
    metrics,
    activeStatusFilter = "all",
    onSelectFilter,
}: ClerkMetricCardsProps) {
    const t = useTranslations("fireAudit.clerk.metrics");
    const [activeSlide, setActiveSlide] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const cards = React.useMemo(
        () => [
            {
                key: "all",
                tag: t("tagAll"),
                label: t("allApplications"),
                count: metrics.allApplications,
                icon: FileText,
                iconColor: "text-sky-500",
                badgeBg: "bg-sky-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-sky-50/40",
                borderColor: "border-white/80 hover:border-sky-200",
                glowColor: "bg-sky-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/all.svg",
            },
            {
                key: "scrutiny_pending",
                tag: t("tagPending"),
                label: t("scrutinyPending"),
                count: metrics.scrutinyPending,
                icon: AlertTriangle,
                iconColor: "text-amber-500",
                badgeBg: "bg-amber-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-amber-50/40",
                borderColor: "border-white/80 hover:border-amber-200",
                glowColor: "bg-amber-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/scrutiny_pending.svg",
            },
            {
                key: "survey_scheduled",
                tag: t("tagScheduled"),
                label: t("surveyScheduled"),
                count: metrics.surveyScheduled,
                icon: Calendar,
                iconColor: "text-sky-500",
                badgeBg: "bg-sky-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-sky-50/40",
                borderColor: "border-white/80 hover:border-sky-200",
                glowColor: "bg-sky-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/survey_scheduled.svg",
            },
            {
                key: "review_forward",
                tag: t("tagReview"),
                label: t("reviewForward"),
                count: metrics.reviewForward,
                icon: Search,
                iconColor: "text-purple-500",
                badgeBg: "bg-purple-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-purple-50/40",
                borderColor: "border-white/80 hover:border-purple-200",
                glowColor: "bg-purple-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/review_forward.svg",
            },
            {
                key: "compliance_pending",
                tag: t("tagCompliance"),
                label: t("compliancePending"),
                count: metrics.compliancePending,
                icon: AlertCircle,
                iconColor: "text-orange-500",
                badgeBg: "bg-orange-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-orange-50/40",
                borderColor: "border-white/80 hover:border-orange-200",
                glowColor: "bg-orange-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/compliance_pending.svg",
            },
            {
                key: "reinspection",
                tag: t("tagReinspect"),
                label: t("reinspectionCases"),
                count: metrics.reinspectionCases,
                icon: RotateCcw,
                iconColor: "text-amber-500",
                badgeBg: "bg-amber-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-amber-50/40",
                borderColor: "border-white/80 hover:border-amber-200",
                glowColor: "bg-amber-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/reinspection.svg",
            },
            {
                key: "certified",
                tag: t("tagCertified"),
                label: t("certifiedCleared"),
                count: metrics.certifiedCleared,
                icon: CheckCircle,
                iconColor: "text-emerald-500",
                badgeBg: "bg-emerald-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-emerald-50/40",
                borderColor: "border-white/80 hover:border-emerald-200",
                glowColor: "bg-emerald-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/certified.svg",
            },
            {
                key: "rejected",
                tag: t("tagRejected"),
                label: t("rejectedApplications"),
                count: metrics.rejectedApplications,
                icon: XCircle,
                iconColor: "text-rose-500",
                badgeBg: "bg-rose-50",
                cardBg: "bg-white/70 hover:bg-white/85 backdrop-blur-md bg-gradient-to-b from-white/80 to-rose-50/40",
                borderColor: "border-white/80 hover:border-rose-200",
                glowColor: "bg-rose-400/20",
                activeBorder: "ring-2 ring-sky-500/50 !border-sky-400 !bg-white/95 shadow-xs",
                watermark: "/assets/images/fire-audit/kpi-watermarks/rejected.svg",
            },
        ],
        [t, metrics]
    );

    // 140px card width + 10px gap (gap-2.5) for mobile snap scroll
    const MOBILE_CARD_SNAP_STEP = 150;

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const index = Math.round(scrollLeft / MOBILE_CARD_SNAP_STEP);
            setActiveSlide(Math.min(Math.max(index, 0), cards.length - 1));
        }
    };

    return (
        <div className="w-full">
            {/* Horizontal Swipe Carousel on Mobile (<sm) | 4-col on Tablet | 8-col Single Row on Desktop (>=xl) */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex sm:grid gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory sm:snap-none scrollbar-none sm:grid-cols-4 xl:grid-cols-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {cards.map((card) => {
                    const Icon = card.icon;
                    const isActive = activeStatusFilter === card.key;
                    return (
                        <div
                            key={card.key}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isActive}
                            onClick={() => onSelectFilter?.(card.key)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelectFilter?.(card.key);
                                }
                            }}
                            className={`group relative overflow-hidden flex flex-col justify-between rounded-2xl ${card.cardBg} p-3 sm:p-3.5 transition-all duration-200 cursor-pointer snap-center shrink-0 w-[140px] sm:w-auto min-h-[114px] sm:min-h-[118px] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] border ${card.borderColor} shadow-2xs ${isActive
                                ? card.activeBorder
                                : "hover:border-slate-300/80"
                                }`}
                        >
                            {/* Ambient Glow Aura */}
                            <div className={`pointer-events-none absolute right-0 bottom-0 w-24 h-24 rounded-full ${card.glowColor} blur-xl`} />

                            {/* Watermark Illustration in Card Background - Positioned safely in middle-right */}
                            {card.watermark && (
                                <Image
                                    src={card.watermark}
                                    alt=""
                                    width={96}
                                    height={96}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute right-1.5 bottom-8 sm:bottom-7.5 h-10 sm:h-11.5 w-auto max-w-[42%] object-contain object-right opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300 mix-blend-multiply"
                                />
                            )}

                            {/* Top row: Status Tag (left) + Icon Badge (right) */}
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase truncate pr-1">
                                    {card.tag}
                                </span>
                                <div className={`rounded-lg p-1.5 shrink-0 ${card.badgeBg}`}>
                                    <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                                </div>
                            </div>

                            {/* Middle: Big Bold Count */}
                            <div className="relative z-10 mt-1.5 sm:mt-2">
                                <span className="text-2xl font-black tracking-tight text-slate-900">
                                    {card.count}
                                </span>
                            </div>

                            {/* Bottom: Subtitle description - Placed cleanly in its own zone below the watermark */}
                            <div className="relative z-10 mt-auto pt-1">
                                <p className="text-[11px] font-medium text-slate-500 truncate" title={card.label}>
                                    {card.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Pagination Dots (Mobile Only) */}
            <div className="flex sm:hidden justify-center items-center gap-1.5 mt-2.5">
                {cards.map((card, idx) => (
                    <span
                        key={card.key}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx
                            ? "w-4 bg-[#1A86E8]"
                            : "w-1.5 bg-slate-300"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
