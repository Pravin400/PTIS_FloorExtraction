'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { MasterTable } from '@/components/common';
import type { Column } from '@/components/common/MasterTable';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';
import { Layers, FileText, Coins, MapPin, Package } from 'lucide-react';
import type {
  AssetTypeDetailsDrawerProps,
  AssetType,
  AssetTypeAssetItemDto,
  AssetTypeCategoryStatsDto,
} from '@/types/asset/municipal-Asset/municipal-asset.types';

export function AssetTypeDetailsDrawer({
  isOpen,
  onClose,
  assetType,
  category,
  categoryDetailsData = null,
  data = null,
  loading = false,
  pageNumber = 1,
  pageSize = 10,
  onPageChange,
}: AssetTypeDetailsDrawerProps) {
  const t = useTranslations('municipalAsset.drawer');

  // Determine if we are in Category Details Mode or Asset Type Item Mode
  const isCategoryMode = !!categoryDetailsData || !!category;

  const typeName =
    assetType?.assetTypeName ?? assetType?.typeName ?? (assetType as AssetType)?.name ?? 'Unknown';

  const categoryName = category?.categoryName ?? 'Category Details';

  const drawerTitle = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-lg font-bold text-[#1a1a2e]">
        <Layers className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <span>
          {isCategoryMode ? `Asset Type Details: ${categoryName}` : typeName}
        </span>
      </div>
      <p className="text-[11px] font-normal text-slate-500">
        {isCategoryMode ? t('categorySubtitle') : t('subtitle')}
      </p>
    </div>
  );

  // ─── CATEGORY MODE DATA & STATS ─────────────────────────────────────────────
  const categoryTypes = useMemo(() => {
    return categoryDetailsData?.types ?? [];
  }, [categoryDetailsData]);

  const categorySummaryStats = useMemo(() => {
    if (!categoryTypes.length) {
      return { totalAssets: 0, totalValuation: 0, totalLandArea: 0, totalInventory: 0 };
    }
    const totalAssets = categoryTypes.reduce((acc, curr) => {
      const c = curr as Record<string, unknown>;
      return acc + (Number(curr.assetCount ?? c.AssetCount) || 0);
    }, 0);
    const totalValuation = categoryTypes.reduce((acc, curr) => {
      const c = curr as Record<string, unknown>;
      return acc + (Number(curr.totalCapitalValue ?? c.TotalCapitalValue) || 0);
    }, 0);
    const totalLandArea = categoryTypes.reduce((acc, curr) => {
      const c = curr as Record<string, unknown>;
      return acc + (Number(curr.totalLandAreaSqMeter ?? c.TotalLandAreaSqMeter) || 0);
    }, 0);
    const totalInventory = categoryTypes.reduce((acc, curr) => {
      const c = curr as Record<string, unknown>;
      return acc + (Number(curr.totalInventoryQuantity ?? c.TotalInventoryQuantity) || 0);
    }, 0);
    return { totalAssets, totalValuation, totalLandArea, totalInventory };
  }, [categoryTypes]);


  // Category mode columns matching the exact table in the screenshot
  const categoryColumns = useMemo<Column<AssetTypeCategoryStatsDto>[]>(() => {
    return [
      {
        key: 'assetTypeName',
        label: t('colAssetType'),
        align: 'left',
        render: (_val, row) => {
          const r = row as Record<string, unknown>;
          return (
            <span className="font-semibold text-slate-800 text-[12px]">
              {String(row.assetTypeName ?? r.AssetTypeName ?? '')}
            </span>
          );
        },
      },
      {
        key: 'assetCount',
        label: t('colAssetCount'),
        align: 'center',
        render: (_val, row) => {
          const r = row as Record<string, unknown>;
          const count = Number(row.assetCount ?? r.AssetCount ?? 0);
          return (
            <span className="font-semibold text-slate-800 text-[12px]">
              {count.toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        key: 'totalCapitalValue',
        label: t('colTotalCapitalValue'),
        align: 'center',
        render: (_val, row) => {
          const r = row as Record<string, unknown>;
          const val = Number(row.totalCapitalValue ?? r.TotalCapitalValue ?? 0);
          return (
            <span className="font-bold text-[12px] text-emerald-700">
              {val > 0 ? formatIndianCurrencyAbbreviated(val) : '₹ 0'}
            </span>
          );
        },
      },
      {
        key: 'totalLandAreaSqMeter',
        label: t('colTotalArea'),
        align: 'right',
        render: (_val, row) => {
          const r = row as Record<string, unknown>;
          const area = Number(row.totalLandAreaSqMeter ?? r.TotalLandAreaSqMeter ?? 0);
          return (
            <span className="font-normal text-[12px] text-slate-600">
              {area > 0
                ? `${area.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Sq. Mtr`
                : '0 Sq. Mtr'}
            </span>
          );
        },
      },
      {
        key: 'totalInventoryQuantity',
        label: t('colTotalInventoryQty'),
        align: 'center',
        render: (_val, row) => {
          const r = row as Record<string, unknown>;
          const inv = Number(row.totalInventoryQuantity ?? r.TotalInventoryQuantity ?? 0);
          return (
            <span className="font-bold text-[12px] text-blue-600">
              {inv.toLocaleString('en-IN')}
            </span>
          );
        },
      },
    ];
  }, [t]);

  // ─── ASSET TYPE ITEM MODE COLUMNS (LEGACY) ──────────────────────────────────
  const assetTypeColumns = useMemo<Column<AssetTypeAssetItemDto>[]>(
    () => [
      {
        key: 'assetName',
        label: t('assetName'),
        align: 'left',
        render: (_val, row) => (
          <div className="flex items-center justify-start gap-1">
            <span className="font-medium text-[#003366]">
              {row.assetName || t('unnamedAsset')}
            </span>
          </div>
        ),
      },
      {
        key: 'capitalValue',
        label: t('capitalValue'),
        align: 'center',
        render: (_val, row) => (
          <span className="font-semibold text-green-700">
            {formatIndianCurrencyAbbreviated(row.capitalValue || 0)}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={drawerTitle}
      width="lg"
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Category Mode: 4 Metric Cards */}
        {isCategoryMode && (
          loading && (!categoryTypes || categoryTypes.length === 0) ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 h-20 animate-pulse flex flex-col justify-between shadow-xs"
                >
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-16 bg-slate-300/80 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {/* 1. TOTAL ASSETS */}
              <div className="bg-[#f0f4ff] border border-indigo-100 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                    {t('totalAssets')}
                  </span>
                </div>
                <div className="text-2xl font-black text-indigo-950 mt-1.5">
                  {categorySummaryStats.totalAssets.toLocaleString('en-IN')}
                </div>
              </div>

              {/* 2. TOTAL CAPITAL VALUE */}
              <div className="bg-[#ecfdf5] border border-emerald-100 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                    {t('totalCapitalValue')}
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-800 mt-1.5">
                  {formatIndianCurrencyAbbreviated(categorySummaryStats.totalValuation || 0)}
                </div>
              </div>

              {/* 3. TOTAL AREA */}
              <div className="bg-[#fffbeb] border border-amber-100 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
                    {t('totalArea')}
                  </span>
                </div>
                <div className="text-xl font-black text-amber-900 mt-1.5">
                  {categorySummaryStats.totalLandArea > 0
                    ? `${categorySummaryStats.totalLandArea.toLocaleString('en-IN', { maximumFractionDigits: 1 })} m²`
                    : '0 m²'}
                </div>
              </div>

              {/* 4. TOTAL INVENTORY QTY */}
              <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                    {t('totalInventoryQty')}
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-900 mt-1.5">
                  {categorySummaryStats.totalInventory.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )
        )}

        {/* Legacy Type Item Summary */}
        {!isCategoryMode && data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                {t('totalAssets')}
              </div>
              <div className="text-2xl font-black text-indigo-900">
                {data.totalCount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                {t('totalCv')}
              </div>
              <div className="text-xl font-black text-emerald-900">
                {formatIndianCurrencyAbbreviated(data.totalValuation || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="mt-1">
          {isCategoryMode ? (
            <MasterTable
              columns={categoryColumns}
              data={categoryTypes}
              loading={loading}
              totalCount={categoryTypes.length}
              paginationConfig={{ enabled: false }}
              containerClassName="border border-slate-200/90 rounded-xl overflow-hidden shadow-xs bg-white"
              theadClassName="bg-[#f0f4fc] border-b border-slate-200"
              tableClassName="w-full"
              rowClassName={() => 'hover:bg-blue-50/20 border-b border-slate-100 transition-colors'}
            />
          ) : (
            <MasterTable
              columns={assetTypeColumns}
              data={data?.items ?? []}
              loading={loading}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalCount={data?.totalCount ?? 0}
              totalPages={data?.totalPages ?? 0}
              onPageChange={onPageChange || (() => {})}
              paginationConfig={{ enabled: true, showPageSizeSelector: false }}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}


