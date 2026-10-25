 
import { BarChart3, MapPin, Activity, IndianRupee, Wrench, ShieldAlert, Coins } from 'lucide-react';
import type { DashboardStats, AssetSummaryData, RawCategory, DashboardCategoryItem, MunicipalAsset } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import type { AssetDashboardLocation } from '@/types/assets/dashboard/master-dashboard/asset-dashboard-api.types';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

export const ICONS = { BarChart3, MapPin, Activity, IndianRupee, Wrench, ShieldAlert, Coins };

/** Normalises any value to a trimmed lowercase string for comparison */
export const normKey = (v: unknown) => String(v ?? '').trim().toLowerCase();

/** Converts a raw string to Title Case */
export const toTitleCase = (v: unknown) =>
  String(v ?? '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

const CATEGORY_MAP: Record<string, string> = { 
  land: 'land', 
  'land & plots': 'land',
  'land & plot': 'land',
  building: 'building', 
  buildings: 'building', 
  infrastructure: 'infrastructure', 
  movable: 'movable',
  'movable assets': 'movable',
  'movable asset': 'movable'
} as const;

/** Maps a raw category string to its i18n key */
export const getCategoryKey = (cat: string): string => {
  const norm = normKey(cat);
  return CATEGORY_MAP[norm] ?? '';
};

/** Conversion factor: Lakhs to Crores (1 Cr = 100 Lakhs) */
export const LAKHS_TO_CRORES = 100;

// Preserve DashboardCategoryItem reference for mapSummaryToStats overload
export const fmtRupee = (v: number) => {
  return formatIndianCurrencyAbbreviated(v * 100000);
};


export const mapSummaryToStats = (s?: AssetSummaryData | null, categories?: RawCategory[]): DashboardStats => {
  const totalAssetsVal = Number(s?.totalAssets ?? s?.totalAssetsCount ?? 0);
  const totalValueVal = s?.totalValueLakhs != null
    ? Number(s?.totalValueLakhs)
    : Number(s?.totalValue ?? s?.totalAssetsValue ?? 0) / 100000;
  const encroachmentsVal = Number(s?.encroachments ?? s?.encroachedAssets ?? s?.encroachedCount ?? 0);
  const maintenanceVal = Number(s?.maintenanceDue ?? s?.maintenanceAssets ?? s?.maintenanceCount ?? 0);
  const auctionsVal = Number(s?.activeAuctions ?? s?.totalAuctions ?? s?.auctionCount ?? 0);
  const acquisitionsVal = Number(s?.assetAcquisition ?? s?.totalAcquisitions ?? s?.acquisitionCount ?? 0);
  const monetizedVal = Number(s?.monetizedAssetsCount ?? 0);
  const leasedVal = Number(s?.activeLeasedAssetsCount ?? 0);
  const rentedVal = Number(s?.activeRentedAssetsCount ?? 0);

  const getCatName = (c: unknown): string => {
    if (typeof c === 'object' && c !== null) {
      if ('name' in c && typeof c.name === 'string') return c.name;
      if ('categoryName' in c && typeof c.categoryName === 'string') return c.categoryName;
      if ('category' in c && typeof c.category === 'string') return c.category;
    }
    return '';
  };

  // Build Total Assets backInfo from categories (API category-counts)
  const activeCategories = (categories || []).filter(c => c.isActive !== false);
  const assetsBack = activeCategories.map(cat => {
    const catName = getCatName(cat);
    return {
      label: String(catName || cat.count || ''),
      value: Number(cat.count ?? 0).toString(),
      category: String(cat.categoryId || catName || ''),
    };
  });

  // Build Total Value backInfo from API assetValueCardDetails if available, else from categories
  const apiValueCards = s?.assetValueCardDetails as Array<{ title: string; value: string; subtitle?: string }> | undefined;
  const valuesBack = apiValueCards && apiValueCards.length > 0
    ? apiValueCards.map(card => {
      let displayValue = String(card.value || '0');
      if (displayValue.startsWith('₹') && displayValue.includes('Cr')) {
        const num = parseFloat(displayValue.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          displayValue = formatIndianCurrencyAbbreviated(num * 10000000);
        }
      } else if (displayValue.startsWith('₹') && displayValue.includes('Lakh')) {
        const num = parseFloat(displayValue.replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) {
          displayValue = formatIndianCurrencyAbbreviated(num * 100000);
        }
      }
      return {
        label: String(card.title || ''),
        value: displayValue,
      };
    })
    : activeCategories.map(cat => {
      const catName = getCatName(cat);
      const rawCatVal = Number(cat.value ?? 0);
      const catValLakhs = rawCatVal / 100000;
      return {
        label: `${String(catName || '')} Value`,
        value: fmtRupee(catValLakhs),
        category: String(cat.categoryId || catName || ''),
      };
    });

  return {
    totalAssets: {
      value: totalAssetsVal.toLocaleString('en-IN'),
      change: String(s?.percentageChange ?? ''),
      backInfo: assetsBack,
    },
    totalValue: {
      value: fmtRupee(totalValueVal),
      change: String(s?.valueChange ?? ''),
      backInfo: valuesBack,
    },
    monetized: {
      value: monetizedVal.toLocaleString('en-IN'),
      change: '',
      backInfo: [
        { label: 'Leased', value: leasedVal.toLocaleString('en-IN') },
        { label: 'Rented', value: rentedVal.toLocaleString('en-IN') },
      ],
    },
    encroachments: {
      value: encroachmentsVal.toString(),
      change: String(s?.encroachmentChange ?? ''),
      backInfo: [
        { label: 'Active Cases', value: encroachmentsVal.toString(), category: 'Active Encroachments' },
      ],
    },
    maintenance: {
      value: maintenanceVal.toString(),
      change: String(s?.maintenanceChange ?? ''),
      backInfo: [],
    },
    auctions: {
      value: auctionsVal.toString(),
      change: String(s?.auctionChange ?? ''),
      backInfo: [
        { label: 'Active Auctions', value: auctionsVal.toString() },
      ],
    },
    acquisitions: {
      value: acquisitionsVal.toString(),
      change: String(s?.acquisitionChange ?? ''),
      backInfo: [],
    },
  };
};

export interface DashboardSearchParams {
  zone: string;
  ward: string;
  typeId: number | null;
  categoryId: number | null;
  catsStr: string | null;
}

export function sanitizeDashboardParams(params: { [key: string]: string | string[] | undefined }): DashboardSearchParams {
  const zoneRaw = typeof params.zone === 'string' ? params.zone.trim() : '';
  const zone = zoneRaw && zoneRaw !== 'all' ? zoneRaw : 'all';

  const wardRaw = typeof params.ward === 'string' ? params.ward.trim() : '';
  const ward = wardRaw && wardRaw !== 'all' ? wardRaw : 'all';

  const typeIdRaw = typeof params.typeId === 'string' ? Number(params.typeId) : null;
  const typeId = typeIdRaw !== null && !isNaN(typeIdRaw) && typeIdRaw > 0 ? typeIdRaw : null;

  const catsStr = typeof params.cats === 'string' && params.cats.trim() !== '' ? params.cats.trim() : null;
  
  const catIds = catsStr ? catsStr.split(',').map(Number).filter(id => !isNaN(id) && id > 0) : [];
  const categoryId = catIds.length === 1 ? catIds[0] : null;

  return { zone, ward, typeId, categoryId, catsStr };
}

export interface RawMasterData {
  id?: number | string | null;
  zoneId?: number | string | null;
  wardId?: number | string | null;
  zoneNo?: string | number | null;
  ZoneNo?: string | number | null;
  zoneName?: string | null;
  wardNo?: string | number | null;
  WardNo?: string | number | null;
  wardName?: string | null;
  name?: string | null;
  description?: string | null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeMasterData(r: Record<string, unknown>): RawMasterData {
  return {
    id: r.id != null ? String(r.id) : null,
    zoneId: r.zoneId != null ? String(r.zoneId) : null,
    wardId: r.wardId != null ? String(r.wardId) : null,
    zoneNo: r.zoneNo != null ? String(r.zoneNo) : (r.ZoneNo != null ? String(r.ZoneNo) : null),
    zoneName: r.zoneName != null ? String(r.zoneName) : null,
    wardNo: r.wardNo != null ? String(r.wardNo) : (r.WardNo != null ? String(r.WardNo) : null),
    wardName: r.wardName != null ? String(r.wardName) : null,
    name: r.name != null ? String(r.name) : null,
    description: r.description != null ? String(r.description) : null,
  };
}

export function extractIsActive(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return true;
  const keys = ['isActive', 'IsActive', 'is_active', 'active', 'Active'];
  for (const k of keys) {
    if (k in obj) {
      const val = (obj as Record<string, unknown>)[k];
      if (val !== undefined && val !== null) {
        if (typeof val === 'boolean') return val;
        return String(val).toLowerCase() !== 'false';
      }
    }
  }
  return true;
}

export function normalizeCategoryItem(r: Record<string, unknown>): DashboardCategoryItem {
  return {
    id: String(r.category || r.categoryName || '').trim().toLowerCase() || String(r.id ?? '').trim().toLowerCase(),
    categoryId: Number(r.id ?? r.categoryId ?? 0),
    name: String(r.category || r.categoryName || '') || `Category ${r.id}`,
    count: Number(r.count || 0),
    value: Number(r.totalValue || r.value || 0),
    color: String(r.color || '#3B82F6'),
    description: String(r.description || ''),
    isActive: extractIsActive(r),
  };
}

/** Convert AssetDashboardLocation[] to MunicipalAsset[] for the map/asset list */
export function locationsToAssets(locations: AssetDashboardLocation[]): MunicipalAsset[] {
  return locations.map((loc, i) => {
    const rawVal = loc.marketValue ?? loc.capitalValue ?? 0;
    return {
      id: String(loc.id ?? i),
      name: String(loc.name || loc.assetNo || ''),
      category: String(loc.categoryName || '').trim().toLowerCase() as 'land' | 'building' | 'infrastructure' | 'movable',
      subCategory: '',
      zone: '',
      ward: '',
      location: 'Municipal Area',
      valueLakhs: rawVal / 100000,
      status: String(loc.status || 'Active'),
      latitude: Number(loc.latitude ?? 0),
      longitude: Number(loc.longitude ?? 0),
      health: 0,
      lastInspection: '',
      usage: '',
    };
  });
}
