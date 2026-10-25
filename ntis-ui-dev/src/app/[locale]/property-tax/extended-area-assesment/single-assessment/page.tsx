import React from "react";
import { SingleAssessmentScreen } from "@/components/modules/property-tax/extended-area-assessment/SingleAssessmentScreen";
import { getFinancialYearsPaged } from "@/lib/api/financial-year.service";
import { getUseGroupsPagedServer } from "@/lib/api/typeofusegroup.service";
import {
  searchSection129PropertyByUpicAction,
  searchSection129PropertyByOldGpNoAction,
  getWardsDropdownAction,
  getPropertyOptionsByWardAction,
  type Section129ActionResult,
  type WardDropdownOption,
  type WardPropertyOptionDto,
} from "./action";
import type { SelectOption } from "@/types/extended-area-assessment.types";

export const dynamic = "force-dynamic";

interface SingleAssessmentPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Section 129A single-property assessment — search a property by UPIC, then view/apply
 * its year-wise schedule via the real API (see `useSingleAssessment` / `action.ts`).
 *
 * Search input values (e.g. `?upic=...`, `?wardId=...`, `?propertyId=...`)
 * are passed via URL query parameters, driving Next.js server-side data fetching.
 */
export default async function Page({ searchParams }: SingleAssessmentPageProps): Promise<React.ReactElement> {
  const resolvedParams = await searchParams;

  const getParam = (key: string): string => {
    const val = resolvedParams?.[key];
    if (typeof val === "string") return val.trim();
    if (Array.isArray(val)) return val[0]?.trim() ?? "";
    return "";
  };

  const upic = getParam("upic");
  const oldGpNo = getParam("oldGpNo");
  const wardId = getParam("wardId");
  const propertyId = getParam("propertyId");

  const searchTarget = upic;

  const [
    initialCurrentFinancialYear,
    usageTypeOptions,
    initialSearchResult,
    wardRes,
  ] = await Promise.all([
    getFinancialYearsPaged(1, -1)
      .then((res) => res.items?.find((y) => y.isActive) ?? null)
      .then((active) => (active ? (active.yearCode ?? `${active.year}-${String((active.year + 1) % 100).padStart(2, "0")}`) : null))
      .catch(() => null),
    getUseGroupsPagedServer({ pageNumber: 1, pageSize: -1 })
      .then((res) => (res.items ?? []).map((g): SelectOption => ({ label: g.groupName, value: g.groupName })))
      .catch(() => [] as SelectOption[]),
    searchTarget
      ? searchSection129PropertyByUpicAction(searchTarget)
      : oldGpNo
        ? searchSection129PropertyByOldGpNoAction(oldGpNo)
        : Promise.resolve<Section129ActionResult | null>(null),
    getWardsDropdownAction().catch(() => ({ success: false, data: [] as WardDropdownOption[] })),
  ]);

  const initialWards = wardRes?.success ? wardRes.data : [];

  // The Ward/Property No cascading dropdowns are normally seeded from their own URL params (the
  // dropdown-driven search path) — but a UPIC/Old GP Number search resolves a property without
  // ever touching those params, which left the dropdowns blank even though a property was found.
  // Fall back to the schedule's own `wardId`/`propertyId` (present regardless of which search path
  // resolved it) so the dropdown reflects the same property the read-only fields already show —
  // this is more reliable than re-deriving the ward from the formatted `zone` display string,
  // which only the UPIC path ever attempted anyway (Old GP Number search left it unresolved).
  let effectiveWardId = wardId;
  if (!effectiveWardId && initialSearchResult?.success && initialSearchResult.data) {
    effectiveWardId = String(initialSearchResult.data.wardId);
  }
  let effectivePropertyId = propertyId;
  if (!effectivePropertyId && initialSearchResult?.success && initialSearchResult.data) {
    effectivePropertyId = String(initialSearchResult.data.propertyId);
  }

  const effectiveWardIdNum = Number(effectiveWardId);

  const wardPropertiesRes = effectiveWardIdNum
    ? await getPropertyOptionsByWardAction(effectiveWardIdNum).catch(() => ({ success: false, data: [] as WardPropertyOptionDto[] }))
    : { success: false, data: [] as WardPropertyOptionDto[] };

  const initialWardProperties = wardPropertiesRes?.success && wardPropertiesRes.data ? wardPropertiesRes.data : [];

  return (
    <SingleAssessmentScreen
      initialUpic={upic}
      initialOldGpNo={oldGpNo}
      initialWardId={effectiveWardId}
      initialPropertyId={effectivePropertyId}
      initialWards={initialWards}
      initialWardProperties={initialWardProperties}
      initialSearchResult={initialSearchResult}
      initialCurrentFinancialYear={initialCurrentFinancialYear}
      usageTypeOptions={usageTypeOptions}
    />
  );
}

