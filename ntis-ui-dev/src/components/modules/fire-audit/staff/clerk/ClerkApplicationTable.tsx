"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ClerkApplicationItem } from "@/types/fire-audit/clerk.types";
import { MasterTable, Button } from "@/components/common";
import { History, Upload } from "lucide-react";
import { getClerkTableColumns } from "./ClerkTableColumns";

interface ClerkApplicationTableProps {
    applications: ClerkApplicationItem[];
    currentPage?: number;
    pageSize?: number;
    totalCount?: number;
    onPageChange?: (page: number) => void;
    onStartScrutiny: (id: string) => void;
    onViewHistory: (id: string) => void;
    onViewDocs: (id: string) => void;
    onOpenProceedModal?: (app: ClerkApplicationItem) => void;
}

export function ClerkApplicationTable({
    applications,
    currentPage = 1,
    pageSize = 10,
    totalCount = 0,
    onPageChange,
    onStartScrutiny,
    onViewHistory,
    onViewDocs,
    onOpenProceedModal,
}: ClerkApplicationTableProps) {
    const t = useTranslations("fireAudit.clerk.table");
    const tActions = useTranslations("fireAudit.clerk.actions");

    // Localized Unicode & Memory-Safe CSV Export functionality
    const handleExport = () => {
        if (!applications.length) return;
        const headers = [
            t("colAppNo"),
            t("colBuilding"),
            t("colCouncilCode"),
            t("colSubmission"),
            t("colSubmissionTime"),
            t("colSla"),
            t("colOccupancy"),
            t("colApplicant"),
            t("colStatus"),
        ];

        const rows = applications.map((app) => [
            app.id,
            `"${(app.buildingName || "").replace(/"/g, '""')}"`,
            app.councilCode,
            app.submissionDate,
            app.submissionTime,
            app.slaRemaining,
            `"${app.occupancyName} (${app.occupancyGroup})"`,
            `"${(app.applicantName || "").replace(/"/g, '""')}"`,
            app.statusLabel,
        ]);

        const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
        // UTF-8 BOM (\uFEFF) ensures Excel renders Marathi/Hindi Unicode characters accurately
        const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `fire_audit_applications_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Columns structured via decomposed ClerkTableColumns
    const columns = useMemo(() => getClerkTableColumns(t, onViewDocs), [t, onViewDocs]);

    // Contextual action button renderer based on application status & SLA (matching Image 2)
    const renderActions = (row: ClerkApplicationItem) => {
        const handleActionTrigger = () => {
            if (onOpenProceedModal) {
                onOpenProceedModal(row);
            } else {
                onStartScrutiny(row.id);
            }
        };

        const renderPrimaryAction = () => {
            // 1. SLA Overdue (Solid Red #d94a27)
            if (row.isOverdue) {
                return (
                    <Button
                        variant="primary"
                        size="xs"
                        onClick={handleActionTrigger}
                        className="!bg-[#d94a27] hover:!bg-[#b83d1f] !text-white !border-transparent font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    >
                        {tActions("expedite")}
                    </Button>
                );
            }

            // 2. Application Rejected (Clean White Button with Border)
            if (row.status === "rejected") {
                return (
                    <Button
                        variant="secondary"
                        size="xs"
                        onClick={handleActionTrigger}
                        className="!bg-white hover:!bg-slate-50 !text-slate-700 !border-slate-200 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                    >
                        {tActions("viewRejection")}
                    </Button>
                );
            }

            // 3. Surveyor Assigned (Clean White Button with Border)
            if (row.status === "survey_scheduled") {
                return (
                    <Button
                        variant="secondary"
                        size="xs"
                        onClick={handleActionTrigger}
                        className="!bg-white hover:!bg-slate-50 !text-slate-700 !border-slate-200 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                    >
                        {tActions("viewSchedule")}
                    </Button>
                );
            }

            // 4. Verify Report Pending (Solid Dark Navy)
            if (row.status === "review_forward") {
                return (
                    <Button
                        variant="primary"
                        size="xs"
                        onClick={handleActionTrigger}
                        className="!bg-[#0f172a] hover:!bg-slate-800 !text-white !border-transparent font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    >
                        {tActions("verifyReport")}
                    </Button>
                );
            }

            // 5. Compliance Pending (15-Day Scrutiny Notice - Clean Button with Amber Accents)
            if (row.status === "compliance_pending") {
                return (
                    <Button
                        variant="secondary"
                        size="xs"
                        onClick={handleActionTrigger}
                        className="!bg-white hover:!bg-amber-50/60 !text-amber-800 !border-amber-200/80 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                    >
                        {tActions("viewNotice")}
                    </Button>
                );
            }

            // 6. Fresh Application / Scrutiny (Solid Dark Navy)
            return (
                <Button
                    variant="primary"
                    size="xs"
                    onClick={handleActionTrigger}
                    className="!bg-[#0f172a] hover:!bg-slate-800 !text-white !border-transparent font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                >
                    {tActions("startScrutiny")}
                </Button>
            );
        };

        return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                {renderPrimaryAction()}

                <Button
                    variant="secondary"
                    size="xs"
                    icon={History}
                    onClick={() => onViewHistory(row.id)}
                    title={t("btnHistory")}
                    className="!border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700 shadow-2xs font-semibold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                    {t("btnHistory")}
                </Button>
            </div>
        );
    };

    // Custom Header Banner: Applications Title + Export Button pinned to far right
    const headerBanner = (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
            <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                onClick={handleExport}
                className="!rounded-xl !border-slate-200 !bg-white hover:!bg-slate-50 px-3 py-1.5 text-xs font-semibold !text-slate-700 shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
                {t("btnExport")}
            </Button>
        </div>
    );

    const hasPagination = (totalCount || applications.length) > pageSize;

    return (
        <MasterTable<ClerkApplicationItem>
            data={applications}
            columns={columns}
            getRowKey={(row) => row.id}
            headerExtra={headerBanner}
            renderActions={renderActions}
            actionLabel={t("colAction")}
            actionHeaderAlign="right"
            actionCellAlign="right"
            emptyText={t("noRecordsFound")}
            pageNumber={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={Math.ceil((totalCount || 1) / pageSize)}
            onPageChange={onPageChange}
            paginationConfig={{ enabled: hasPagination, showPageSizeSelector: false }}
            footerLeftContent={
                <span className="text-xs text-slate-500 font-medium">
                    {t("showingEntries", {
                        count: applications.length,
                        total: totalCount || applications.length,
                    })}
                </span>
            }
            cardClassName="overflow-hidden rounded-2xl !border-sky-200/80 bg-white shadow-xs [&>div:first-child]:!bg-white [&>div:first-child]:!border-b [&>div:first-child]:!border-sky-100/70 [&>div:first-child]:!p-4"
            footerClassName="!bg-white !border-t !border-sky-100/70 !px-4 !py-3"
            rowClassName={() => "bg-white hover:bg-sky-50/30 transition-colors"}
            tableClassName="min-w-[1250px]"
            theadClassName="!bg-none !bg-sky-50/40 !border-b !border-sky-100/70 [&_th]:!text-[11px] [&_th]:!font-bold [&_th]:!text-slate-500 [&_th]:!uppercase [&_th]:!tracking-wider [&_th]:!py-3.5 [&_th]:!px-4"
        />
    );
}

