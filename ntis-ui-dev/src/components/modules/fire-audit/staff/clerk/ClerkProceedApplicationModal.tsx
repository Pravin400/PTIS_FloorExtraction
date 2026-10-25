"use client";

import { useTranslations } from "next-intl";
import { Modal, Button, Badge, type BadgeVariant } from "@/components/common";
import { ClerkApplicationItem } from "@/types/fire-audit/clerk.types";
import {
    Briefcase,
    Check,
    Hourglass,
    Search,
    Zap,
    FileText,
    Calendar,
    FileCheck,
    ShieldCheck,
    AlertCircle,
    X as XIcon,
} from "lucide-react";

interface ClerkProceedApplicationModalProps {
    application: ClerkApplicationItem | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (app: ClerkApplicationItem) => void;
}

export function ClerkProceedApplicationModal({
    application,
    isOpen,
    onClose,
    onConfirm,
}: ClerkProceedApplicationModalProps) {
    const t = useTranslations("fireAudit.clerk.modal");

    if (!application) return null;

    const detail = application.modalDetail ?? {
        address: application.buildingName ? `${application.buildingName}, ${application.councilCode}` : "—",
        complianceInfo: application.slaRemaining ? `Standard SLA • ${application.slaRemaining}` : "Standard SLA",
        assignedOfficer: "To be assigned upon Scrutiny",
        deficienciesStatus: application.statusLabel || "Pending Initial Verification",
        journeyStep: 2,
        journeySubtitle: "With Clerk",
    };

    // Contextual CTA button configuration matching all 6 actions
    const getCtaConfig = () => {
        if (application.isOverdue) return { variant: "primary" as const, icon: Zap, iconClass: "", label: t("btnExpedite"), className: "!bg-rose-600 hover:!bg-rose-700 !text-white" };
        if (application.status === "rejected") return { variant: "secondary" as const, icon: FileText, iconClass: "text-rose-600", label: t("btnViewRejection"), className: "!bg-rose-50 !text-rose-700 !border-rose-300 hover:!bg-rose-100" };
        if (application.status === "survey_scheduled") return { variant: "secondary" as const, icon: Calendar, iconClass: "text-sky-600", label: t("btnViewSchedule"), className: "!bg-sky-50 !text-sky-700 !border-sky-300 hover:!bg-sky-100" };
        if (application.status === "review_forward") return { variant: "primary" as const, icon: FileCheck, iconClass: "", label: t("btnVerifyReport"), className: "!bg-purple-600 hover:!bg-purple-700 !text-white" };
        if (application.status === "compliance_pending") return { variant: "primary" as const, icon: AlertCircle, iconClass: "", label: t("btnViewNotice"), className: "!bg-amber-600 hover:!bg-amber-700 !text-white" };
        return { variant: "primary" as const, icon: Search, iconClass: "", label: t("btnStartScrutiny"), className: "!bg-emerald-600 hover:!bg-emerald-700 !text-white" };
    };

    const cta = getCtaConfig();
    const CtaIcon = cta.icon;

    const detailsList = [
        { label: t("labels.appNoDate"), value: `${application.id} (${application.submissionDate})`, bold: true },
        { label: t("labels.applicantOwner"), value: application.applicantName, bold: true },
        { label: t("labels.buildingName"), value: application.buildingName, bold: true },
        { label: t("labels.addressLocation"), value: detail.address },
        { label: t("labels.occupancyType"), value: `${application.occupancyName} (${application.occupancyGroup})` },
        { label: t("labels.complianceRisk"), value: detail.complianceInfo },
        { label: t("labels.assignedOfficer"), value: detail.assignedOfficer },
        {
            label: t("labels.deficienciesStatus"),
            value: detail.deficienciesStatus,
            colSpan: "sm:col-span-2",
            highlight: application.isOverdue || application.status === "rejected" || application.status === "compliance_pending",
        },
    ];

    const getBadgeVariant = (): BadgeVariant => {
        if (application.isOverdue || application.status === "rejected") return "destructive";
        if (application.status === "compliance_pending") return "warning";
        if (application.status === "survey_scheduled") return "info";
        if (application.status === "review_forward") return "secondary";
        return "default";
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            maxWidth="xl"
            title={
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <Briefcase className="w-5 h-5 text-[#0284c7]" />
                    <span>{t("title")}</span>
                </div>
            }
            footer={
                <div className="flex items-center justify-end w-full gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="!rounded-xl text-xs font-semibold px-4 py-2"
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        variant={cta.variant}
                        onClick={() => onConfirm(application)}
                        className={`${cta.className} font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95`}
                    >
                        <CtaIcon className={`w-4 h-4 ${cta.iconClass}`} />
                        <span>{cta.label}</span>
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-1">
                {/* 1. APPLICATION DETAILS (IN SHORT) */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                        <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider flex items-center gap-1.5">
                            <span>{t("detailsTitle")}</span>
                        </span>
                        <Badge
                            variant={getBadgeVariant()}
                            size="sm"
                            className="text-[11px] font-bold px-2.5 py-0.5"
                        >
                            {application.statusLabel.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-6 text-xs">
                        {detailsList.map((item, idx) => (
                            <div key={idx} className={item.colSpan}>
                                <p className="text-[11px] font-medium text-slate-400">{item.label}</p>
                                <p className={`mt-0.5 ${item.bold ? "font-bold text-slate-900" : item.highlight ? "font-semibold text-rose-600" : "font-semibold text-slate-800"}`}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. APPLICATION JOURNEY (STEP-BY-STEP PROCESS TRACKING) */}
                <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-5">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{t("journeyTitle")}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t("journeySub")}
                        </span>
                    </div>

                    <div className="flex items-center justify-between px-2 sm:px-6">
                        {/* Step 1: Submitted */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                                <Check className="w-5 h-5 stroke-[2.5]" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-2">{t("steps.submitted")}</span>
                            <span className="text-[11px] font-semibold text-emerald-600">{application.submissionDate}</span>
                        </div>

                        {/* Line 1 -> 2 */}
                        <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full ${detail.journeyStep >= 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

                        {/* Step 2: Scrutiny */}
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${detail.journeyStep === 2
                                ? application.isOverdue ? "bg-rose-600 text-white" : "bg-[#0284c7] text-white"
                                : detail.journeyStep > 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                {detail.journeyStep > 2 ? (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                ) : (
                                    <Hourglass className="w-4 h-4 animate-pulse" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-2">
                                {application.isOverdue ? t("steps.slaOverdue") : t("steps.scrutinyPending")}
                            </span>
                            <span className={`text-[11px] font-semibold ${application.isOverdue ? "text-rose-600" : "text-[#0284c7]"}`}>
                                {detail.journeySubtitle || t("steps.withClerk")}
                            </span>
                        </div>

                        {/* Line 2 -> 3 */}
                        <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full ${detail.journeyStep >= 3 ? (application.status === "rejected" ? "bg-rose-400" : "bg-emerald-500") : "bg-slate-200"}`} />

                        {/* Step 3: Survey Inspection / Rejection */}
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${application.status === "rejected"
                                ? "bg-rose-600 text-white"
                                : detail.journeyStep === 3
                                    ? "bg-sky-600 text-white"
                                    : detail.journeyStep > 3
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                {application.status === "rejected" ? (
                                    <XIcon className="w-5 h-5 stroke-[2.5]" />
                                ) : detail.journeyStep > 3 ? (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                ) : (
                                    <Calendar className="w-4 h-4" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-2">
                                {application.status === "rejected" ? t("steps.rejected") : t("steps.surveyInspection")}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                                {application.status === "rejected" ? t("steps.deficienciesFound") : t("steps.fieldAudit")}
                            </span>
                        </div>

                        {/* Line 3 -> 4 */}
                        <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full ${detail.journeyStep >= 4 ? "bg-emerald-500" : "bg-slate-200"}`} />

                        {/* Step 4: Verification & Approval */}
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs ${detail.journeyStep === 4
                                ? "bg-purple-600 text-white"
                                : detail.journeyStep >= 5
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                {detail.journeyStep >= 5 ? (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-2">{t("steps.cfoApproval")}</span>
                            <span className="text-[11px] font-medium text-slate-500">
                                {detail.journeyStep === 5 ? t("steps.pendingSignoff") : t("steps.finalClearance")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
