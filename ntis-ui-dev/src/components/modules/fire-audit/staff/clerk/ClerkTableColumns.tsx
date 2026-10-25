import { ClerkApplicationItem } from "@/types/fire-audit/clerk.types";
import { type Column, Button } from "@/components/common";
import {
    FileText,
    Clock,
    Calendar,
    User,
    Check,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

function getStatusDotColor(status: string, isOverdue?: boolean): string {
    if (isOverdue) return "bg-rose-500";
    switch (status) {
        case "rejected":
            return "bg-rose-500";
        case "certified":
            return "bg-emerald-500";
        case "compliance_pending":
            return "bg-amber-500";
        case "review_forward":
            return "bg-purple-500";
        case "survey_scheduled":
            return "bg-sky-500";
        case "scrutiny_pending":
        default:
            return "bg-amber-500";
    }
}

export function getClerkTableColumns(
    t: (key: string) => string,
    onViewDocs: (id: string) => void
): Column<ClerkApplicationItem>[] {
    return [
        {
            key: "id",
            label: t("colAppNo"),
            width: "170px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                    {row.id}
                </span>
            ),
        },
        {
            key: "buildingName",
            label: t("colBuilding"),
            width: "220px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {row.buildingName}
                </span>
            ),
        },
        {
            key: "submissionDate",
            label: t("colSubmission"),
            width: "160px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <div className="flex flex-col gap-0.5 text-slate-700">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{row.submissionDate}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 pl-4.5">
                        {row.submissionTime}
                    </span>
                </div>
            ),
        },
        {
            key: "slaRemaining",
            label: t("colSla"),
            width: "180px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-3",
            cellClassName: "!py-3.5 !px-3",
            render: (_val, row) => {
                if (row.isOverdue) {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-medium whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span>{row.slaRemaining}</span>
                        </div>
                    );
                }
                if (row.status === "rejected") {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-medium whitespace-nowrap">
                            <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span>{row.slaRemaining}</span>
                        </div>
                    );
                }
                if (row.status === "certified") {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium whitespace-nowrap">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{row.slaRemaining}</span>
                        </div>
                    );
                }
                if (row.status === "compliance_pending") {
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-medium whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{row.slaRemaining}</span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{row.slaRemaining}</span>
                    </div>
                );
            },
        },
        {
            key: "occupancyName",
            label: t("colOccupancy"),
            width: "180px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-slate-800">
                        {row.occupancyName}
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                        {row.occupancyGroup}
                    </span>
                </div>
            ),
        },
        {
            key: "applicantName",
            label: t("colApplicant"),
            width: "170px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{row.applicantName}</span>
                </div>
            ),
        },
        {
            key: "status",
            label: t("colStatus"),
            width: "170px",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4",
            cellClassName: "!py-3.5 !px-4",
            render: (_val, row) => (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 whitespace-nowrap shadow-2xs">
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDotColor(row.status, row.isOverdue))} />
                    <span>{row.statusLabel}</span>
                </div>
            ),
        },
        {
            key: "appId",
            label: t("colDocs"),
            width: "100px",
            align: "center",
            headerClassName: "!text-[11px] !font-bold !text-slate-500 !uppercase !tracking-wider !py-3 !px-4 text-center",
            cellClassName: "!py-3.5 !px-4 text-center",
            render: (_val, row) => (
                <Button
                    variant="ghost"
                    size="xs"
                    icon={FileText}
                    onClick={() => onViewDocs(row.id)}
                    className="h-7 px-2.5 !rounded-lg text-xs font-medium !text-slate-700 !bg-white hover:!bg-slate-50 !border !border-slate-200/90 shadow-2xs whitespace-nowrap cursor-pointer"
                    title={t("btnDocs")}
                >
                    {t("btnDocs")}
                </Button>
            ),
        },
    ];
}
