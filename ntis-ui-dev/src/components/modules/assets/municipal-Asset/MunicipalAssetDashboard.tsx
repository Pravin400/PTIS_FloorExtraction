'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AddButton, Card, CardContent, CardHeader, CardTitle, LoadingPage } from '@/components/common';
import { Building2 } from 'lucide-react';
import { AssetCategoryCard } from './AssetCategoryCard';
import { getCategoryMeta, themes } from './dashboardHelpers';
import { AssetTypeDetailsDrawer } from './AssetTypeDetailsDrawer';
import type {
  MunicipalAssetDashboardProps,
  AssetType,
  AssetCategory,
  AssetCategoryTypeStatsResponseDto,
} from '@/types/asset/municipal-Asset/municipal-asset.types';
import { useMunicipalAssetDashboard } from '@/hooks/asset/municipal-Asset/useMunicipalAssetDashboard';
import { useLocaleRouter } from '@/hooks/asset/municipal-Asset/useLocaleRouter';
import { MUNICIPAL_ASSET_ROUTES } from '@/lib/routes/municipal-asset.routes';
import { fetchAssetCategoryTypeDetails } from '@/app/[locale]/assets/municipal-Asset/actions';

import { AddAssetDrawer } from './NewAddNewAsset/drawer/AddAssetDrawer';

export default function MunicipalAssetDashboard({
  initialStats = null,
  masterCategories = [],
  masterTypes = [],
  selectedAssetType: serverSelectedType = null,
  selectedCategory: serverSelectedCategory = null,
  initialDrawerData = null,
  initialCategoryDrawerData = null,
  activeDrawerPage = 1,
}: MunicipalAssetDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push } = useLocaleRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('municipalAsset.dashboard');

  // Active selection for drawer (initialized from SSR props)
  const [activeCategory, setActiveCategory] = useState<AssetCategory | null>(serverSelectedCategory);
  const [activeType, setActiveType] = useState<AssetType | null>(serverSelectedType);
  const [isOpeningDrawer, setIsOpeningDrawer] = useState<boolean>(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [categoryDataMap, setCategoryDataMap] = useState<Record<number, AssetCategoryTypeStatsResponseDto>>(() => {
    if (serverSelectedCategory && initialCategoryDrawerData) {
      return { [serverSelectedCategory.id]: initialCategoryDrawerData };
    }
    return {};
  });

  // Adjust state during render if server props change (supports direct URL navigation / SSR)
  const [prevServerCategory, setPrevServerCategory] = useState(serverSelectedCategory);
  const [prevServerType, setPrevServerType] = useState(serverSelectedType);

  if (serverSelectedCategory !== prevServerCategory) {
    setPrevServerCategory(serverSelectedCategory);
    setActiveCategory(serverSelectedCategory);
    if (serverSelectedCategory && initialCategoryDrawerData) {
      setCategoryDataMap((prev) => ({
        ...prev,
        [serverSelectedCategory.id]: initialCategoryDrawerData,
      }));
    }
  }

  if (serverSelectedType !== prevServerType) {
    setPrevServerType(serverSelectedType);
    setActiveType(serverSelectedType);
  }

  // Force an RSC fetch request to appear in the Network tab on load.
  useEffect(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const {
    categories,
    typesByCategory,
    visibleExamples,
    setVisibleExamples,
    dashboardStats,
  } = useMunicipalAssetDashboard(initialStats, masterCategories, masterTypes);

  const handleSelectCategory = (categoryId: number) => {
    push(MUNICIPAL_ASSET_ROUTES.assetRegister(categoryId));
  };

  // Open asset type drawer via Server Transition
  const handleSelectType = useCallback(
    (type: AssetType) => {
      setActiveType(type);
      setActiveCategory(null);
      setIsOpeningDrawer(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('assetTypeId', String(type.id));
      params.delete('assetCategoryId');
      params.delete('categoryId');
      params.delete('drawerPage');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Industry Standard: Fetch category details via dedicated Server Action with LoadingPage
  const handleSelectCategoryAssetTypes = useCallback(
    async (category: AssetCategory) => {
      // 1. If already cached, open drawer immediately (0ms)
      if (categoryDataMap[category.id]) {
        setActiveCategory(category);
        setActiveType(null);
        const params = new URLSearchParams(searchParams.toString());
        params.set('assetCategoryId', String(category.id));
        params.delete('assetTypeId');
        params.delete('drawerPage');
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
        return;
      }

      // 2. Show application standard LoadingPage while fetching via Server Action
      setIsOpeningDrawer(true);
      try {
        const res = await fetchAssetCategoryTypeDetails(category.id);
        if (res.success && res.data) {
          setCategoryDataMap((prev) => ({
            ...prev,
            [category.id]: res.data as AssetCategoryTypeStatsResponseDto,
          }));
          setActiveCategory(category);
          setActiveType(null);
          const params = new URLSearchParams(searchParams.toString());
          params.set('assetCategoryId', String(category.id));
          params.delete('assetTypeId');
          params.delete('drawerPage');
          window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
        }
      } catch {
        // Silently handled without console noise
      } finally {
        setIsOpeningDrawer(false);
      }
    },
    [categoryDataMap, pathname, searchParams]
  );

  // Close drawer locally and clean up URL without triggering unnecessary server re-fetches
  const handleCloseDrawer = useCallback(() => {
    setActiveCategory(null);
    setActiveType(null);
    setIsOpeningDrawer(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('assetTypeId');
    params.delete('assetCategoryId');
    params.delete('categoryId');
    params.delete('drawerPage');
    const query = params.toString();
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  const handleDrawerPageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('drawerPage', String(newPage));
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Show standard application loading page when opening drawer
  if (isOpeningDrawer || (isPending && !activeCategory && !!activeType)) {
    return <LoadingPage translationNamespace="municipalAsset.loading" />;
  }

  return (
    <div className="space-y-6 pb-4">
      <Card variant="bordered" padding="none" className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-white px-6 pb-0 pt-8">
            <CardHeader className="mb-3 p-0">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 opacity-40 blur-[4px]" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-lg">
                      <Building2 className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-black leading-tight tracking-tight text-[#1a1a2e]">
                        {t('title')}
                      </CardTitle>
                      <span className="rounded-full border border-violet-300 bg-violet-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-violet-700">
                        MC-EMS
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium">
                      <span className="font-bold text-violet-600">{t('marathiTitle')}</span>
                      <span className="inline-block h-0.5 w-0.5 rounded-full bg-slate-300" />
                      <span className="text-slate-400">{t('subtitle')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <div className="flex items-center justify-between border-t border-municipal-primary/8 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 shadow-sm">
                  <span className="text-xs font-bold text-emerald-700">{t('totalCategories')}</span>
                  <span className="text-sm font-black text-emerald-800">
                    {dashboardStats?.totalCategories ?? categories.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">{t('totalAssets')}</span>
                  <span className="text-sm font-black text-slate-800">{dashboardStats?.totalAssets ?? 0}</span>
                </div>
              </div>
              <AddButton
                label={t('addNewAsset')}
                onClick={() => setIsAddAssetOpen(true)}
                className="h-auto rounded-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-[11px] font-bold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="px-8 pb-0 pt-6">
        {!dashboardStats ? (
          <Card variant="bordered" className="mx-auto max-w-md border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-16 opacity-70">
              <div className="mb-4 size-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('loading')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {categories.map((category, index) => {
              const meta = getCategoryMeta(category.categoryName);
              let themeContext = themes[meta.id];
              if (!themeContext) {
                const themeKeys = Object.keys(themes);
                const assignedKey = themeKeys[category.id % themeKeys.length];
                themeContext = themes[assignedKey] ?? themes.building;
              }
              const stat = dashboardStats?.categoryStats.find((s) => s.categoryId === category.id);
              const assetCount = stat?.registeredAssets ?? stat?.totalCategoryItem ?? 0;
              const totalValue = stat?.totalValue ?? null;
              return (
                <AssetCategoryCard
                  key={category.id}
                  index={index}
                  category={category}
                  assetCount={assetCount}
                  totalValue={totalValue}
                  meta={meta}
                  theme={themeContext}
                  catTypes={typesByCategory[category.id] ?? []}
                  visibleCount={visibleExamples[category.id.toString()] ?? 5}
                  onVisibleCountChange={(count) =>
                    setVisibleExamples((prev) => ({ ...prev, [category.id.toString()]: count }))
                  }
                  onSelectCategory={() => handleSelectCategory(category.id)}
                  onSelectType={(type) => handleSelectType(type)}
                  onSelectCategoryAssetTypes={(cat) => handleSelectCategoryAssetTypes(cat)}
                />
              );
            })}
          </div>
        )}
      </div>

      <AssetTypeDetailsDrawer
        isOpen={!!activeType || !!activeCategory}
        onClose={handleCloseDrawer}
        assetType={activeType}
        category={activeCategory}
        categoryDetailsData={activeCategory ? (categoryDataMap[activeCategory.id] ?? null) : null}
        data={initialDrawerData}
        loading={isPending && !activeCategory}
        pageNumber={activeDrawerPage}
        pageSize={10}
        onPageChange={handleDrawerPageChange}
      />

      <AddAssetDrawer
        open={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        initialCategories={masterCategories}
        initialTypes={masterTypes}
      />
    </div>
  );
}
