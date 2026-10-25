import React from "react";
import { MoujaSubZoneMaster } from "@/components/modules/assets/configuration/master-data/mouja-subzone-master/MoujaSubZoneMaster";
import { fetchMoujasPagedServerAction, fetchSubZonesPagedServerAction } from "./action";

interface PageProps {
  searchParams: Promise<{
    moujaPn?: string;
    moujaPs?: string;
    subZonePn?: string;
    subZonePs?: string;
    moujaSearch?: string;
    subZoneSearch?: string;
    moujaSortBy?: string;
    moujaSortOrder?: string;
    subZoneSortBy?: string;
    subZoneSortOrder?: string;
    moujaId?: string;
  }>;
}

const ALLOWED_MOUJA_SORT = ["moujaNo", "moujaName"] as const;
const ALLOWED_SUBZONE_SORT = ["subZoneNo", "subZoneName"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const parsePage = (val?: string) => {
    const rawVal = parseInt(val ?? "", 10);
    return Number.isFinite(rawVal) ? Math.min(Math.max(rawVal, MIN_PAGE), MAX_PAGE) : MIN_PAGE;
  };

  const parsePageSize = (val?: string) => {
    const rawVal = parseInt(val ?? "", 10);
    return Number.isFinite(rawVal) ? Math.min(Math.max(rawVal, MIN_PAGE_SIZE), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  };

  const moujaPn = parsePage(raw.moujaPn);
  const moujaPs = parsePageSize(raw.moujaPs);
  const subZonePn = parsePage(raw.subZonePn);
  const subZonePs = parsePageSize(raw.subZonePs);

  const moujaSearch = raw.moujaSearch?.trim() || undefined;
  const subZoneSearch = raw.subZoneSearch?.trim() || undefined;

  const moujaSortByRaw = raw.moujaSortBy?.trim() ?? "";
  const moujaSortBy = (ALLOWED_MOUJA_SORT as readonly string[]).includes(moujaSortByRaw) ? moujaSortByRaw : undefined;

  const subZoneSortByRaw = raw.subZoneSortBy?.trim() ?? "";
  const subZoneSortBy = (ALLOWED_SUBZONE_SORT as readonly string[]).includes(subZoneSortByRaw) ? subZoneSortByRaw : undefined;

  const parseOrder = (val?: string) => {
    const order = val?.trim().toLowerCase() ?? "";
    return (ALLOWED_SORT_ORDERS as readonly string[]).includes(order) ? (order as typeof ALLOWED_SORT_ORDERS[number]) : undefined;
  };

  const moujaSortOrder = parseOrder(raw.moujaSortOrder);
  const subZoneSortOrder = parseOrder(raw.subZoneSortOrder);

  const selectedMoujaId = raw.moujaId?.trim() || undefined;

  return {
    moujaPn,
    moujaPs,
    subZonePn,
    subZonePs,
    moujaSearch,
    subZoneSearch,
    moujaSortBy,
    moujaSortOrder,
    subZoneSortBy,
    subZoneSortOrder,
    selectedMoujaId,
  };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const search = await searchParams;
  const sanitized = sanitizeParams(search);

  // Fetch Moujas first to enable defaulting to the first item
  const moujasResult = await fetchMoujasPagedServerAction(
    sanitized.moujaPn,
    sanitized.moujaPs,
    sanitized.moujaSearch,
    sanitized.moujaSortBy,
    sanitized.moujaSortOrder
  );

  // Determine selected Mouja ID (explicit from query params, or default to the first one available)
  let selectedMoujaId = sanitized.selectedMoujaId;
  if (selectedMoujaId) {
    const num = Number(selectedMoujaId);
    if (!Number.isFinite(num) || num <= 0) {
      selectedMoujaId = undefined;
    }
  }

  if (!selectedMoujaId && moujasResult.items.length > 0) {
    selectedMoujaId = String(moujasResult.items[0].id);
  }

  const numericMoujaId = selectedMoujaId ? Number(selectedMoujaId) : NaN;

  // Fetch Sub-Zones corresponding to the selected/defaulted Mouja
  const subZonesResult = Number.isFinite(numericMoujaId) && numericMoujaId > 0
    ? await fetchSubZonesPagedServerAction(
      sanitized.subZonePn,
      sanitized.subZonePs,
      numericMoujaId,
      sanitized.subZoneSearch,
      sanitized.subZoneSortBy,
      sanitized.subZoneSortOrder
    )
    : {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: sanitized.subZonePs,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };

  return (
    <MoujaSubZoneMaster
      moujas={moujasResult.items}
      subZones={subZonesResult.items}
      moujaTotalCount={moujasResult.totalCount}
      subZoneTotalCount={subZonesResult.totalCount}
      moujaPageNumber={moujasResult.pageNumber}
      subZonePageNumber={subZonesResult.pageNumber}
      moujaPageSize={moujasResult.pageSize}
      subZonePageSize={subZonesResult.pageSize}
      moujaTotalPages={moujasResult.totalPages}
      subZoneTotalPages={subZonesResult.totalPages}
      selectedMoujaId={selectedMoujaId}
      moujaSortBy={sanitized.moujaSortBy}
      moujaSortOrder={sanitized.moujaSortOrder}
      subZoneSortBy={sanitized.subZoneSortBy}
      subZoneSortOrder={sanitized.subZoneSortOrder}
    />
  );
}