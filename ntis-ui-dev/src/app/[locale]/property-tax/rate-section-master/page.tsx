
import RateSectionContent from '@/components/modules/property-tax/rate-section-master/RateSectionContent';
import { getRateSectionsAction, getWardsByRateAction, getWardTotalCountAction, getRateSectionTotalCountAction, getRateSectionByIdAction, getAllRateSectionDetailsAction, getAllWardsForLinkAction, getRateSectionDetailsByIdAction, getSelectedWardsWithCountAction, getWardsPagedWithSearchAction, getWardByIdAction, getAllRateSectionsForSelectAction } from './actions';
import { ConfirmProvider } from '@/components/common';
import type { SectionItem, RateItem } from '@/types/rateSectionMaster.types';
import type { WardItem } from '@/types/wardMaster.types';

interface PageProps {
  searchParams: Promise<{
    ratesectionpage?: string;
    ratesectionpagesize?: string;
    wardpage?: string;
    wardpagesize?: string;
    wardq?: string;
    zone?: string;
    q?: string;
    ward?: string;
    id?: string;
    action?: string;
    availablewardpage?: string;
    availablewardpagesize?: string;
    selectedwardpage?: string;
    selectedwardpagesize?: string;
    availablewardq?: string;
    viewwardq?: string;
    viewwardpage?: string;
    viewwardpagesize?: string;
    editWard?: string;
    addWard?: string;
  }>;
}

/** Pagination constraints – must stay in sync with the server action */
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps all query-string parameters before they reach the
 * server action. Malformed values (e.g. ?ratesectionpage=-1&wardpagesize=999)
 * are silently normalized to safe defaults so the page renders instead of
 * crashing into the error boundary.
 */
function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  // Helper function to parse and clamp pagination values
  const clampPage = (value: string | undefined): number => {
    const parsed = parseInt(value ?? "", 10);
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, MIN_PAGE), MAX_PAGE)
      : MIN_PAGE;
  };

  const clampPageSize = (value: string | undefined): number => {
    const parsed = parseInt(value ?? "", 10);
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  };

  return {
    // Rate section pagination
    rateSectionPageNumber: clampPage(raw.ratesectionpage),
    rateSectionPageSize: clampPageSize(raw.ratesectionpagesize),
    rateSectionSearchTerm: raw.q?.trim() || undefined,

    // Ward pagination
    wardPageNumber: clampPage(raw.wardpage),
    wardPageSize: clampPageSize(raw.wardpagesize),
    wardSearchTerm: raw.wardq?.trim() || undefined,

    // View all wards pagination
    viewWardPageNumber: clampPage(raw.viewwardpage),
    viewWardPageSize: clampPageSize(raw.viewwardpagesize),
    viewWardSearchTerm: raw.viewwardq?.trim() || undefined,

    // Available wards search
    availableWardSearchTerm: raw.availablewardq?.trim() || undefined,

    // Other parameters (pass through as-is, but trim strings)
    zone: raw.zone?.trim(),
    ward: raw.ward?.trim(),
    rateSectionDetailsId: raw.id?.trim(),
    action: raw.action?.trim(),
    editWard: raw.editWard?.trim(),
    addWard: raw.addWard?.trim(),
  };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const sanitized = sanitizeParams(params);
  
  const rateSectionDetailsId = sanitized.rateSectionDetailsId;
  const pageNumber = sanitized.rateSectionPageNumber;
  const pageSize = sanitized.rateSectionPageSize;
  const rateSectionSearchTerm = sanitized.rateSectionSearchTerm;

  // Fetch all rate sections (paged) with optional search
  const response = await getRateSectionsAction(pageNumber, pageSize, rateSectionSearchTerm);
  const allZones: RateItem[] = response.items ?? [];
  const filteredRateSectionCount = response.totalCount ?? allZones.length; // Count for pagination (filtered)

  // Fetch global total rate sections count (for dashboard card)
  const totalRateRes = await getRateSectionTotalCountAction();
  const totalRateSectionCount =
    (totalRateRes.success && typeof totalRateRes.data === "number")
      ? totalRateRes.data
      : filteredRateSectionCount; // Fallback to filtered count

  // Fetch total wards count
  const wardsCountRes = await getWardTotalCountAction();
  const totalWardsCount = wardsCountRes.data ?? 0;

  // Only fetch Link Ward drawer data when drawer is open (addWard param present)
  const isAddWardDrawerOpen = sanitized.addWard !== undefined;
  
  // Search terms for Available Wards and View All tabs (separate)
  const availableWardSearchTerm = sanitized.availableWardSearchTerm;
  const viewAllWardSearchTerm = sanitized.viewWardSearchTerm;
  const viewWardPage = sanitized.viewWardPageNumber;
  const viewWardPageSize = sanitized.viewWardPageSize;
  
  let allWardsForLink: { id: string; wardNo: string; name: string }[] = [];
  let allWardsForLinkTotalCount = 0;
  let viewAllWardsData: { id: string; wardNo: string; name: string }[] = [];
  let viewAllWardsTotalCount = 0;
  let viewAllWardsTotalPages = 0;
  let allRateSectionsForLabels: RateItem[] = [];
  const ssrWardAssignmentsMap: Record<string, { rateSectionNo: string; id: number; description: string }> = {};

  if (isAddWardDrawerOpen) {
    // SSR: Pre-fetch ALL wards for Available tab (with optional search)
    const allWardsRes = await getAllWardsForLinkAction(availableWardSearchTerm);
    if (allWardsRes.success && allWardsRes.data) {
      allWardsForLink = allWardsRes.data;
      allWardsForLinkTotalCount = allWardsRes.totalCount || allWardsRes.data.length;
    }
    
    // SSR: Pre-fetch paginated wards for View All tab (with optional search)
    const viewAllWardsRes = await getWardsPagedWithSearchAction(viewWardPage, viewWardPageSize, viewAllWardSearchTerm);
    if (viewAllWardsRes.success && viewAllWardsRes.data) {
      viewAllWardsData = viewAllWardsRes.data;
      viewAllWardsTotalCount = viewAllWardsRes.totalCount || viewAllWardsRes.data.length;
      viewAllWardsTotalPages = viewAllWardsRes.totalPages || Math.ceil(viewAllWardsTotalCount / viewWardPageSize);
    }

    // SSR: Pre-fetch ALL rate section details (ward assignments) for Link Ward drawer
    let allRateSectionDetails: SectionItem[] = [];
    const allDetailsRes = await getAllRateSectionDetailsAction();
    if (allDetailsRes.success && allDetailsRes.data) {
      allRateSectionDetails = allDetailsRes.data;
    }

    // SSR: Pre-fetch ALL rate sections for ward assignment labels
    const allRateSectionsRes = await getRateSectionsAction(1, 1000);
    if (allRateSectionsRes?.items) {
      allRateSectionsForLabels = allRateSectionsRes.items;
    }

    // Build ward assignments map (wardNo -> rate section info)
    const rateSectionIdToInfo: Record<number, { rateSectionId: number; description: string }> = {};
    allRateSectionsForLabels.forEach(rate => {
      if (rate.id) {
        rateSectionIdToInfo[rate.id] = {
          rateSectionId: rate.id,
          description: rate.description || ""
        };
      }
    });

    allRateSectionDetails.forEach(detail => {
      const wardNo = (detail.wardNo || detail["WardNo"]) as string | undefined;
      const rateSectionId = detail.rateSectionId as number | undefined;
      const detailId = (detail.id) as number | undefined;
      
      if (wardNo && rateSectionId && typeof wardNo === 'string') {
        const rateInfo = rateSectionIdToInfo[rateSectionId];
        const rateSectionIdStr = String(rateInfo?.rateSectionId || rateSectionId);
        const description = rateInfo?.description || "";
        // IMPORTANT: Store the RateSectionDetails PK (detailId) here, not the rateSectionId
        ssrWardAssignmentsMap[wardNo] = { rateSectionNo: rateSectionIdStr, id: detailId || 0, description };
      }
    });
  }

  // Determine selected zone from URL or default to first
  const paramZone = sanitized.zone;
  let selectedZoneNo = paramZone ?? null;
  let selectedZoneLabel: string | undefined;
  let fetchId: number | undefined;

  if (paramZone) {
    const zoneInCurrentPage = allZones.find(
      (z: RateItem) => String(z.id) === String(paramZone)
    );

    if (zoneInCurrentPage) {
      fetchId = zoneInCurrentPage.id;
      selectedZoneLabel = zoneInCurrentPage.description
        ? `${zoneInCurrentPage.id} - ${zoneInCurrentPage.description}`
        : String(zoneInCurrentPage.id);
    } else {
      const allRatesRes = await getAllRateSectionsForSelectAction();
      const zoneInAll = allRatesRes.data?.find(z => String(z.id) === String(paramZone));
      
      if (zoneInAll) {
        fetchId = zoneInAll.id;
        selectedZoneNo = String(zoneInAll.id) ?? null;
        selectedZoneLabel = zoneInAll.description
          ? `${zoneInAll.id} - ${zoneInAll.description}`
          : String(zoneInAll.id) ?? undefined;
      } else {
        const zoneData = await getRateSectionByIdAction(Number(paramZone));
        if (zoneData.success && zoneData.data) {
          fetchId = zoneData.data.id;
          selectedZoneNo = String(zoneData.data.id) ?? null;
          selectedZoneLabel = zoneData.data.description
            ? `${zoneData.data.id} - ${zoneData.data.description}`
            : String(zoneData.data.id) ?? undefined;
        }
      }
    }
  } else if (allZones.length > 0) {
    const firstZone = allZones[0];
    selectedZoneNo = String(firstZone.id) ?? null;
    fetchId = firstZone.id;
    selectedZoneLabel = firstZone.description
      ? `${firstZone.id} - ${firstZone.description}`
      : String(firstZone.id);
  }

  // Fetch wards for the selected rate section (SSR)
  let initialWards: SectionItem[] = [];
  let initialWardsTotalCount = 0;

  if (rateSectionDetailsId && sanitized.ward) {
    const detailsRes = await getRateSectionDetailsByIdAction(rateSectionDetailsId, sanitized.ward);
    if (detailsRes.success && detailsRes.data) {
      initialWards = detailsRes.data;
    }
  }

  if (fetchId) {
    const wardPage = sanitized.wardPageNumber;
    const wardPageSize = sanitized.wardPageSize;
    const wardSearch = sanitized.wardSearchTerm;

    const wardsRes = await getWardsByRateAction(
      fetchId,
      wardPage,
      wardPageSize,
      wardSearch
    );

    if (wardsRes.success && Array.isArray(wardsRes.data)) {
      // Merge with any existing data and deduplicate by rateSectionDetailsId
      const mergedWards = [...initialWards, ...(wardsRes.data as SectionItem[])];
      const seenRateSectionDetailsIds = new Set<number>();

      initialWards = mergedWards.filter((ward) => {
        const key = ward.id;
        if (key && seenRateSectionDetailsIds.has(key)) {
          return false;
        }
        if (key) {
          seenRateSectionDetailsIds.add(key);
        }
        return true;
      });
      
      initialWardsTotalCount = wardsRes.totalCount || 0;
    }
  }

  // Avoid SSR N+1 ward-count prefetching.
  // Populate only the currently selected rate section's count from the data
  // already fetched above; other counts should be resolved on demand.
  const initialWardCounts: Record<string, number> = {};
  if (fetchId) {
    const selectedZone = allZones.find((zone: RateItem) => zone.id === fetchId);
    const selectedZoneId = String(selectedZone?.id ?? '');
    if (selectedZoneId) {
      initialWardCounts[selectedZoneId] = initialWardsTotalCount;
    }
  }

  // Pre-fetch ward data for EditWard (SSR) - avoids client-side API call
  let editWardData: WardItem | undefined;
  if (sanitized.editWard && sanitized.ward) {
    try {
      const wardResult = await getWardByIdAction(Number(sanitized.ward));
      if (wardResult.success && wardResult.data) {
        editWardData = wardResult.data;
      }
    } catch {
      // Silently fail - EditWard will handle missing data gracefully
    }
  }

  // SSR: Pre-fetch ALL wards for the selected rate section (for AddWard's "selected" panel)
  // Only fetch when drawer is open
  let ssrSelectedWards: string[] = [];
  let ssrSelectedWardsTotalCount = 0;
  
  if (isAddWardDrawerOpen) {
    // Fetch selected wards for the rate section (for "Wards in Rate Section" panel)
    if (fetchId) {
      const selectedWardsRes = await getSelectedWardsWithCountAction(fetchId);
      if (selectedWardsRes.success) {
        ssrSelectedWardsTotalCount = selectedWardsRes.totalCount;
        ssrSelectedWards = selectedWardsRes.wardNos;
      }
    }
  }

  return (
    <ConfirmProvider>
      <RateSectionContent
        rates={allZones}
        sections={initialWards}
        sectionsTotalCount={initialWardsTotalCount}
        totalRateSectionCount={totalRateSectionCount}
        filteredRateSectionCount={filteredRateSectionCount}
        totalWardsCount={totalWardsCount}
        initialWardCounts={initialWardCounts}
        initialSelectedRateSection={selectedZoneNo || undefined}
        initialSelectedRateSectionLabel={selectedZoneLabel}
        initialEditWardData={editWardData}
        // SSR pre-fetched data for Link Ward drawer
        ssrAllWards={allWardsForLink}
        ssrAllWardsCount={allWardsForLinkTotalCount}
        ssrWardAssignments={ssrWardAssignmentsMap}
        ssrAllRateSections={allRateSectionsForLabels}
        ssrSelectedWards={ssrSelectedWards}
        ssrSelectedWardsTotalCount={ssrSelectedWardsTotalCount}
        // View All Wards tab SSR data (paginated with search)
        ssrViewAllWards={viewAllWardsData}
        ssrViewAllWardsTotalCount={viewAllWardsTotalCount}
        ssrViewAllWardsTotalPages={viewAllWardsTotalPages}
      />
    </ConfirmProvider>
  );
}
