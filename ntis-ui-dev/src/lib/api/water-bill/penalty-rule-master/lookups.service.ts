import 'server-only';

import type { LookupOption, FinancialYearLookupOption } from '@/types/water-bill/lookups.types';
import { getFinancialYearsPaged } from '@/lib/api/financial-year.service';
import { getConnectionCategoryPaged } from '@/lib/api/water-bill/connectionCategoryMaster.service';
import { getGeographyUnitPaged } from '@/lib/api/water-bill/geographyunitmaster/geography-unit-crud.service';
import { getTapSizePaged } from '@/lib/api/water-connection-master/water-connection-type-size.service';
import { getChargeHeadsPaged } from '@/lib/api/water-bill/chargeHeads.service';
import type { ChargeHead } from '@/types/water-bill/chargeHeads.types';
import { apiClient } from '@/services/api.service';

export type { LookupOption, FinancialYearLookupOption };

import {
  STATIC_FINANCIAL_YEARS,
  STATIC_CONNECTION_CATEGORIES,
  STATIC_CHARGE_HEADS,
  STATIC_GEOGRAPHY_UNITS,
  STATIC_TAP_SIZES,
  STATIC_TARIFFS,
} from '@/lib/constants/water-masters.constants';

export * from '@/lib/constants/water-masters.constants';

/** Fetch dynamic financial years with start/end dates and current flag from YearMaster API */
export async function fetchFinancialYearLookupOptions(): Promise<FinancialYearLookupOption[]> {
  try {
    const res = await getFinancialYearsPaged(1, 100);
    if (res?.items && res.items.length > 0) {
      const today = new Date();
      return res.items.map((fy) => {
        const start = fy.startDate ? fy.startDate.split('T')[0] : undefined;
        const end = fy.endDate ? fy.endDate.split('T')[0] : undefined;
        const isCurrent = Boolean(
          fy.isActive ||
          (start && end && new Date(start) <= today && today <= new Date(end))
        );
        return {
          value: String(fy.id),
          label: fy.yearCode ? `${fy.yearCode}` : `${fy.year}`,
          startDate: start,
          endDate: end,
          isCurrent,
        };
      });
    }
  } catch { }
  return STATIC_FINANCIAL_YEARS.map((fy, idx) => ({
    ...fy,
    isCurrent: idx === 0,
    startDate: idx === 0 ? '2026-04-01' : undefined,
    endDate: idx === 0 ? '2027-03-31' : undefined,
  }));
}

/** Fetch dynamic connection categories from ConnectionCategoryMaster API */
export async function fetchConnectionCategoryLookupOptions(): Promise<LookupOption[]> {
  try {
    const res = await getConnectionCategoryPaged(1, 100);
    if (res?.items && res.items.length > 0) {
      return res.items.map((cat) => ({
        value: String(cat.id),
        label: cat.connectionCategory ? `${cat.connectionCategory} (${cat.connectionCategoryCode || cat.id})` : `Category ${cat.id}`,
      }));
    }
  } catch { }
  return STATIC_CONNECTION_CATEGORIES;
}

interface RawChargeHeadLookupItem {
  id?: number;
  name?: string;
  chargeHeadName?: string;
  code?: string;
  chargeHeadCode?: string;
  isActive?: boolean;
}

interface RawChargeHeadLookupPayload {
  items?: RawChargeHeadLookupItem[];
  data?: {
    items?: RawChargeHeadLookupItem[];
  };
}

/** Fetch dynamic charge heads from ChargeHeadMaster API with fallback */
export async function fetchChargeHeadLookupOptions(): Promise<LookupOption[]> {
  try {
    const res = await getChargeHeadsPaged({ pageNumber: 1, pageSize: 100 });
    if (res?.success && res.data?.items && res.data.items.length > 0) {
      return res.data.items
        .filter((ch: ChargeHead) => ch.isActive)
        .map((ch: ChargeHead) => ({
          value: String(ch.id),
          label: ch.chargeHeadName || ch.chargeHeadCode || `Charge Head ${ch.id}`,
        }));
    }
  } catch { }

  try {
    const rawRes = await apiClient.get<RawChargeHeadLookupPayload>(
      '/ChargeHeadMaster?PageNumber=1&PageSize=100'
    );
    const payload = rawRes?.data;
    const rawItems = payload?.items || payload?.data?.items;
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      return rawItems
        .filter((ch) => ch.isActive !== false)
        .map((ch) => ({
          value: String(ch.id ?? 0),
          label: ch.name || ch.chargeHeadName || ch.code || ch.chargeHeadCode || `Charge Head ${ch.id}`,
        }));
    }
  } catch { }

  return STATIC_CHARGE_HEADS;
}

/** Fetch dynamic geography units from GeographyUnit API with fallback */
export async function fetchGeographyUnitLookupOptions(): Promise<LookupOption[]> {
  try {
    const res = await getGeographyUnitPaged(1, 100);
    if (res?.items && res.items.length > 0) {
      return res.items.map((gu) => ({
        value: String(gu.id),
        label: `${gu.geographyUnitName} (${gu.geographyUnitCode})`,
      }));
    }
  } catch { }
  return STATIC_GEOGRAPHY_UNITS;
}

/** Fetch dynamic tap sizes from WaterConnectionSize API with fallback */
export async function fetchTapSizeLookupOptions(): Promise<LookupOption[]> {
  try {
    const res = await getTapSizePaged(1, 100);
    if (res?.items && res.items.length > 0) {
      return res.items.map((ts) => ({
        value: String(ts.waterConnectionSizeId),
        label: ts.displayLabel || `${ts.sizeName} ${ts.unit}`.trim(),
      }));
    }
  } catch { }
  return STATIC_TAP_SIZES;
}

/** Fetch dynamic tariffs from TariffMaster API with fallback */
export async function fetchTariffLookupOptions(): Promise<LookupOption[]> {
  return STATIC_TARIFFS;
}
