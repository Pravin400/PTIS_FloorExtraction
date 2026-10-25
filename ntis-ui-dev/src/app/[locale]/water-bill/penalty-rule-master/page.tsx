import React from "react";
import type { Metadata } from "next";
import { PenaltyRuleMaster } from "@/components/modules/water-bill/penalty-rule-master/PenaltyRuleMaster";
import {
  fetchPenaltyRulesAction,
  fetchFinancialYearLookupOptionsAction,
  fetchConnectionCategoryLookupOptionsAction,
  fetchGeographyLookupOptionsAction,
  fetchChargeHeadLookupOptionsAction,
} from "./action";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("WaterPenaltyRuleMaster");

export const metadata: Metadata = {
  title: "Penalty Rule Master | Water-Bill",
  description: "Effective-dated current/pending bill penalty rules by category, geography and charge head.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const pageSize = Number(params.pageSize ?? 10) || 10;
  const searchTerm = typeof params.q === "string" ? params.q : undefined;
  const financialYearId = params.financialYearId ? Number(params.financialYearId) : undefined;
  const connectionCategoryId = params.connectionCategoryId ? Number(params.connectionCategoryId) : undefined;
  const geographyUnitId = params.geographyUnitId ? Number(params.geographyUnitId) : undefined;
  const chargeHeadId = params.chargeHeadId ? Number(params.chargeHeadId) : undefined;
  const penaltyType = typeof params.penaltyType === "string" ? params.penaltyType : undefined;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
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
    logger.warn("Penalty Rules Page: fetch action failed", undefined, error);
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
  );
}
