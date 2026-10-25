import { getTranslations } from 'next-intl/server';
import { RevenueAssetDashboard } from '@/components/modules/assets/dashboard/revenue-dashboard/RevenueDashboard';
import { getRevenueDashboardAction } from './actions';
import { safeParseInt } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';
import { formatPercent } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Extract and validate URL search params for the dashboard. */
function sanitizeParams(raw: Record<string, string | string[] | undefined>) {
  function parseId(value: string | string[] | undefined): number | undefined {
    if (typeof value !== 'string') return undefined;
    const parsed = safeParseInt(value, 0);
    return parsed > 0 ? parsed : undefined;
  }

  return {
    zoneId: parseId(raw.zoneId),
    wardId: parseId(raw.wardId),
    year: parseId(raw.year),
  };
}

export default async function AssetRevenueDashboardPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const search = await searchParams;
  
  const { zoneId, wardId, year } = sanitizeParams(search);

  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: 'revenueDashboard' }),
    getRevenueDashboardAction({ year, zoneId, wardId }),
  ]);

  const copy = {
    errors: { loadFailed: t('errors.loadFailed') },
    cards: {
      demand: t('cards.demand'),
      collected: t('cards.collected'),
      lease: t('cards.lease'),
      rent: t('cards.rent'),
      paid: t('cards.paid'),
      unpaid: t('cards.unpaid'),
    },
    filters: {
      label: t('filters.label'),
      allZones: t('filters.allZones'),
      allWards: t('filters.allWards'),
    },
    title: t('title'),
    summary: {
      leasedAssets: t('summary.leasedAssets'),
      leasedAssetsSub: t('summary.leasedAssetsSub'),
      totalDemand: t('summary.totalDemand'),
      totalDemandSub: t('summary.totalDemandSub'),
      totalCollection: t('summary.totalCollection'),
      collectionRate: result.success && result.data
        ? t('summary.collectionRate', { rate: formatPercent(result.data.overview.summary.collectionRatePercent) })
        : '',
    },
    distribution: {
      title: t('distribution.title'),
      empty: t('distribution.empty'),
    },
    format: {
      currencyPrefix: t('format.currencyPrefix'),
      lakhsSuffix: t('format.lakhsSuffix'),
      croresSuffix: t('format.croresSuffix'),
    },
    trend: {
      title: t('trend.title'),
      collected: t('trend.collected'),
      pending: t('trend.pending'),
    },
    zones: {
      title: t('zones.title'),
      totalDemand: t('zones.totalDemand'),
    },
    currency: {
      symbol: t('currency.symbol'),
      lakh: t('currency.lakh', { val: '{val}' }),
      crore: t('currency.crore', { val: '{val}' }),
    },
  };

  return <RevenueAssetDashboard data={result.success ? result.data : undefined} copy={copy} />;
}
