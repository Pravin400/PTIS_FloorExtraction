import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PenaltyRuleMaster } from "@/components/modules/water-bill/penalty-rule-master/PenaltyRuleMaster";
import { PenaltyRuleFormDrawer } from "@/components/modules/water-bill/penalty-rule-master/PenaltyRuleFormDrawer";
import {
  fetchPenaltyRulesAction,
  fetchPenaltyRuleByIdAction,
  fetchFinancialYearLookupOptionsAction,
  fetchConnectionCategoryLookupOptionsAction,
  fetchGeographyLookupOptionsAction,
  fetchChargeHeadLookupOptionsAction,
} from "../../action";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Penalty Rule | Water-Bill",
  description: "Update Water Bill penalty rule parameters.",
};

interface EditPageProps {
  params: Promise<{
    penaltyId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditPenaltyRulePage({
  params,
  searchParams,
}: EditPageProps): Promise<React.ReactElement> {
  const { penaltyId: rawId } = await params;
  const ruleId = Number(rawId);
  if (!Number.isFinite(ruleId) || ruleId <= 0) {
    notFound();
  }

  const queryParams = searchParams ? await searchParams : {};
  const page = Number(queryParams?.page ?? 1) || 1;
  const pageSize = Number(queryParams?.pageSize ?? 10) || 10;
  const searchTerm = typeof queryParams?.q === "string" ? queryParams.q : undefined;
  const financialYearId = queryParams?.financialYearId ? Number(queryParams.financialYearId) : undefined;
  const connectionCategoryId = queryParams?.connectionCategoryId ? Number(queryParams.connectionCategoryId) : undefined;
  const geographyUnitId = queryParams?.geographyUnitId ? Number(queryParams.geographyUnitId) : undefined;
  const chargeHeadId = queryParams?.chargeHeadId ? Number(queryParams.chargeHeadId) : undefined;
  const penaltyType = typeof queryParams?.penaltyType === "string" ? queryParams.penaltyType : undefined;
  const statusParam = typeof queryParams?.status === "string" ? queryParams.status : undefined;
  const isActive = statusParam === "active" ? true : statusParam === "inactive" ? false : undefined;

  let result;
  try {
    result = await fetchPenaltyRulesAction({
      pageNumber: page,
      pageSize,
      searchTerm,
      financialYearId,
      connectionCategoryId,
      geographyUnitId,
      chargeHeadId,
      penaltyType,
      isActive,
    });
  } catch (error) {
    console.warn("Penalty Rules Edit Page: fetch action failed", error);
    result = {
      items: [],
      totalCount: 0,
      pageNumber: page,
      pageSize,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }

  let initialData: WaterPenaltyRuleDto | null = null;
  try {
    initialData = await fetchPenaltyRuleByIdAction(ruleId);
  } catch (error) {
    console.warn("Penalty Rules Edit Page: fetch by ID failed", error);
    notFound();
  }

  if (!initialData) {
    notFound();
  }

  const [
    financialYearOptions,
    connectionCategoryOptions,
    geographyOptions,
    chargeHeadOptions,
  ] = await Promise.all([
    fetchFinancialYearLookupOptionsAction().catch(() => []),
    fetchConnectionCategoryLookupOptionsAction().catch(() => []),
    fetchGeographyLookupOptionsAction().catch(() => []),
    fetchChargeHeadLookupOptionsAction().catch(() => []),
  ]);

  return (
    <>
      <PenaltyRuleMaster
        data={result.items ?? []}
        totalCount={result.totalCount ?? 0}
        pageNumber={result.pageNumber ?? 1}
        pageSize={result.pageSize ?? 10}
        totalPages={result.totalPages ?? 1}
        searchTerm={searchTerm}
        financialYearId={financialYearId}
        connectionCategoryId={connectionCategoryId}
        geographyUnitId={geographyUnitId}
        chargeHeadId={chargeHeadId}
        penaltyType={penaltyType}
        statusFilter={statusParam === "active" ? "active" : statusParam === "inactive" ? "inactive" : "all"}
        financialYearOptions={financialYearOptions}
        connectionCategoryOptions={connectionCategoryOptions}
        geographyOptions={geographyOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
      <PenaltyRuleFormDrawer
        open={true}
        initialData={initialData}
        financialYearOptions={financialYearOptions}
        connectionCategoryOptions={connectionCategoryOptions}
        geographyOptions={geographyOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
    </>
  );
}
