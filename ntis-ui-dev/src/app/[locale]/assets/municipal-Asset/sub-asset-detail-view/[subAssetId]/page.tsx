
import { SubAssetDetailPage } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view';
import { fetchSubAssetDetailNewData } from './actions';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string; subAssetId: string }>;
}

/**
 * Server component — resolves translations and passes them as a copy prop
 * to the client-side SubAssetDetailPage orchestrator.
 * Fetches sub-asset data and passes it as apiData.
 */
export default async function SubAssetDetailViewPage({ params }: PageProps) {
  const { subAssetId } = await params;

  const subAssetIdNum = Number(subAssetId);
  if (isNaN(subAssetIdNum) || subAssetIdNum <= 0) notFound();

  const dataRes = await fetchSubAssetDetailNewData(subAssetIdNum);
  const apiData = dataRes?.success && dataRes.data ? dataRes.data : undefined;

  return <SubAssetDetailPage apiData={apiData} subAssetIdNum={subAssetIdNum} />;
}
