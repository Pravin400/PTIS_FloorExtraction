"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Select } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import {
  AssessmentYearRange,
  AssessmentYearRangeConfig,
  AssessmentYearRangeMasterProps,
  getAssessmentYearRangeId,
} from "@/types/assessment-year-range.types";
import { getAssessmentYearRangeColumns } from "./AssessmentYearRangeColumns";
import { useAssessmentYearRangePagination } from "@/hooks/useAssessmentYearRangePagination";

interface AssessmentYearRangeMasterComponentProps<T extends AssessmentYearRange>
  extends AssessmentYearRangeMasterProps<T> {
  config: AssessmentYearRangeConfig;
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export function AssessmentYearRangeMaster<T extends AssessmentYearRange>({
  config,
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
  deleteAction,
}: AssessmentYearRangeMasterComponentProps<T>): React.ReactElement {
  const router = useRouter();
  const t = useTranslations(config.translationNamespace);
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.entity"));
  const values = React.useMemo(
    () => ({ assessment: assessmentLabel, entity: assessmentLabel }),
    [assessmentLabel]
  );

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();

  const { changePage, handlePageSizeChange, handleSort, paginationInfo } = useAssessmentYearRangePagination({
    config,
    pageNumber,
    pageSize,
    totalCount,
    sortBy,
    sortOrder,
    locale,
    startTransition,
  });

  const columns = getAssessmentYearRangeColumns<T>(
    t,
    tCommon,
    sortBy,
    sortOrder,
    handleSort,
    assessmentLabel
  );

  const handleEdit = useCallback(
    (row: T) => {
      const id = getAssessmentYearRangeId(row);
      startTransition(() => {
        router.push(`/${locale}${config.routePath}/edit/${id}`);
      });
    },
    [router, locale, config.routePath, startTransition]
  );

  const handleDelete = useCallback(
    (row: T) => {
      const id = getAssessmentYearRangeId(row);
      const fromYear = row.fromYear;
      const toYear = row.toYear;
      
      confirm({
        variant: "delete",
        title: `${t("list.table.fromYear", values)}: ${fromYear} - ${t("list.table.toYear", values)}: ${toYear}`,
        description: t("delete.confirmDescription", values),
        meta: { name: `${fromYear} - ${toYear}` },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(id));
          const result = await deleteAction(fd);
          if (result.success) {
            toast.success(t("success.deleted", { fromYear, toYear, ...values }));
            startTransition(() => router.refresh());
          } else {
            const errorMessage =
              result.statusCode === 409 ? t("apiErrors.referredInYearRange", values) :
              result.statusCode === 404 ? t("apiErrors.notFound", values) :
              result.message || tCommon("errors.deleteError");
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon, deleteAction, startTransition, values]
  );

  const { start, end, total } = paginationInfo;

  return (
    <MasterTable<T>
      columns={columns}
      data={data}
      loading={isPending}
      height="lg"
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={changePage}
      renderActions={(row) => (
        <>
          <EditButton aria-label={tCommon("table.actions.edit")} onClick={() => handleEdit(row)} />
          <DeleteButton aria-label={tCommon("table.actions.delete")} onClick={() => handleDelete(row)} />
        </>
      )}
      actionLabel={tCommon("table.columns.actions")}
      paginationConfig={{ enabled: true, showPageSizeSelector: false }}
      footerLeftContent={
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {total} {tCommon("table.entries")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
            <Select
              value={String(pageSize)}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              options={[10, 20, 30, 40, 50].map((s) => ({ label: String(s), value: String(s) }))}
              selectSize="sm"
              className="w-20"
              ariaLabel={tCommon("table.rowsPerPage") || "Rows per page"}
            />
          </div>
        </div>
      }
      getRowKey={(row) => String(getAssessmentYearRangeId(row))}
    />
  );
}
