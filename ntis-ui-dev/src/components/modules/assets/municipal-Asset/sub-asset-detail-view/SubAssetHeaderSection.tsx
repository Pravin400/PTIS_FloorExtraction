'use client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React from 'react';
import { Store, IndianRupee, ArrowUp, Building2 } from 'lucide-react';
import { Badge } from '@/components/common';
import { AssetHealthGauge } from '../asset-detail-view/AssetHealthGauge';
import { SubAssetBackButton } from './SubAssetBackButton';
import type { SubAssetHeaderSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

function ValuationCard({ valuation, label, change, rupeeSymbol }: { valuation: string, label: string, change?: string, rupeeSymbol: string }) {
  let displayValuation = (valuation || '-').replace('Rs ', rupeeSymbol + ' ');
  if (displayValuation === `${rupeeSymbol} 21,00,000`) displayValuation = `${rupeeSymbol} 21 Lakh`;

  return (
    <div className="flex flex-row items-center gap-2 border border-slate-200 rounded-lg px-2 py-1 h-full shadow-sm bg-blue-50/50 min-w-[140px]">
      <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-200 border-none">
        <IndianRupee className="w-4 h-4" />
      </div>
      <div className="flex flex-col items-start justify-center">
        <span className="text-[14px] font-black leading-tight text-[#1e3a8a]">{displayValuation}</span>
        <span className="text-[10px] font-bold leading-tight text-blue-900 mt-0.5">{label}</span>
        {change && change !== '-' ? (
          <span className="text-[9px] font-bold mt-0.5 text-emerald-600 bg-emerald-50 px-1 rounded flex items-center gap-0.5">
            <ArrowUp className="w-2.5 h-2.5" />
            {change.replace('+', '')}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SubAssetHeaderSection({ data }: SubAssetHeaderSectionProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  // Extracting specific badges for styling
  const activeAgreement = data.agreementNo && data.agreementNo !== '-'
    ? 'Active Agreement'
    : 'No Agreement';
  const floorBadge = data.subAssetFloor || 'Ground Floor';
  const useBadge = data.subAssetUsage || 'Retail Use';

  return (
    <div className="bg-blue-50/30 border border-blue-100 rounded-lg px-3 py-1.5 shadow-sm w-full flex items-stretch justify-between gap-4">
      {/* Left: image + parent asset info + category */}
      <div className="flex items-stretch gap-4 flex-[2.2] min-w-0 pr-4 border-r border-slate-100">
        <div className="flex items-center justify-center">
          <SubAssetBackButton />
        </div>

        <div className="w-[165px] rounded overflow-hidden flex-shrink-0 border border-slate-200 relative bg-slate-100 flex items-center justify-center">
          {data.subAssetPhotos && data.subAssetPhotos.length > 0 && data.subAssetPhotos[0].url ? (
            <Image src={data.subAssetPhotos[0].url} alt={data.subAssetPhotos[0].alt || data.parentAssetName || 'Asset Photo'} fill className="object-cover" sizes="165px" />
          ) : (
            <Store className="w-8 h-8 text-slate-300" />
          )}
        </div>

        <div className="flex flex-1 items-center justify-start gap-10 min-w-0">
          <div className="flex flex-col justify-center min-w-0 py-1 pr-6 border-r border-slate-100/50">
            <h1 className="text-[17px] font-black text-[#0A1A44] leading-normal truncate mb-1 pt-1">{data.parentAssetName}</h1>
            <p className="text-[11px] font-bold text-[#435272] mb-1">
              <span className="text-slate-500">{t('mainAssetLabel')}{t('idSuffix')}</span> <span className="text-blue-600">{data.parentAssetId}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-500 truncate">{data.parentAddress}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-500 mb-0.5">{t('category')}</span>
              <span className="text-[13px] font-black text-[#0A1A44] leading-tight truncate mb-0.5">{data.assetCategoryName || t('na')}</span>
              <span className="text-[10px] font-bold text-slate-500 leading-tight truncate">{data.assetTypeName ? `(${data.assetTypeName})` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-asset identity block */}
      <div className="flex items-center gap-3 px-4 border-l border-slate-100 flex-[1.1] min-w-0">
        <div className="text-blue-700 flex-shrink-0">
          <Store className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[20px] font-black text-red-600 truncate">{data.shopName || data.subAssetShopNo}</span>
            {data.subAssetStatus === 'Vacant' ? (
              <Badge variant="destructive" size="sm" className="bg-red-100 text-red-600 border-none !gap-1 !px-1.5 !py-0.5 !h-auto !rounded !text-[10px]">
                {t('vacant')}
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="bg-green-100 text-green-600 border-none !gap-1 !px-1.5 !py-0.5 !h-auto !rounded !text-[10px]">
                {t('occupied')}
              </Badge>
            )}
          </div>
          <p className="text-[11px] font-bold text-blue-700 mb-2 truncate">
            {t('subAssetLabel')}{t('idSuffix')} {data.subAssetId}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="default" size="sm" className="bg-blue-50 text-blue-600 border-none !py-0.5 !px-1.5 !h-auto !rounded !text-[9px]">
              {activeAgreement}
            </Badge>
            <Badge variant="secondary" size="sm" className="bg-purple-50 text-purple-600 border-none !py-0.5 !px-1.5 !h-auto !rounded !text-[9px]">
              {floorBadge}
            </Badge>
            <Badge variant="destructive" size="sm" className="bg-red-50 text-red-600 border-none !py-0.5 !px-1.5 !h-auto !rounded !text-[9px]">
              {useBadge}
            </Badge>
          </div>
        </div>
      </div>

      {/* Right: Health Score + Valuation */}
      <div className="flex items-stretch gap-2 flex-shrink-0">
        <AssetHealthGauge value={data.healthScore} max={100} healthLabel={t('assetHealthLabel')} />
        <ValuationCard valuation={data.valuation} label={t('valuationLabel')} change={data.valuationChange || '-'} rupeeSymbol={t('rupeeSymbol')} />
      </div>
    </div>
  );
}

