import { useTranslations } from 'next-intl';
import { Building2, DoorClosed, Columns, Box, IndianRupee, Vault } from 'lucide-react';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

import type { AssetSummaryCardProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function AssetSummaryCard({ floors = [], inventories = [], cvRollup, asset }: AssetSummaryCardProps) {
  const t = useTranslations('newAddNewAsset.review');

  // 1. Calculations aligned with Step 1 (Basic Information) summary cards
  const floorNames = new Set<string>();
  floors.forEach((unit) => {
    const floorLabel =
      unit.floor || unit.floorName || unit.FloorName || (unit.floorId != null ? String(unit.floorId) : '') || unit.subFloor || '';
    if (floorLabel) floorNames.add(floorLabel);
  });
  const fallbackFloors = floorNames.size;
  const totalFloorsCount = cvRollup?.totalFloors != null ? Number(cvRollup.totalFloors) : (cvRollup?.floorCount != null ? Number(cvRollup.floorCount) : fallbackFloors);

  const fallbackUnits = floors.reduce((sum, f) => {
    const r = f.noOfRooms != null && !isNaN(Number(f.noOfRooms)) ? Number(f.noOfRooms) : 1;
    return sum + r;
  }, 0);
  const totalRoomsCount = cvRollup?.totalUnits != null ? Number(cvRollup.totalUnits) : (cvRollup?.subUnitsCount != null ? Number(cvRollup.subUnitsCount) : fallbackUnits);

  const fallbackCarpetSqm = floors.reduce((sum, f) => {
    const carpetSqFt = Number(f.carpetAreaSqFeet || f.carpetAreaSqFt || 0);
    return sum + (carpetSqFt / 10.7639);
  }, 0);
  const totalAreaVal = cvRollup?.totalCarpetAreaSqMeter != null 
    ? Number(cvRollup.totalCarpetAreaSqMeter) 
    : fallbackCarpetSqm;

  const totalAssetsQty = inventories.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const fallbackCapitalValue = floors.reduce((sum, f) => sum + Number(f.capitalValue || 0), 0);
  const totalAssetVal = cvRollup?.totalCapitalValue != null 
    ? Number(cvRollup.totalCapitalValue) 
    : (fallbackCapitalValue > 0 ? fallbackCapitalValue : (Number(asset?.capitalValue || 0) + inventories.reduce((sum, item) => sum + Number(item.totalBatchCV || item.capitalValue || 0), 0)));

  const netBookVal = asset?.currentBookValue != null && Number(asset.currentBookValue) > 0
    ? Number(asset.currentBookValue)
    : totalAssetVal;

  const summaryData = [
    {
      icon: Building2,
      label: t('totalFloors'),
      value: String(totalFloorsCount),
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: DoorClosed,
      label: t('totalRooms'),
      value: String(totalRoomsCount),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Columns,
      label: t('totalArea'),
      value: totalAreaVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Box,
      label: t('totalAssets'),
      value: String(totalAssetsQty),
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: IndianRupee,
      label: t('totalAssetValue'),
      value: formatIndianCurrencyAbbreviated(totalAssetVal),
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Vault,
      label: t('netBookValue'),
      value: formatIndianCurrencyAbbreviated(netBookVal),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheckIcon className="w-[18px] h-[18px] text-[#2435c2]" />
        <h3 className="text-[15px] font-black text-[#101b87]">{t('assetSummary')}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {summaryData.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm">
              <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${item.bgColor} ${item.color}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-[#2435c2] mb-0.5 leading-tight break-words">{item.label}</p>
                <p className="text-[12px] font-black text-[#101b87] leading-none whitespace-nowrap">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}
