'use client';

import { Camera, Loader2, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/common';
import { ImageWithFallback } from '@/components/modules/assets/municipal-Asset/asset-register/media/ImageWithFallback';
import type { AssetAdminCardProps } from '@/types/asset-gis.types';

export function AssetAdminCard({
  mpmsId,
  assetTypeName,
  departmentName,
  occupier,
  tenantNameVal,
  encroachmentStatus,
  mobile,
  isExpanded,
  hasChildUnits,
  isMainView,
  isShoppingComplexType,
  combinedChildAssetsCount,
  resolvedParentName,
  resolvedChildUnitName,
  displayThumbUrl,
  hasRealPhotos,
  realPhotoCount,
  isLoadingRealPhotos,
  hasRealAssetData,
  realPhotos,
  documents,
  onOpenImageModal,
  onOpenDocModal,
}: AssetAdminCardProps) {
  const t = useTranslations('assetGis');

  return (
    <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-[11px]">
      <div className="flex gap-2 items-start">
        {/* Image Thumbnail */}
        <div
          className={`rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group cursor-pointer relative transition-all duration-300 ${
            isExpanded ? 'w-[110px] h-[110px]' : 'w-[92px] h-[92px]'
          }`}
          onClick={() => {
            if (displayThumbUrl && onOpenImageModal) {
              onOpenImageModal(displayThumbUrl);
            } else if (hasRealPhotos && realPhotos && realPhotos.length > 0 && onOpenImageModal) {
              onOpenImageModal(realPhotos[0].url);
            } else if (documents && documents.length > 0 && onOpenDocModal) {
              onOpenDocModal();
            }
          }}
          title={displayThumbUrl ? 'View Asset Photos & Plans' : 'View Details'}
        >
          <ImageWithFallback
            src={displayThumbUrl || ''}
            alt="Asset Image"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            fill
            sizes="120px"
          />
          {hasRealPhotos && realPhotoCount > 0 && (
            <Badge size="sm" className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-extrabold z-10 backdrop-blur-xs border-0">
              <Camera className="w-3 h-3" />
              {realPhotoCount}
            </Badge>
          )}
          {isLoadingRealPhotos && !hasRealAssetData && (
            <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 z-10" title="Loading real photo count...">
              <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
            </span>
          )}
          {displayThumbUrl && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenImageModal) {
                  onOpenImageModal(displayThumbUrl);
                }
              }}
              icon={Maximize2}
              className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer h-auto border-0"
              title="Enlarge Photo Gallery"
            />
          )}
        </div>

        {/* Core Details List */}
        <div className={`flex-1 min-w-0 ${!isMainView && hasChildUnits ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]' : 'space-y-1'}`}>
          {!isMainView && hasChildUnits ? (
            <>
              {/* Column 1 */}
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.assetNo') || 'ASSET NO'}:</span>
                  <span className="font-black text-blue-600 font-mono text-[11px]">{mpmsId}</span>
                </div>
                {resolvedParentName && (
                  <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.complexName') || 'COMPLEX NAME'}:</span>
                    <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{resolvedParentName}</span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.department') || 'DEPARTMENT'}:</span>
                  <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{departmentName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.encroachment') || 'ENCROACHMENT'}:</span>
                  <Badge
                    variant={
                      encroachmentStatus.toLowerCase().includes('yes') || encroachmentStatus.toLowerCase().includes('encroached')
                        ? 'destructive'
                        : 'secondary'
                    }
                    size="sm"
                    className="font-extrabold uppercase text-[9px] px-2 py-0.5"
                  >
                    {encroachmentStatus}
                  </Badge>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.assetType') || 'ASSET TYPE'}:</span>
                  <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{assetTypeName}</span>
                </div>
                {resolvedChildUnitName && (
                  <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                    <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.shopName') || 'SHOP NAME'}:</span>
                    <span className="font-black text-slate-900 text-right text-[10px] leading-snug break-words whitespace-normal">{resolvedChildUnitName}</span>
                  </div>
                )}
                {tenantNameVal && (
                  <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                    <span className="text-emerald-700 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.tenantName') || 'TENANT NAME'}:</span>
                    <span className="font-black text-emerald-900 text-right text-[10px] leading-snug break-words whitespace-normal">{tenantNameVal}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.mobileNo') || 'MOBILE NO'}:</span>
                  <span className="font-bold text-slate-800 text-[10px] font-mono">{mobile}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.assetNo') || 'ASSET NO'}:</span>
                <span className="font-black text-blue-600 font-mono text-[11px]">{mpmsId}</span>
              </div>
              <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.assetType') || 'ASSET TYPE'}:</span>
                <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{assetTypeName}</span>
              </div>
              {hasChildUnits && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                  <span className="text-indigo-700 font-extrabold uppercase text-[9.5px]">{t('details.complexType') || 'COMPLEX TYPE'}:</span>
                  <span className="font-black text-indigo-900 text-[10px] uppercase">
                    {isShoppingComplexType ? `Commercial (${combinedChildAssetsCount} Units)` : `Multi-Unit (${combinedChildAssetsCount} Units)`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.department') || 'DEPARTMENT'}:</span>
                <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{departmentName}</span>
              </div>
              {tenantNameVal ? (
                <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                  <span className="text-emerald-700 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.tenantName') || 'TENANT NAME'}:</span>
                  <span className="font-black text-emerald-900 text-right text-[10px] leading-snug break-words whitespace-normal">{tenantNameVal}</span>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-1.5 border-b border-slate-100 pb-0.5">
                  <span className="text-slate-500 font-extrabold uppercase text-[9.5px] shrink-0 pt-0.5">{t('details.inCharge') || 'IN-CHARGE'}:</span>
                  <span className="font-bold text-slate-800 text-right text-[10px] leading-snug break-words whitespace-normal">{occupier}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.encroachment') || 'ENCROACHMENT'}:</span>
                <Badge
                  variant={
                    encroachmentStatus.toLowerCase().includes('yes') || encroachmentStatus.toLowerCase().includes('encroached')
                      ? 'destructive'
                      : 'secondary'
                  }
                  size="sm"
                  className="font-extrabold uppercase text-[9px] px-2 py-0.5"
                >
                  {encroachmentStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.mobileNo') || 'MOBILE NO'}:</span>
                <span className="font-bold text-slate-800 text-[10px] font-mono">{mobile}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
