import { redirect } from 'next/navigation';

import type { AssetStepPageProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

export default async function AssetRootStepPage({ params, searchParams }: AssetStepPageProps) {
  const { locale, assetId } = await params;
  const search = await searchParams;
  const paramsCopy = new URLSearchParams();
  Object.entries(search).forEach(([k, v]) => {
    if (typeof v === 'string') paramsCopy.set(k, v);
    else if (Array.isArray(v) && v[0]) paramsCopy.set(k, v[0]);
  });
  const qs = paramsCopy.toString();
  redirect(`/${locale}/assets/municipal-Asset/new-add-new-asset/${assetId}/basic-info${qs ? `?${qs}` : ''}`);
}
