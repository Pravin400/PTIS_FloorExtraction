'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import type { PropertyMasterData } from '@/types/property-tax/apartment';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import {
  isSocietyPhoto,
  isWingPhoto,
  parseMediaEventPayload,
} from '@/lib/utils/ptis-photo-match.utils';
import { PHOTO_TYPE_CODES } from '@/lib/constants/photo-type-codes';
import { DocumentViewerModal } from '@/components/common/DocumentViewerModal';
import { PropertyMasterHeader } from './components/PropertyMasterHeader';
import { PropertyMasterDetailsGrid } from './components/PropertyMasterDetailsGrid';
import { PropertyMasterRevenueCard } from './components/PropertyMasterRevenueCard';
import { PropertyMasterCardSkeleton } from './components/PropertyMasterCardSkeleton';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePropertyTaxAutoSync } from '@/hooks/property-tax/usePropertyTaxAutoSync';

interface PropertyMasterCardProps {
  data?: PropertyMasterData;
  onEdit?: () => void;
  propertyId?: number;
  isLoading?: boolean;
  wingsCount?: number;
  isMiddleSectionVisible?: boolean;
  onToggleMiddleSection?: () => void;
}

const PropertyMasterCardComponent: React.FC<PropertyMasterCardProps> = ({
  data,
  onEdit,
  propertyId,
  isLoading = false,
  wingsCount,
  isMiddleSectionVisible: isMiddleSectionVisibleProp,
  onToggleMiddleSection: onToggleMiddleSectionProp,
}) => {
  const t = useTranslations('ptis');
  const [internalMiddleVisible, setInternalMiddleVisible] = useState(false);
  const isMiddleSectionVisible =
    isMiddleSectionVisibleProp !== undefined ? isMiddleSectionVisibleProp : internalMiddleVisible;
  const handleToggleMiddleSection = () => {
    if (onToggleMiddleSectionProp) {
      onToggleMiddleSectionProp();
    } else {
      setInternalMiddleVisible((prev) => !prev);
    }
  };
  const [masterData, setMasterData] = useState<PropertyMasterData | undefined>(data);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [photoGuid, setPhotoGuid] = useState<string | undefined>(data?.societyBuildingPhotoGuid);
  const [imageUrl, setImageUrl] = useState<string | undefined>(data?.imageUrl);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activePropertyId = propertyId || data?.propertyId;

  const effectiveWardNo =
    masterData?.wardNo && masterData.wardNo !== '-'
      ? masterData.wardNo
      : data?.wardNo && data.wardNo !== '-'
        ? data.wardNo
        : '-';

  const effectiveWingsCount =
    wingsCount ??
    masterData?.totalWings ??
    data?.totalWings ??
    (masterData?.wings && masterData.wings.length > 0 ? masterData.wings.length : undefined) ??
    (data?.wings && data.wings.length > 0 ? data.wings.length : undefined);

  const currentData: PropertyMasterData = {
    ...(masterData || data || {}),
    wardNo: effectiveWardNo,
    division: masterData?.division || data?.division || '-',
    upic: masterData?.upic || data?.upic || '-',
    plotNo: masterData?.plotNo || data?.plotNo || '-',
    taxZone: masterData?.taxZone || data?.taxZone || '-',
    totalWings: effectiveWingsCount,
  };
  const rawPropNo = currentData?.propertyNo || '-';
  const displayPropertyNo =
    effectiveWardNo &&
    effectiveWardNo !== '-' &&
    rawPropNo !== '-' &&
    !rawPropNo.startsWith(effectiveWardNo)
      ? `${effectiveWardNo}-${rawPropNo}`
      : rawPropNo;
  const upicId = currentData?.upic || '-';
  const societyName =
    currentData?.societyName ||
    currentData?.ownerName ||
    currentData?.owner ||
    currentData?.propertyHolder ||
    '-';

  const photoUrl = imageUrl || (photoGuid ? getViewDocumentUrl(photoGuid) : '');

  const getSocietyEditUrl = React.useCallback(() => {
    if (!activePropertyId) return '';
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('propertyId', String(activePropertyId));
    if (effectiveWardNo && effectiveWardNo !== '-') params.set('wardNo', effectiveWardNo);
    const rawProp =
      searchParams?.get('propertyNo') ||
      (currentData?.propertyNo !== '-' ? currentData?.propertyNo : null);
    const cleanProp =
      rawProp && effectiveWardNo !== '-' && rawProp.startsWith(`${effectiveWardNo}-`)
        ? rawProp.slice(effectiveWardNo.length + 1)
        : rawProp;
    if (cleanProp && cleanProp !== '-') params.set('propertyNo', cleanProp);
    params.set('returnTab', 'apartment');
    params.set('hideWing', 'true');
    params.set('fromSocietyEdit', 'true');
    const locale = pathname?.split('/')[1] || 'en';
    return `/${locale}/property-tax/ptis/QuickDataEntry/${activePropertyId}/Society?${params.toString()}`;
  }, [activePropertyId, searchParams, effectiveWardNo, currentData?.propertyNo, pathname]);

  const handleSocietyEdit = React.useCallback(() => {
    const url = getSocietyEditUrl();
    if (url) {
      router.push(url);
    }
  }, [getSocietyEditUrl, router]);

  const handleSocietyPrefetch = React.useCallback(() => {
    const url = getSocietyEditUrl();
    if (url) {
      router.prefetch(url);
    }
  }, [getSocietyEditUrl, router]);

  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setMasterData(data);
    if (data?.propertyId !== prevData?.propertyId) {
      setPhotoGuid(data?.societyBuildingPhotoGuid);
      setImageUrl(data?.imageUrl);
      setInternalMiddleVisible(false);
    }
  }

  usePropertyTaxAutoSync({ activePropertyId, performance: masterData?.performance });

  useEffect(() => {
    const handleMediaUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedPropId = customEvent.detail?.propertyId;
      if (updatedPropId && activePropertyId && Number(updatedPropId) !== Number(activePropertyId)) {
        return;
      }
      const cat =
        customEvent.detail?.category ||
        customEvent.detail?.photoCategory ||
        customEvent.detail?.imageCategory;
      const catCode = customEvent.detail?.photoTypeCode;

      // In apartment / society view, accept Society Photo (SOCIETY_PLACE, etc.) or Wing Photo (WING_BUILDING)
      if (cat || catCode) {
        const isMatch =
          catCode === PHOTO_TYPE_CODES.SOCIETY_PLACE ||
          catCode === PHOTO_TYPE_CODES.WING_BUILDING ||
          isSocietyPhoto(catCode, cat) ||
          isWingPhoto(catCode, cat);
        if (!isMatch) {
          return;
        }
      }

      const {
        photoGuid: parsedGuid,
        imageUrl: parsedUrl,
        isDeleted,
      } = parseMediaEventPayload(customEvent.detail);

      if (isDeleted || (!parsedGuid && !parsedUrl)) {
        setPhotoGuid(undefined);
        setImageUrl(undefined);
        setMasterData((prev) =>
          prev
            ? {
                ...prev,
                societyBuildingPhotoGuid: undefined,
                imageUrl: undefined,
              }
            : undefined
        );
      } else {
        setPhotoGuid(parsedGuid);
        setImageUrl(parsedUrl);
        setMasterData((prev) =>
          prev
            ? {
                ...prev,
                societyBuildingPhotoGuid: parsedGuid,
                imageUrl: parsedUrl,
              }
            : undefined
        );
      }
    };
    window.addEventListener('ptis:sync-thumbnail', handleMediaUpdated);
    window.addEventListener('ptis:media-updated', handleMediaUpdated);
    return () => {
      window.removeEventListener('ptis:sync-thumbnail', handleMediaUpdated);
      window.removeEventListener('ptis:media-updated', handleMediaUpdated);
    };
  }, [activePropertyId]);

  const isDataEmpty =
    (!masterData && !data) ||
    ((!currentData?.societyName || currentData.societyName === '-' || currentData.societyName.trim() === '') &&
      (!currentData?.upic || currentData.upic === '-' || currentData.upic.trim() === ''));

  if (isLoading || (isDataEmpty && Boolean(activePropertyId || data?.propertyId || propertyId))) {
    return <PropertyMasterCardSkeleton />;
  }


  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-2 font-sans text-slate-800">
      {/* 1. LEFT / CENTER: MAIN PROPERTY MASTER CARD */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs px-1.5 xl:px-2 pt-1 pb-1.5 xl:pt-1.5 xl:pb-2 flex flex-col sm:flex-row items-stretch gap-1.5 xl:gap-2 min-w-0">
        {/* Building Photo Thumbnail */}
        <div
          className={`relative w-full sm:w-[70px] md:w-[75px] lg:w-[70px] xl:w-[80px] 2xl:w-[115px] h-[135px] sm:h-auto rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 flex items-center justify-center group ${
            photoUrl || photoGuid ? 'cursor-pointer hover:border-blue-400' : ''
          }`}
          onClick={() => {
            if (photoUrl || photoGuid) {
              setIsDocumentViewerOpen(true);
            }
          }}
          title={photoUrl || photoGuid ? 'Click to view document' : undefined}
        >
          {photoUrl || photoGuid ? (
            <ImageWithFallback
              src={photoUrl}
              documentGuid={photoGuid}
              alt={societyName !== '-' ? `${societyName} Photo` : 'Society Building Photo'}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 p-1 text-center bg-slate-50">
              <Building2 className="w-6 h-6 xl:w-7 xl:h-7 text-slate-300" />
              <span className="text-[9px] xl:text-[10px] font-medium text-slate-400 leading-tight">
                {t('media.noPhoto')}
              </span>
            </div>
          )}
        </div>

        {/* Center: Main Metadata & 3 Sections */}
        <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0 pt-0 overflow-hidden">
          {/* Top Identifiers Row */}
          <PropertyMasterHeader
            propertyNo={displayPropertyNo}
            upicId={upicId}
            societyName={societyName}
            onEdit={() => {
              if (onEdit) {
                onEdit();
              } else {
                handleSocietyEdit();
              }
            }}
            onPrefetch={handleSocietyPrefetch}
          />

          {/* 3-Section Tabular Grid */}
          <PropertyMasterDetailsGrid
            data={currentData}
            isMiddleSectionVisible={isMiddleSectionVisible}
            onToggleMiddleSection={handleToggleMiddleSection}
          />
        </div>
      </div>

      {/* 2. RIGHT: REVENUE & TAX METRICS PANEL */}
      <PropertyMasterRevenueCard
        performance={currentData?.performance}
        descriptionRegional={currentData?.propertyDescriptionRegional}
      />

      {/* Document Viewer Modal for high-res photo inspection */}
      {photoUrl && (
        <DocumentViewerModal
          isOpen={isDocumentViewerOpen}
          onClose={() => setIsDocumentViewerOpen(false)}
          fileUrl={photoUrl}
          fileName={societyName !== '-' ? `${societyName} Document` : 'Society Document'}
          label="Society Photo"
        />
      )}
    </div>
  );
};

export const PropertyMasterCard = React.memo(PropertyMasterCardComponent);

