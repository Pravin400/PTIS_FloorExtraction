import { getTranslations } from 'next-intl/server';
import RevenueAssetRecordsView from '@/components/modules/assets/dashboard/revenue-dashboard/revenue-records/RevenueAssetRecordsView';
import { getRevenueRecordsAction } from './actions';
import { safeParseInt } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';
import { sanitizeInput } from '@/lib/utils/security';
import {
  REVENUE_DEFAULT_PAGE_SIZE,
  REVENUE_MAX_PAGE_SIZE,
  REVENUE_LEASE_TYPES,
  REVENUE_PAYMENT_STATUSES,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function sanitizeParams(raw: Record<string, string | string[] | undefined>) {
  function parseId(value: string | string[] | undefined): number | undefined {
    if (typeof value !== 'string') return undefined;
    const parsed = safeParseInt(value, 0);
    return parsed > 0 ? parsed : undefined;
  }

  function parseEnum<T extends string>(
    value: string | string[] | undefined,
    allowed: readonly T[]
  ): T | undefined {
    return typeof value === 'string' && (allowed as readonly string[]).includes(value)
      ? (value as T)
      : undefined;
  }

  return {
    pageNumber: Math.max(1, safeParseInt(raw.pageNumber as string, 1)),
    pageSize: Math.min(REVENUE_MAX_PAGE_SIZE, Math.max(1, safeParseInt(raw.pageSize as string, REVENUE_DEFAULT_PAGE_SIZE))),
    searchTerm: typeof raw.q === 'string' ? sanitizeInput(raw.q).trim() : '',
    categoryId: parseId(raw.category),
    zoneId: parseId(raw.zoneId),
    wardId: parseId(raw.wardId),
    leaseType: parseEnum(raw.type, REVENUE_LEASE_TYPES),
    paymentStatus: parseEnum(raw.status, REVENUE_PAYMENT_STATUSES),
  };
}

export default async function RevenueAssetRecordsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const search = await searchParams;

  const sanitized = sanitizeParams(search);

  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: 'revenueDashboard' }),
    getRevenueRecordsAction({
      pageNumber: sanitized.pageNumber,
      pageSize: sanitized.pageSize,
      searchTerm: sanitized.searchTerm || undefined,
      categoryId: sanitized.categoryId,
      zoneId: sanitized.zoneId,
      wardId: sanitized.wardId,
      leaseType: sanitized.leaseType,
      paymentStatus: sanitized.paymentStatus,
    })
  ]);

  const copy = {
    errors: { loadFailed: t('errors.loadFailed') },
    cards: {
      lease: t('cards.lease'),
      rent: t('cards.rent'),
      demand: t('cards.demand'),
    },
    filters: {
      label: t('filters.label'),
      allZones: t('filters.allZones'),
      allWards: t('filters.allWards'),
      type: t('filters.type'),
      allTypes: t('filters.allTypes'),
      status: t('filters.status'),
      allStatuses: t('filters.allStatuses'),
    },
    records: {
      cols: {
        srNo: t('records.cols.srNo'),
        assetId: t('records.cols.assetId'),
        assetName: t('records.cols.assetName'),
        zone: t('records.cols.zone'),
        ward: t('records.cols.ward'),
        leaseType: t('records.cols.leaseType'),
        tenant: t('records.cols.tenant'),
        status: t('records.cols.status'),
        rent: t('records.cols.rent'),
      },
      statusPaid: t('records.statusPaid'),
      statusUnpaid: t('records.statusUnpaid'),
      empty: t('records.empty'),
      allCategories: t('records.allCategories'),
      searchPlaceholder: t('records.searchPlaceholder'),
      backToDashboard: t('records.backToDashboard'),
      totalLeasedAssets: t('records.totalLeasedAssets'),
      allCategoriesCount: t('records.allCategoriesCount', { count: '{count}' }),
      total: t('records.total'),
      collected: t('records.collected'),
      pending: t('records.pending'),
    },
    currency: {
      symbol: t('currency.symbol'),
      lakh: t('currency.lakh', { val: '{val}' }),
      crore: t('currency.crore', { val: '{val}' }),
    },
  };

  return <RevenueAssetRecordsView data={result.success ? result.data : undefined} searchTerm={sanitized.searchTerm} copy={copy} />;
}
