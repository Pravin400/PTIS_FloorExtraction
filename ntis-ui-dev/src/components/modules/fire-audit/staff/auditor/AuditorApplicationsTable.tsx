"use client";

/**
 * Auditor Applications Table Component
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorApplicationsTable.tsx
 *
 * Applications data grid with MasterTable, skeleton loaders, and action triggers.
 * Line ceiling: <= 300 lines.
 */

import { useMemo, memo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  MasterTable,
  type Column,
} from "@/components/common";
import type { AuditorApplication } from "@/types/fire-audit/auditor.types";
import { cn } from "@/lib/utils/cn";
import { History, FileText, ArrowRight, AlertCircle, RotateCcw } from "lucide-react";
import { getAuditorApplicationColumns } from "./AuditorApplicationColumns";
import { useAuditorFilters } from "@/hooks/fire-audit/auditor";

// =============================================================================
// 1. Skeleton Loaders (Desktop Table & Mobile)
// =============================================================================

export interface AuditorTableSkeletonProps {
  columns: Column<AuditorApplication>[];
}

export function AuditorTableSkeleton({ columns: _columns }: AuditorTableSkeletonProps) {
  return (
    <>
      {/* Mobile Card Skeleton */}
      <div className="block lg:hidden divide-y divide-slate-100 p-3 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            data-testid="auditor-table-mobile-skeleton"
            padding="none"
            className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </Card>
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div
        data-testid="auditor-table-desktop-skeleton"
        className="hidden lg:block p-4 space-y-3 animate-pulse"
      >
        <div className="h-10 w-full rounded-xl bg-slate-100" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 w-full rounded-xl bg-slate-50 border border-slate-100"
          />
        ))}
      </div>
    </>
  );
}

// =============================================================================
// 2. Main AuditorApplicationsTable Component
// =============================================================================

export interface AuditorApplicationsTableProps {
  applications?: AuditorApplication[];
  loading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  className?: string;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onStartScrutiny?: (id: string) => void;
  onViewHistory?: (id: string) => void;
  onViewDocs?: (id: string) => void;
}

function AuditorApplicationsTableComponent({
  applications = [],
  loading = false,
  error = null,
  onRetry,
  className,
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onStartScrutiny,
  onViewHistory,
  onViewDocs,
}: AuditorApplicationsTableProps) {
  const t = useTranslations("fireAudit.auditorDashboard.table");
  const tStatus = useTranslations("fireAudit.auditorDashboard.statuses");
  const tFields = useTranslations("fireAudit.auditorDashboard.filterFields");
  const {
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    sortBy,
    sortOrder,
    isPending,
  } = useAuditorFilters();

  const effectivePageChange = onPageChange ?? handlePageChange;
  const effectivePageSizeChange = onPageSizeChange ?? handlePageSizeChange;
  const effectiveLoading = loading || isPending;

  const baseColumns = useMemo(
    () =>
      getAuditorApplicationColumns({
        t,
        tStatus,
        tFields,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [t, tStatus, tFields, sortBy, sortOrder, handleSort]
  );

  const tableColumns = useMemo<Column<AuditorApplication>[]>(
    () => [
      ...baseColumns,
      {
        key: "docs",
        label: t("colDocs"),
        align: "center",
        width: "96px",
        headerClassName: "w-24 text-center",
        cellClassName: "py-3.5 px-4 text-center",
        render: (_, app) => (
          <Button
            variant="outline"
            size="xs"
            icon={FileText}
            onClick={() => onViewDocs?.(app.id)}
            className="rounded-lg text-xs font-semibold text-[#1A86E8] bg-sky-50 hover:bg-sky-100/80 border-sky-200 shadow-2xs whitespace-nowrap px-2.5 py-1 h-auto cursor-pointer"
            title={t("btnDocs")}
          >
            {t("btnDocs")}
          </Button>
        ),
      },
    ],
    [baseColumns, t, onViewDocs]
  );

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs",
        className
      )}
    >
      {/* Table Header Banner: Applications Title + Subtitle */}
      <CardHeader className="p-4 border-b border-slate-100 mb-0">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            {t("title")}
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("showingRecords", { count: applications.length })}
          </p>
        </div>
      </CardHeader>

      {error ? (
        <div
          data-testid="auditor-table-error"
          className="p-8 text-center flex flex-col items-center justify-center gap-3"
        >
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {t("error")}
            </h3>
            {typeof error === "string" ? (
              <p className="text-xs text-slate-500 max-w-md">{error}</p>
            ) : error instanceof Error && error.message ? (
              <p className="text-xs text-slate-500 max-w-md">{error.message}</p>
            ) : null}
          </div>
          {onRetry ? (
            <Button
              variant="outline"
              size="xs"
              icon={RotateCcw}
              onClick={onRetry}
              className="mt-2 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t("retry")}
            </Button>
          ) : null}
        </div>
      ) : effectiveLoading && applications.length === 0 ? (
        <AuditorTableSkeleton columns={baseColumns} />
      ) : (
        <MasterTable<AuditorApplication>
          cardClassName="!border-0 !rounded-none !shadow-none !bg-transparent"
          containerClassName="!gap-0"
          maxBodyHeightClassName="max-h-none"
          tableClassName="w-full min-w-[1250px] divide-y divide-slate-100 text-left text-xs [&_td]:!py-3.5 [&_td]:!px-4 [&_td:last-child]:!text-right [&_td:last-child>div]:!justify-end [&_td:last-child>div]:!gap-1.5"
          theadClassName="!bg-slate-50/75 !bg-none border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider [&_th]:!text-[11px] [&_th]:!font-bold [&_th]:!text-slate-500 [&_th]:!uppercase [&_th]:!tracking-wider [&_th]:!py-3 [&_th]:!px-4 [&_th:last-child]:!text-right [&_th:last-child]:!min-w-[190px]"
          rowClassName={() => "hover:!bg-slate-50/60 !border-slate-100 transition-colors"}
          columns={tableColumns}
          data={applications}
          loading={false}
          emptyText={t("empty")}
          actionLabel={t("colAction")}
          renderActions={(app) => (
            <>
              <Button
                variant="primary"
                size="xs"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onStartScrutiny?.(app.id)}
                className="bg-[#D94A27] hover:bg-[#b83c1d] border-transparent font-bold text-xs"
              >
                {t("btnStartScrutiny")}
              </Button>

              <Button
                variant="outline"
                size="xs"
                icon={History}
                onClick={() => onViewHistory?.(app.id)}
                title={t("btnHistory")}
              >
                {t("btnHistory")}
              </Button>
            </>
          )}
          getRowKey={(row, i) => row.id || i}
          pageNumber={page}
          pageSize={pageSize}
          totalCount={totalCount ?? applications.length}
          onPageChange={effectivePageChange}
          onPageSizeChange={effectivePageSizeChange}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        />
      )}
    </Card>
  );
}

export const AuditorApplicationsTable = memo(AuditorApplicationsTableComponent);
