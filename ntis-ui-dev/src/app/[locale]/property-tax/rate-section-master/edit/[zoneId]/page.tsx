
import RateSectionForm from "@/components/modules/property-tax/rate-section-master/ratesection/RateSectionForm";
import { getRateSectionsAction, getWardsByRateAction, getWardTotalCountAction, getRateSectionTotalCountAction, getRateSectionByIdAction } from "../../actions";
import { ConfirmProvider } from "@/components/common";
import { notFound } from "next/navigation";
import React from "react";
import type { SectionItem, RateItem } from "@/types/rateSectionMaster.types";
import RateSectionContent from "@/components/modules/property-tax/rate-section-master/RateSectionContent";

interface PageProps {
  params: Promise<{
    zoneId: string;
  }>;
  searchParams: Promise<{
    ratesectionpage?: string;
    ratesectionpagesize?: string;
    wardpage?: string;
    wardpagesize?: string;
    zone?: string;
    q?: string;
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

    // Other parameters (pass through as-is, but trim strings)
    zone: raw.zone?.trim(),
  };
}

export default async function EditRateSectionPage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { zoneId: zoneIdParam } = await params;
  const sp = await searchParams;
  const sanitized = sanitizeParams(sp);
  
  // Parse and validate the ID (Next.js route params are always strings)
  const zoneId = Number(zoneIdParam);
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    notFound();
  }

  // Fetch data server-side for edit form
  let rateData: RateItem;
  try {
    const editResult = await getRateSectionByIdAction(zoneId);
    if (!editResult.success || !editResult.data) {
      notFound();
    }
    rateData = editResult.data;
  } catch (error) {
    // Only map a genuine 404 to Next.js's notFound().
    // Other failures (auth, timeout, server error) rethrow so error.tsx
    // can display a meaningful message instead of a misleading 404 page.
    // If error has a statusCode property and is 404, treat as not found
    if (typeof error === "object" && error && "statusCode" in error && (error as { statusCode: number }).statusCode === 404) {
      notFound();
    }
    // Rethrow — Next.js will catch this and render the nearest error.tsx
    throw error;
  }

  // --- Data Fetching for RateSectionMaster (Background List) ---
  const pageNumber = sanitized.rateSectionPageNumber;
  const pageSize = sanitized.rateSectionPageSize;
  const rateSectionSearchTerm = sanitized.rateSectionSearchTerm;

  // Fetch all rate sections (paged, filtered)
  const response = await getRateSectionsAction(pageNumber, pageSize, rateSectionSearchTerm);
  const allZones: RateItem[] = response.items ?? [];

  // Fetch global total rate sections count (independent of search/filter)
  const totalRateRes = await getRateSectionTotalCountAction();
  const totalRateSectionCount =
    (totalRateRes.success && typeof totalRateRes.data === "number")
      ? totalRateRes.data
      : (response?.totalCount ?? allZones.length);

  // Fetch total wards count
  const wardsCountRes = await getWardTotalCountAction();
  const totalWardsCount = wardsCountRes.data ?? 0;

  // Determine selected zone (from URL or default to first)
  const paramZone = sanitized.zone;
  let selectedZoneNo = paramZone;
  let fetchId: number | undefined;

  // If we have zones, try to find the matching one to get the correct ID for fetching
  if (allZones.length > 0) {
    if (selectedZoneNo) {
      // User requested a specific zone, find its correct ID for fetching
      const matchedZone = allZones.find((z: RateItem) => 
        String(z.id) === String(selectedZoneNo)
      );
      if (matchedZone) {
        fetchId = matchedZone.id;
      }
    } else {
      // Default to first zone
      const firstZone = allZones[0];
      selectedZoneNo = String(firstZone.id);
      fetchId = firstZone.id;
    }
  }

  // Fetch wards for the selected rate section (SSR)
  let initialWards: SectionItem[] = [];
  let initialWardsTotalCount = 0;
  
  if (fetchId) {
    const wardPage = sanitized.wardPageNumber;
    const wardPageSize = sanitized.wardPageSize;
    
    const wardsRes = await getWardsByRateAction(fetchId, wardPage, wardPageSize);
    if (wardsRes.success && Array.isArray(wardsRes.data)) {
      initialWards = wardsRes.data as SectionItem[];
      initialWardsTotalCount = wardsRes.totalCount || 0;
    }
  }

  // Avoid SSR N+1 ward-count prefetching.
  // Populate only the currently selected rate section's count from the data
  // already fetched above; other counts should be resolved on demand.
  const initialWardCounts: Record<string, number> = {};
  if (fetchId) {
    const selectedZone = allZones.find((zone: RateItem) => zone.id === fetchId);
    const selectedZoneIdForCount = String(selectedZone?.id ?? '');
    if (selectedZoneIdForCount) {
      initialWardCounts[selectedZoneIdForCount] = initialWardsTotalCount;
    }
  }

  return (
    <ConfirmProvider>
      <div className="relative">
        {/* Render the Master List in Background */}
        <RateSectionContent
          rates={allZones}
          sections={initialWards}
          sectionsTotalCount={initialWardsTotalCount}
          totalRateSectionCount={rateSectionSearchTerm ? response.totalCount : totalRateSectionCount}
          totalWardsCount={totalWardsCount}
          initialWardCounts={initialWardCounts}
          selectedRateSectionId={selectedZoneNo}
          ssrAllWards={[]}
          ssrAllWardsCount={0}
          ssrWardAssignments={{}}
          ssrAllRateSections={[]}
          ssrSelectedWards={[]}
          ssrSelectedWardsTotalCount={0}
          ssrViewAllWards={[]}
          ssrViewAllWardsTotalCount={0}
          ssrViewAllWardsTotalPages={0}
        />
        
        {/* Render the Edit Drawer on Top - pass initialData for SSR */}
        <RateSectionForm
          mode="edit"
          open={true}
          zoneId={String(zoneId)}
          initialData={rateData}
          rates={[rateData]}
        />
      </div>
    </ConfirmProvider>
  );
}
