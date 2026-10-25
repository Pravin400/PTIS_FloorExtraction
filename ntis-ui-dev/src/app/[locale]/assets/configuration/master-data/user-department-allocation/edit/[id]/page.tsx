import React from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import {
  fetchUserForAllocationByIdAction,
  fetchAllocationOptionsAction,
  fetchWardsByZoneAction,
} from "../../action";
import { UserDepartmentAllocationEditWrapper } from "@/components/modules/assets/configuration/master-data/user-department-allocation";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  GrievanceWorkflowStageOption,
} from "@/types/asset-masters/user-department-allocation.types";

const logger = createLogger("EditUserDepartmentAllocationPage");

interface EditAllocationPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ step?: string; zoneId?: string }>;
}

export default async function EditAllocationPage({
  params,
  searchParams,
}: EditAllocationPageProps): Promise<React.ReactElement> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { locale, id } = resolvedParams;
  setRequestLocale(locale);

  const userId = Number(id);
  if (!Number.isFinite(userId) || userId <= 0) {
    notFound();
  }

  let user: AssetUserListItem | null = null;
  let options: {
    owningDepartments: OwningDepartmentOption[];
    zones: ZoneOption[];
    stages: GrievanceWorkflowStageOption[];
  } = { owningDepartments: [], zones: [], stages: [] };

  try {
    const [fetchedUser, fetchedOptions] = await Promise.all([
      fetchUserForAllocationByIdAction(userId),
      fetchAllocationOptionsAction(),
    ]);
    user = fetchedUser;
    options = fetchedOptions;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch user allocation details", { userId }, error);
    throw error;
  }

  if (!user) {
    notFound();
  }

  const rawStep = resolvedSearchParams?.step;
  const initialStep: 1 | 2 | 3 = rawStep === "2" ? 2 : rawStep === "3" ? 3 : 1;
  const rawZoneId = resolvedSearchParams?.zoneId ? Number(resolvedSearchParams.zoneId) : null;
  const parsedZoneId = rawZoneId && Number.isFinite(rawZoneId) && rawZoneId > 0 ? rawZoneId : null;

  // Determine target zone for Step 2
  const targetZoneId =
    parsedZoneId ??
    user.zoneAllocations?.[0]?.zoneId ??
    (options.zones.length > 0 ? options.zones[0].id : null);

  // Pre-fetch Wards on SSR if Step 2 is requested
  const initialWardsByZone: Record<number, WardOption[]> = {};
  if (initialStep === 2 && targetZoneId) {
    try {
      const wards = await fetchWardsByZoneAction(targetZoneId);
      initialWardsByZone[targetZoneId] = wards;
    } catch (err) {
      logger.warn("Failed to prefetch wards on SSR for zone", { targetZoneId }, err);
    }
  }

  return (
    <UserDepartmentAllocationEditWrapper
      user={user}
      owningDepartments={options.owningDepartments}
      zones={options.zones}
      stages={options.stages}
      initialStep={initialStep}
      initialZoneId={targetZoneId ?? undefined}
      initialWardsByZone={initialWardsByZone}
    />
  );
}
