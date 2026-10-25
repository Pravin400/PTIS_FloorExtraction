import { notFound } from 'next/navigation';
import { AssetDetailPage } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AssetDetailPage';
import { fetchAssetDetailData } from './actions';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * Server component — resolves translations and passes them as a copy prop
 * to the client-side AssetDetailPage orchestrator.
 */
export default async function AssetDetailViewNewPage({ params }: PageProps) {
  const { locale, id } = await params;

  const assetIdNum = Number(id);
  if (isNaN(assetIdNum) || assetIdNum <= 0) notFound();

  const dataRes = await fetchAssetDetailData(assetIdNum);
  const apiData = dataRes?.success && dataRes.data ? {
    basicDetails: dataRes.data.basicDetails,
    floorSubmissions: dataRes.data.floorSubmissions,
    shopUnits: dataRes.data.shopUnits,
    inventory: dataRes.data.inventory
  } : undefined;

  return <AssetDetailPage apiData={apiData} locale={locale} />;
}
