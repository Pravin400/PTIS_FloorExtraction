"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Select } from "@/components/common";
import {
  AssessmentYearRange,
  AssessmentYearRangeConfig,
  AssessmentYearRangeMasterProps,
  getAssessmentYearRangeId,
} from "@/types/asset-masters/assessment-year-range.types";
import { getAssessmentYearRangeColumns } from "./AssessmentYearRangeColumns";
import { useAssessmentYearRangePagination } from "@/hooks/asset-masters/assessmentYearRange/useAssessmentYearRangePagination";
import { translateAssessmentYearRangeReferenceError } from "@/hooks/asset-masters/assessmentYearRange/useAssessmentYearRangeForm";

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
    handleSort
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
        title: `${t("list.table.fromYear")}: ${fromYear} - ${t("list.table.toYear")}: ${toYear}`,
        description: t("delete.confirmDescription"),
        meta: { name: `${fromYear} - ${toYear}` },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(id));
          const result = await deleteAction(fd);
          if (result.success) {
            toast.success(t("success.deleted", { fromYear, toYear }));
            startTransition(() => router.refresh());
          } else {
            const referenceMessage = translateAssessmentYearRangeReferenceError(result.message, t);
            if (referenceMessage) {
              toast.error(referenceMessage);
              return;
            }
            const isForeignKeyOrUseError =
              result.statusCode === 409 ||
              result.statusCode === 500 ||
              (typeof result.message === "string" && (
                result.message.includes("An error occurred") ||
                result.message.includes("Something went wrong") ||
                result.message.includes("FOREIGN KEY") ||
                result.message.includes("REFERENCE constraint") ||
                result.message.includes("conflicted") ||
                result.message.includes("in use")
              ));

            const errorMessage =
              isForeignKeyOrUseError ? t("apiErrors.inUse") :
                result.statusCode === 404 ? t("apiErrors.notFound") :
                  result.message || tCommon("errors.deleteError");
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon, deleteAction, startTransition]
  );

  const { start, end, total } = paginationInfo;

  return (
    <MasterTable<T>
      theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
      footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
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
              options={[5, 10, 20, 50, 100].map((s) => ({ label: String(s), value: String(s) }))}
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
