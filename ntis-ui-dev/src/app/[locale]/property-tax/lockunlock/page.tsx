import React from "react";
import LockUnlockMaster from "@/components/modules/property-tax/lockunlock/LockUnlockMaster";
import { fetchWardsPagedAction, fetchZonesPagedAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { getLockUnlockScreensAction, fetchLockUnlockPropertiesPagedAction, fetchLockUnlockPropertiesByCategoryAction, getLockUnlockModulesAction } from "./action";
import { LockUnlockPropertyItem } from "@/types/lockunlock.types";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {

  let dropdownProperties: { label: string; value: string; propertyId?: number; propertyNo?: string; partitionNo?: string; }[] = [];
  let properties: LockUnlockPropertyItem[] = [];
  let initialPagination:
    | {
      pageNumber: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    }
    | undefined;

  const params = await searchParams;
  const wardId = params?.wardId;
  const fromProperty = params?.fromProperty;
  const toProperty = params?.toProperty;
  const moduleIdStr = params?.moduleId;
  
  const moduleIdParam = moduleIdStr && moduleIdStr !== "ALL" ? (moduleIdStr as string) : undefined;

  const [zonesResult, wardsResult, screensResult, modulesResult] = await Promise.all([
    fetchZonesPagedAction(1, 100),
    fetchWardsPagedAction(1, -1),
    getLockUnlockScreensAction(moduleIdParam),
    getLockUnlockModulesAction(1, -1),
  ]);
  const zones = zonesResult.items || [];
  const wards = wardsResult.items || [];
  const screens = screensResult || [];
  const modules = modulesResult || [];

  // Fetch dropdown properties on the server ONLY if wardId is already in the URL
  if (wardId && typeof wardId === "string") {
    const dropdownResponse = await fetchLockUnlockPropertiesPagedAction({
      WardId: Number(wardId),
      PageNumber: 1,
      PageSize: -1,
    });
    const seen = new Set<string>();
    dropdownProperties = (dropdownResponse.items || [])
      .map((prop) => {
        const normalizedPartitionNo = String(prop.partitionNo ?? "").trim();
        const hasPartition =
          normalizedPartitionNo !== "" &&
          normalizedPartitionNo !== "0" &&
          normalizedPartitionNo !== "-";
        const displayValue = hasPartition
          ? `${prop.propertyNo}-${normalizedPartitionNo}`
          : prop.propertyNo;

        return {
          label: displayValue,
          value: displayValue,
          propertyId: prop.propertyId,
          propertyNo: prop.propertyNo,
          partitionNo: prop.partitionNo,
        };
      })
      .filter((option) => {
        if (seen.has(option.value)) {
          return false;
        }
        seen.add(option.value);
        return true;
      });
  }
  const showParam = Array.isArray(params?.show) ? params?.show[0] : params?.show;
  const show = showParam === 'true';

  const searchParam = Array.isArray(params?.search) ? params?.search[0] : params?.search;
  const pageParam = Array.isArray(params?.pageNumber) ? params?.pageNumber[0] : params?.pageNumber;
  const pageSizeParam = Array.isArray(params?.pageSize) ? params?.pageSize[0] : params?.pageSize;
  const searchCategoryParam = Array.isArray(params?.searchCategory) ? params?.searchCategory[0] : params?.searchCategory;
  const zoneIdParam = Array.isArray(params?.zoneId) ? params?.zoneId[0] : params?.zoneId;
  const propertyNosParam = Array.isArray(params?.propertyNos) ? params?.propertyNos[0] : params?.propertyNos;

  const pageNum = pageParam ? Number(pageParam) : 1;
  const pageSz = pageSizeParam ? Number(pageSizeParam) : 10;
  const searchCategory = searchCategoryParam ? Number(searchCategoryParam) : 1;

  const normalizedSearch = searchParam ? searchParam.replace(/\s*-\s*/g, "-").trim() : undefined;

  // Fetch filtered properties when show=true and valid parameters for the category exist
  if (show) {
    let isValid = false;
    const queryParams: Record<string, unknown> = {
      SearchCategory: searchCategory,
      SearchTerm: normalizedSearch,
      PageNumber: pageNum,
      PageSize: pageSz,
    };

    if (searchCategory === 1 && zoneIdParam) {
      isValid = true;
      queryParams.ZoneId = Number(zoneIdParam);
    } else if (searchCategory === 2 && wardId) {
      isValid = true;
      queryParams.WardId = Number(wardId);
    } else if (searchCategory === 3 && wardId && propertyNosParam) {
      isValid = true;
      queryParams.WardId = Number(wardId);
      
      const propArray = (propertyNosParam as string).split(",");
      const basePropertyNos = new Set<string>();
      const partitions = new Set<string>();
      
      for (const propStr of propArray) {
        const parts = propStr.split("-");
        const propNo = parts[0];
        const partition = parts.length > 1 ? parts.slice(1).join("-") : "";
        if (propNo) basePropertyNos.add(propNo);
        if (partition) partitions.add(partition);
      }
      
      if (basePropertyNos.size > 0) {
        queryParams.PropertyNo = Array.from(basePropertyNos).join(",");
      }
      if (partitions.size > 0) {
        const partitionStr = Array.from(partitions).join(",");
        queryParams.PartitionNo = partitionStr;
        queryParams.SearchPartitionNo = partitionStr;
      }
    } else if (searchCategory === 4 && wardId && fromProperty && toProperty) {
      isValid = true;
      queryParams.WardId = Number(wardId);
      queryParams.PropertyFrom = fromProperty as string;
      queryParams.PropertyTo = toProperty as string;
    }

    if (isValid) {
      const propertiesResponse = await fetchLockUnlockPropertiesByCategoryAction(queryParams);
      properties = propertiesResponse.items || [];
      initialPagination = {
        pageNumber: propertiesResponse.pageNumber,
        pageSize: propertiesResponse.pageSize,
        totalCount: propertiesResponse.totalCount,
        totalPages: propertiesResponse.totalPages,
      };
    }
  }

  return (
    <main className="w-full flex-1  bg-[#F4F7F9]">
      <div className="">
        <LockUnlockMaster
          zones={zones}
          wards={wards}
          dropdownProperties={dropdownProperties}
          screens={screens}
          modules={modules}
          initialProperties={properties}
          initialPagination={initialPagination}
        />
      </div>
    </main>
  );
}

