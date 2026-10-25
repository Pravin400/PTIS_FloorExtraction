import { useTranslations } from 'next-intl';
import { 
  Building, Box, ShieldCheck
} from 'lucide-react';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

import type { ReviewCardsProps, ReviewCardItem } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function ReviewCards({ onEdit, formData, asset, inventories = [], cvRollup, ownershipTypes = [] }: ReviewCardsProps) {
  const t = useTranslations('newAddNewAsset.review');
  
  // 1. Basic Info
  const assetName = formData?.assetName || asset?.assetName || '';
  const assetCode = formData?.assetCode || asset?.assetNo || 'Draft / Not Generated';
  const assetType = formData?.assetTypeStr || asset?.assetTypeName || '';
  const category = formData?.categoryStr || asset?.assetCategoryName || '';

  // 2. Location Info
  const location = formData?.address || asset?.address || '';
  const landArea = formData?.landArea || asset?.details?.landAreaSqMeter || '';
  let ownership = formData?.ownershipType || asset?.ownershipType || '';

  if (ownershipTypes && ownershipTypes.length > 0) {
    const target = String(ownership || '').trim().toLowerCase();
    const found = ownershipTypes.find(
      (ot) =>
        String(ot.id) === String(ownership) ||
        String(ot.Id) === String(ownership) ||
        String(ot.value) === String(ownership) ||
        String(ot.ownershipTypeName || '').toLowerCase() === target ||
        String(ot.name || '').toLowerCase() === target ||
        String(ot.code || '').toLowerCase() === target
    );
    if (found) {
      ownership = found.ownershipTypeName || found.name || found.label || String(ownership);
    }
  }
  if (typeof ownership === 'string' && ownership && ownership === ownership.toLowerCase()) {
    ownership = ownership.charAt(0).toUpperCase() + ownership.slice(1);
  }
  // 3. Inventory Classification & Totals
  let totalQty = 0;
  let equipmentQty = 0;
  let furnitureQty = 0;
  let fixturesQty = 0;
  let othersQty = 0;

  inventories.forEach(item => {
    const qty = Number(item.quantity || 0);
    const cat = String(item.names?.inventoryType || item.category || "").toLowerCase();
    
    totalQty += qty;
    if (cat.includes("furniture")) {
      furnitureQty += qty;
    } else if (cat.includes("fixture")) {
      fixturesQty += qty;
    } else if (cat.includes("equipment") || cat.includes("electronics") || cat.includes("vehicle") || cat.includes("it")) {
      equipmentQty += qty;
    } else {
      othersQty += qty;
    }
  });

  const totalInventoryValue = cvRollup?.inventoryCapitalValue != null 
    ? Number(cvRollup.inventoryCapitalValue) 
    : inventories.reduce((sum, item) => sum + Number(item.totalBatchCV || item.capitalValue || 0), 0);

  const isMovableCategory = Boolean(
    formData?.isMovableCategory ||
    formData?.isMovable ||
    /movable|vehicle|equipment|furniture|जंगम|वाहन|उपकरण/i.test(String(category))
  );
  const showLocation = !isMovableCategory;
  const showInventory = Boolean(formData?.hasInventory || (inventories && inventories.length > 0));

  const CARDS = [
    {
      id: 1,
      step: 1,
      icon: Building,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      title: t('step1Title'),
      subtitle: t('step1Subtitle'),
      rows: [
        { label: t('assetName'), value: String(assetName) },
        { label: t('assetCode'), value: String(assetCode) },
        { label: t('assetType'), value: String(assetType) },
        { label: t('category'), value: String(category) }
      ]
    },
    showLocation ? {
      id: 2,
      step: 2,
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      title: t('step2Title'),
      subtitle: t('step2Subtitle'),
      rows: [
        { label: t('location'), value: String(location) },
        { label: t('landArea'), value: landArea ? `${Number(landArea).toLocaleString('en-IN')} ${t('sqMtr')}` : '' },
        { label: t('ownership'), value: String(ownership) }
      ]
    } : null,
    showInventory ? {
      id: 3,
      step: 3,
      icon: Box,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: t('step3Title'),
      subtitle: t('step3Subtitle'),
      rows: [
        { label: t('totalAssets'), value: String(totalQty) },
        { label: t('equipment'), value: String(equipmentQty) },
        { label: t('furniture'), value: String(furnitureQty) },
        { label: t('fixtures'), value: String(fixturesQty) },
        { label: t('others'), value: String(othersQty) },
        { label: t('totalAssetValue'), value: formatIndianCurrencyAbbreviated(totalInventoryValue) }
      ]
    } : null
  ].filter(Boolean) as ReviewCardItem[];

  const gridColsClass = CARDS.length === 1 
    ? 'grid-cols-1 max-w-xl' 
    : CARDS.length === 2 
    ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div>
              {/* Card Header (Icon + Title + Edit Button) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}>
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-[#101b87]">{card.title}</h4>
                    <p className="text-[11px] font-bold text-[#2d42db] mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => onEdit(card.step)}
                  className="px-4 py-1.5 border border-blue-200 text-blue-600 bg-white rounded-lg text-[11px] font-bold hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {t('edit')}
                </button>
              </div>

              {/* Card Body (Metadata list) */}
              <div className="space-y-2.5">
                {card.rows.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4 text-[12px]">
                    <span className="font-bold text-slate-500">{item.label}:</span>
                    <span className="font-black text-[#101b87] text-right truncate max-w-[200px]" title={item.value || '-'}>
                      {item.value || '–'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
