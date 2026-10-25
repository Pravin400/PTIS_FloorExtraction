import CombinePropertyForm from "@/components/modules/property-tax/ptis/combineproperty/CombinePropertyForm";
import { fetchCombinePropertiesPagedAction, fetchCombinePropertiesHistoryAction, fetchPropertyCombineDetailsAction } from "./action";
import { fetchPropertyTypePagedServerAction } from "../../propertytype/action";
import { CombinePropertyItem } from "@/types/combine-property.types";
import { PropertyType } from "@/types/property-type.types";
import { PropertyCombineDetails } from "@/types/combine-property.types";
import { PagedResponse } from "@/types/common.types";

/** Use pageSize = -1 to fetch all records (supported by the action) */
const ALL_RECORDS_PAGE_SIZE = -1;

interface PageProps {
  searchParams: Promise<{
    basePropertyId?: string;
    wardId?: string;
    wardNo?: string;
    propertyNo?: string;
    basePartitionNo?: string;
    categoryId?: string;
    societyDetailId?: string;
    showHistory?: string;
    partitionNo?: string;
    combinePartitionNo?: string;
    propertyNos?: string;
    historyPage?: string;
    historySize?: string;
    detailsPropertyId?: string;
    detailsPage?: string;
    detailsSize?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { basePropertyId, wardId, wardNo, propertyNo, basePartitionNo, categoryId, societyDetailId, showHistory, combinePartitionNo, propertyNos, partitionNo, historyPage, historySize, detailsPropertyId, detailsPage, detailsSize } = params;

  // ── 1. Fetch base property list (filtered by ward if available) ─────────
  const baseResult = await fetchCombinePropertiesPagedAction({
    pageNumber: 1,
    pageSize: ALL_RECORDS_PAGE_SIZE,
    ...(wardId ? { wardId: Number(wardId) } : {}),
  });
  const basePropertyList: CombinePropertyItem[] = baseResult.items ?? [];

  // ── 1.5. Resolve the correct basePropertyId ───────────
  let resolvedBasePropertyId = basePropertyId;
  let artificialBaseItem: CombinePropertyItem | undefined;

  if (basePropertyId && !basePropertyList.some(item => String(item.id) === basePropertyId)) {
    // The basePropertyId was not found in the initial paginated list (due to 5000 max records).
    // We explicitly fetch the properties for this propertyNo to find the exact basePropertyId.
    if (propertyNo) {
      try {
        const explicitResult = await fetchCombinePropertiesPagedAction({
          pageNumber: 1,
          pageSize: ALL_RECORDS_PAGE_SIZE, // Fetch all partitions for this property to find the exact one
          ...(wardId ? { wardId: Number(wardId) } : {}),
          propertyNo: propertyNo,
        });
        
        const exactMatch = explicitResult.items?.find(item => String(item.id) === basePropertyId);
        if (exactMatch) {
          resolvedBasePropertyId = String(exactMatch.id);
          artificialBaseItem = exactMatch;
        } else {
          // If the exact ID is not in the explicit fetch, construct it manually from the URL parameters
          // so that it can still be selected as the base property.
          resolvedBasePropertyId = basePropertyId;
          artificialBaseItem = {
            id: Number(basePropertyId),
            wardId: Number(wardId),
            wardNo: wardNo || '',
            propertyNo: propertyNo,
            fromProperty: partitionNo || '', 
            toProperty: partitionNo || '',
            isActive: true,
            createdDate: null,
            updatedDate: null,
            categoryId: categoryId ? Number(categoryId) : undefined,
            societyDetailId: societyDetailId ? Number(societyDetailId) : undefined,
          };
        }
      } catch {
        // Fallback on error
        resolvedBasePropertyId = basePropertyId;
        artificialBaseItem = {
          id: Number(basePropertyId),
          wardId: Number(wardId),
          wardNo: wardNo || '',
          propertyNo: propertyNo,
          fromProperty: partitionNo || '',
          toProperty: partitionNo || '',
          isActive: true,
          createdDate: null,
          updatedDate: null,
          categoryId: categoryId ? Number(categoryId) : undefined,
          societyDetailId: societyDetailId ? Number(societyDetailId) : undefined,
        };
      }
    } else {
      resolvedBasePropertyId = undefined;
    }
  }

  // If we fetched an artificial base item because it was missing from the main list, add it
  if (artificialBaseItem && !basePropertyList.some(i => i.id === artificialBaseItem!.id)) {
    basePropertyList.unshift(artificialBaseItem);
  }

  // ── 2. If a base property is selected, fetch its sub-properties ───────────
  let subPropertyList: CombinePropertyItem[] = [];
  if (resolvedBasePropertyId && propertyNo && wardId) {
    let partitionChar = basePartitionNo;
    let effectiveCategoryId: number | undefined = categoryId ? Number(categoryId) : undefined;
    let effectiveSocietyDetailId: number | undefined = societyDetailId ? Number(societyDetailId) : undefined;

    const selected = basePropertyList.find((item) => String(item.id) === resolvedBasePropertyId);
    if (selected) {
      if (!partitionChar && selected.fromProperty) {
        partitionChar = selected.fromProperty.replace(/[^A-Za-z]/g, '');
      }
      if (!effectiveCategoryId && selected.categoryId) {
        effectiveCategoryId = selected.categoryId;
      }
      if (!effectiveSocietyDetailId && selected.societyDetailId) {
        effectiveSocietyDetailId = selected.societyDetailId;
      }
    }

    const subResult = await fetchCombinePropertiesPagedAction({
      pageNumber: 1,
      pageSize: ALL_RECORDS_PAGE_SIZE,
      wardId: Number(wardId),
      propertyNo: propertyNo,
      ...(partitionChar ? { partitionNo: partitionChar } : {}),
      ...(effectiveCategoryId ? { categoryId: effectiveCategoryId } : {}),
      ...(effectiveSocietyDetailId ? { societyDetailId: effectiveSocietyDetailId } : {}),
    });
    subPropertyList = subResult.items ?? [];
  }

  // ── 3. Fetch property types for the dropdown ─────────
  const propertyTypeResult = await fetchPropertyTypePagedServerAction(1, ALL_RECORDS_PAGE_SIZE);
  const propertyTypeList: PropertyType[] = propertyTypeResult.items ?? [];

  // ── 4. Fetch history data if requested ─────────
  let historyData: PagedResponse<PropertyCombineDetails> | undefined;
  const isShowHistory = showHistory !== 'false';
  if (isShowHistory && wardId) {
    historyData = await fetchCombinePropertiesHistoryAction({
      wardId: Number(wardId),
      propertyNo: propertyNo,
      partitionNo: partitionNo,
      pageNumber: historyPage ? Number(historyPage) : 1,
      pageSize: historySize ? Number(historySize) : 10,
    });
  }

  // ── 4.5 Fetch details history data if requested ─────────
  let historyDetailsData: PagedResponse<PropertyCombineDetails> | undefined;
  if (detailsPropertyId) {
    historyDetailsData = await fetchCombinePropertiesHistoryAction({
      sourcePropertyId: Number(detailsPropertyId),
      pageNumber: detailsPage ? Number(detailsPage) : 1,
      pageSize: detailsSize ? Number(detailsSize) : 10,
    });
  }

  // ── 5. Fetch review data if combinePartitionNo is present in URL ─────────
  let initialReviewData: PropertyCombineDetails[] = [];
  if (wardId && propertyNos && combinePartitionNo && !isShowHistory) {
    try {
      const data = await fetchPropertyCombineDetailsAction({
        wardId: Number(wardId),
        propertyNo: propertyNos,
        partitionNo: combinePartitionNo,
      });

      initialReviewData = [...data].sort((a, b) => {
        const isABase = String(a.propertyId) === basePropertyId;
        const isBBase = String(b.propertyId) === basePropertyId;
        if (isABase && !isBBase) return -1;
        if (!isABase && isBBase) return 1;
        return 0;
      });
    } catch {
      initialReviewData = [];
    }
  }

  return (
    <CombinePropertyForm
      basePropertyList={basePropertyList}
      subPropertyList={subPropertyList}
      propertyTypeList={propertyTypeList}
      selectedBasePropertyId={resolvedBasePropertyId}
      selectedWardId={wardId}
      selectedWardNo={wardNo}
      selectedPropertyNo={propertyNo}
      showHistory={isShowHistory}
      historyData={historyData}
      historyDetailsData={historyDetailsData}
      initialReviewData={initialReviewData}
    />
  );
}