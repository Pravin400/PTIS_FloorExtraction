"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShieldAlert, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/common/PageContainer";
import TableHeader from "@/components/common/TableHeader";
import { MasterTable } from "@/components/common/MasterTable";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Button } from "@/components/common";
import type {
  WaterPenaltyRuleDto,
  WaterPenaltyRuleMasterProps,
} from "@/types/water-bill/penalty-rule-master.types";
import type { LookupOption, FinancialYearLookupOption } from "@/types/water-bill/lookups.types";
import { getPenaltyRuleColumns } from "./penaltyRuleColumns";
import { PenaltyRuleFilters } from "./PenaltyRuleFilters";
import { PenaltyRuleUserManualModal } from "./PenaltyRuleUserManualModal";
import { PenaltyRuleRowActions } from "./PenaltyRuleRowActions";
import { exportPenaltyRules } from "@/lib/utils/water-export";
import { PenaltyRuleFormDrawer } from "./PenaltyRuleFormDrawer";
import {
  deletePenaltyRuleAction,
  fetchFinancialYearLookupOptionsAction,
  fetchConnectionCategoryLookupOptionsAction,
  fetchGeographyLookupOptionsAction,
  fetchChargeHeadLookupOptionsAction,
} from "@/app/[locale]/water-bill/penalty-rule-master/action";
import {
  usePenaltyRuleSearch,
  usePenaltyRulePagination,
} from "@/hooks/water-bill/penalty-rule-master";

export function PenaltyRuleMaster(props: Readonly<WaterPenaltyRuleMasterProps>): React.ReactElement {
  const { data, totalCount, pageNumber, pageSize, totalPages } = props;
  const sortedData = useMemo(() => {
    return [...(data ?? [])].sort(
      (a, b) => (a.penaltyRuleId ?? a.id ?? 0) - (b.penaltyRuleId ?? b.id ?? 0)
    );
  }, [data]);

  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("waterPenaltyRule");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const [asyncFinancialYearOptions, setAsyncFinancialYearOptions] = useState<FinancialYearLookupOption[]>([]);
  const [asyncConnectionCategoryOptions, setAsyncConnectionCategoryOptions] = useState<LookupOption[]>([]);
  const [asyncGeographyOptions, setAsyncGeographyOptions] = useState<LookupOption[]>([]);
  const [asyncChargeHeadOptions, setAsyncChargeHeadOptions] = useState<LookupOption[]>([]);

  const financialYearOptions = (props.financialYearOptions && props.financialYearOptions.length > 0)
    ? props.financialYearOptions
    : asyncFinancialYearOptions;
  const connectionCategoryOptions = (props.connectionCategoryOptions && props.connectionCategoryOptions.length > 0)
    ? props.connectionCategoryOptions
    : asyncConnectionCategoryOptions;
  const geographyOptions = (props.geographyOptions && props.geographyOptions.length > 0)
    ? props.geographyOptions
    : asyncGeographyOptions;
  const chargeHeadOptions = (props.chargeHeadOptions && props.chargeHeadOptions.length > 0)
    ? props.chargeHeadOptions
    : asyncChargeHeadOptions;

  useEffect(() => {
    if (!props.financialYearOptions || props.financialYearOptions.length === 0) {
      fetchFinancialYearLookupOptionsAction().then(setAsyncFinancialYearOptions).catch(() => { });
    }
    if (!props.connectionCategoryOptions || props.connectionCategoryOptions.length === 0) {
      fetchConnectionCategoryLookupOptionsAction().then(setAsyncConnectionCategoryOptions).catch(() => { });
    }
    if (!props.geographyOptions || props.geographyOptions.length === 0) {
      fetchGeographyLookupOptionsAction().then(setAsyncGeographyOptions).catch(() => { });
    }
    if (!props.chargeHeadOptions || props.chargeHeadOptions.length === 0) {
      fetchChargeHeadLookupOptionsAction().then(setAsyncChargeHeadOptions).catch(() => { });
    }
  }, [props.financialYearOptions, props.connectionCategoryOptions, props.geographyOptions, props.chargeHeadOptions]);

  const [manualOpen, setManualOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const {
    searchTerm,
    financialYearId,
    connectionCategoryId,
    geographyUnitId,
    chargeHeadId,
    penaltyType,
    statusFilter,
    handleSearchChange,
    handleFinancialYearChange,
    handleConnectionCategoryChange,
    handleGeographyChange,
    handleChargeHeadChange,
    handlePenaltyTypeChange,
    handleStatusFilterChange,
    handleReset,
  } = usePenaltyRuleSearch({
    pageSize,
    locale,
    startTransition,
    basePath: "/water-bill/penalty-rule-master",
    initialFilters: {
      searchTerm: props.searchTerm,
      financialYearId: props.financialYearId,
      connectionCategoryId: props.connectionCategoryId ?? undefined,
      geographyUnitId: props.geographyUnitId,
      chargeHeadId: props.chargeHeadId,
      penaltyType: props.penaltyType,
      statusFilter: props.statusFilter,
    },
  });

  const { changePage } = usePenaltyRulePagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    startTransition,
    basePath: "/water-bill/penalty-rule-master",
  });

  const handleDelete = (row: WaterPenaltyRuleDto) => {
    confirm({
      variant: "delete",
      title: t("confirm.deleteTitle") || "Delete Penalty Rule?",
      description: t("confirm.deleteDesc") || "Are you sure you want to delete this penalty rule? This action cannot be undone.",
      meta: {
        name: `${row.connectionCategoryName || (row.connectionCategoryId ? `Cat #${row.connectionCategoryId}` : "All Categories")} (${row.penaltyType}, Day ${row.fromDay}-${row.toDay ?? "∞"})`,
      },
      onConfirm: async () => {
        const targetId = row.penaltyRuleId ?? row.id;
        if (!targetId) return;
        const res = await deletePenaltyRuleAction(targetId);
        if (res.success) {
          toast.success(t("messages.deleteSuccess") || "Penalty rule deleted successfully");
          startTransition(() => router.refresh());
        } else {
          toast.error(res.error || "Failed to delete penalty rule");
        }
      },
    });
  };

  const columns = getPenaltyRuleColumns(t);

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("title") || "Penalty Rules"}
          subtitle={t("subtitle") || "Effective-dated current/pending bill penalty rules by category, geography and charge head."}
          icon={ShieldAlert}
          actionLabel={(t("add") || "Add Penalty Rule").replace(/^\+\s*/, "")}
          onActionClick={() => {
            setIsAddDrawerOpen(true);
            startTransition(() => {
              router.push(`/${locale}/water-bill/penalty-rule-master/add`);
            });
          }}
          rightContent={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={BookOpen}
                onClick={() => setManualOpen(true)}
                title={t("userManual") || "User Manual"}
              >
                {t("userManual") || "User Manual"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => exportPenaltyRules(sortedData)}
                title={t("export") || "Export"}
              >
                {t("export") || "Export"}
              </Button>
            </div>
          }
        />

        <PenaltyRuleFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          financialYearId={financialYearId}
          onFinancialYearChange={handleFinancialYearChange}
          connectionCategoryId={connectionCategoryId}
          onCategoryChange={handleConnectionCategoryChange}
          geographyUnitId={geographyUnitId}
          onGeographyChange={handleGeographyChange}
          chargeHeadId={chargeHeadId}
          onChargeHeadChange={handleChargeHeadChange}
          penaltyType={penaltyType}
          onPenaltyTypeChange={handlePenaltyTypeChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onReset={handleReset}
          t={t}
          financialYearOptions={financialYearOptions}
          connectionCategoryOptions={connectionCategoryOptions}
          geographyOptions={geographyOptions}
          chargeHeadOptions={chargeHeadOptions}
        />

        <MasterTable<WaterPenaltyRuleDto>
          columns={columns}
          data={sortedData}
          loading={isPending}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          renderActions={(row: WaterPenaltyRuleDto) => (
            <PenaltyRuleRowActions
              row={row}
              onEdit={(r) => {
                startTransition(() => {
                  router.push(`/${locale}/water-bill/penalty-rule-master/edit/${r.penaltyRuleId}`);
                });
              }}
              onDelete={handleDelete}
            />
          )}
          actionLabel={tCommon("table.columns.actions") || "Actions"}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          getRowKey={(row) => String(row.penaltyRuleId)}
          tableClassName="w-full text-xs table-auto"
        />

        <PenaltyRuleUserManualModal open={manualOpen} onClose={() => setManualOpen(false)} />

        {isAddDrawerOpen && (
          <PenaltyRuleFormDrawer
            open={true}
            onClose={() => {
              setIsAddDrawerOpen(false);
              startTransition(() => {
                router.push(`/${locale}/water-bill/penalty-rule-master`);
              });
            }}
            initialData={null}
            financialYearOptions={financialYearOptions}
            connectionCategoryOptions={connectionCategoryOptions}
            geographyOptions={geographyOptions}
            chargeHeadOptions={chargeHeadOptions}
          />
        )}
      </div>
    </PageContainer>
  );
}

export default PenaltyRuleMaster;
