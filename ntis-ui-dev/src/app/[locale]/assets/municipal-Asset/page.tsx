import {
  getMunicipalDashboardStats,
  getMunicipalAssetCategories,
  getMunicipalAssetTypes,
  getAssetsByTypeDetails,
  getAssetCategoryTypeDetails,
} from '@/lib/api/asset/municipal-Asset/asset-dashboard.service';
import MunicipalAssetDashboard from '@/components/modules/assets/municipal-Asset/MunicipalAssetDashboard';
import { LoadingPage } from '@/components/common';
import { Suspense } from 'react';
import type { RawSearchParams } from '@/lib/utils/sanitize-params';
import type { AssetCategory, AssetType, DashboardStatsResponse } from '@/types/asset/municipal-Asset/municipal-asset.types';

// Force dynamic rendering for this page — ensures every request fetches fresh
// data from the API rather than using a cached RSC response.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams & { assetTypeId?: string; assetCategoryId?: string; categoryId?: string; drawerPage?: string }>;
}

export default async function MunicipalAssetPage({ params, searchParams }: PageProps) {
  // In Next.js 15, `params` and `searchParams` are Promises that must be
  // awaited. Even when values are not directly used in this component, awaiting
  // them is required to opt into dynamic rendering per Next.js conventions.
  await params;
  const sParams = await searchParams;

  const rawAssetTypeId = sParams?.assetTypeId;
  const assetTypeId = rawAssetTypeId ? Number(rawAssetTypeId) : null;
  const rawCategoryId = sParams?.assetCategoryId ?? sParams?.categoryId;
  const categoryId = rawCategoryId ? Number(rawCategoryId) : null;
  const rawDrawerPage = sParams?.drawerPage;
  const drawerPage = rawDrawerPage ? Number(rawDrawerPage) : 1;

  // Fetch stats, master lists, and optional drawer details in parallel using dedicated municipal asset service
  const [initialStats, masterCategories, masterTypes, drawerRes, categoryDrawerRes] = await Promise.all([
    getMunicipalDashboardStats(),
    getMunicipalAssetCategories(),
    getMunicipalAssetTypes(),
    assetTypeId && !isNaN(assetTypeId)
      ? getAssetsByTypeDetails(assetTypeId, drawerPage, 10).then((data) => ({ success: true as const, data }))
      : Promise.resolve(null),
    categoryId && !isNaN(categoryId)
      ? getAssetCategoryTypeDetails(categoryId).then((data) => ({ success: true as const, data }))
      : Promise.resolve(null),
  ]);

  const initialDrawerData = drawerRes?.success ? drawerRes.data : null;
  const initialCategoryDrawerData = categoryDrawerRes?.success ? categoryDrawerRes.data : null;

  const selectedAssetType =
    assetTypeId && !isNaN(assetTypeId)
      ? masterTypes.find((t) => t.id === assetTypeId) ?? ({ id: assetTypeId, typeName: 'Asset Details' } as AssetType)
      : null;

  const selectedCategory =
    categoryId && !isNaN(categoryId)
      ? masterCategories.find((c) => c.id === categoryId) ?? ({ id: categoryId, categoryName: 'Category Details' } as AssetCategory)
      : null;

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden">
      <div className="flex-1 p-2 bg-slate-50/50 overflow-y-auto custom-scrollbar">
        <div className="mx-auto w-full max-w-[99%]">
          {/*
            The Suspense boundary here provides a client-side fallback UI for
            the initial hydration pass of MunicipalAssetDashboard. Route-level
            streaming is handled by loading.tsx.
          */}
          <Suspense
            fallback={<LoadingPage translationNamespace="municipalAsset.loading" />}
          >
            <MunicipalAssetDashboard
              initialStats={initialStats as DashboardStatsResponse | null}
              masterCategories={masterCategories}
              masterTypes={masterTypes}
              selectedAssetType={selectedAssetType}
              selectedCategory={selectedCategory}
              initialDrawerData={initialDrawerData}
              initialCategoryDrawerData={initialCategoryDrawerData}
              activeDrawerPage={drawerPage}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

