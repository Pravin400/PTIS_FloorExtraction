'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import {
  isPropertyFrontPhoto,
  parseMediaEventPayload,
} from '@/lib/utils/ptis-photo-match.utils';
import { PHOTO_TYPE_CODES } from '@/lib/constants/photo-type-codes';
import { DocumentViewerModal } from '@/components/common/DocumentViewerModal';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  PropertyMasterRevenueCard,
  PropertyMasterCardSkeleton,
} from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components';
import {
  IndividualMasterHeader,
  IndividualMasterDetailsGrid,
} from './components';
import { usePropertyTaxAutoSync } from '@/hooks/property-tax/usePropertyTaxAutoSync';

export interface IndividualPropertyMasterCardProps {
  data?: IndividualPropertyMasterData;
  onEdit?: () => void;
  propertyId?: number;
  wardNo?: string;
  isLoading?: boolean;
}

const IndividualPropertyMasterCardComponent: React.FC<IndividualPropertyMasterCardProps> = ({
  data,
  onEdit,
  propertyId,
  wardNo,
  isLoading = false,
}) => {
  const t = useTranslations('individual');
  const [masterData, setMasterData] = useState<IndividualPropertyMasterData | undefined>(data);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [photoGuid, setPhotoGuid] = useState<string | undefined>(data?.societyBuildingPhotoGuid);
  const [imageUrl, setImageUrl] = useState<string | undefined>(data?.imageUrl);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activePropertyId = propertyId || masterData?.propertyId || data?.propertyId;

  const effectiveWardNo = useMemo(() => {
    if (wardNo && wardNo !== '-') return wardNo;
    if (masterData?.wardNo && masterData.wardNo !== '-') return masterData.wardNo;
    if (data?.wardNo && data.wardNo !== '-') return data.wardNo;
    return '-';
  }, [wardNo, masterData?.wardNo, data?.wardNo]);

  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setMasterData(data);
    if (data?.propertyId !== prevData?.propertyId) {
      setPhotoGuid(data?.societyBuildingPhotoGuid);
      setImageUrl(data?.imageUrl);
    }
  }

  useEffect(() => {
    const handleTopSectionUpdated = (e: Event) => {
      const updatedValues = (e as CustomEvent).detail?.updatedValues;
      if (updatedValues) {
        setMasterData((prev) => (prev ? { ...prev, ...updatedValues } : updatedValues));
      }
    };
    window.addEventListener('ptis:individual-top-section-updated', handleTopSectionUpdated);
    return () => window.removeEventListener('ptis:individual-top-section-updated', handleTopSectionUpdated);
  }, []);

  usePropertyTaxAutoSync({ activePropertyId, performance: masterData?.performance });

  useEffect(() => {
    const handleMediaUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updatedPropId = customEvent.detail?.propertyId;
      if (updatedPropId && activePropertyId && Number(updatedPropId) !== Number(activePropertyId)) {
        return;
      }
      const cat = customEvent.detail?.category || customEvent.detail?.photoCategory || customEvent.detail?.imageCategory;
      const catCode = customEvent.detail?.photoTypeCode;

      // Filter: strictly accept only the property front photo for the master card thumbnail:
      if (cat || catCode) {
        const isMatch =
          catCode === PHOTO_TYPE_CODES.PROPERTY_FRONT ||
          isPropertyFrontPhoto({ photoTypeCode: catCode, photoTypeName: cat }, cat);
        if (!isMatch) {
          return;
        }
      }

      const { photoGuid: parsedGuid, imageUrl: parsedUrl, isDeleted } = parseMediaEventPayload(customEvent.detail);

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

  const currentData = useMemo<IndividualPropertyMasterData>(() => {
    const merged: IndividualPropertyMasterData = {
      ...(masterData || data || {}),
    };
    if (effectiveWardNo && effectiveWardNo !== '-' && merged.wardNo !== effectiveWardNo) {
      merged.wardNo = effectiveWardNo;
    }
    return merged;
  }, [masterData, data, effectiveWardNo]);

  const photoUrl = imageUrl || (photoGuid ? getViewDocumentUrl(photoGuid) : '');

  const rawPropNo = currentData?.propertyNo || '-';
  const displayPropertyNo =
    effectiveWardNo && effectiveWardNo !== '-' && rawPropNo !== '-' && !rawPropNo.startsWith(effectiveWardNo)
      ? `${effectiveWardNo}-${rawPropNo}`
      : rawPropNo;

  const upicId = currentData?.upic || '-';
  const ownerName = currentData?.ownerName || currentData?.owner || currentData?.propertyHolder || '-';

  const getEditUrl = useCallback(() => {
    if (!activePropertyId) return '';
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('propertyId', String(activePropertyId));
    if (effectiveWardNo && effectiveWardNo !== '-') params.set('wardNo', effectiveWardNo);
    params.set('returnTab', 'individual');
    params.set('from', 'individual');
    const locale = pathname?.split('/')[1] || 'en';
    return `/${locale}/property-tax/ptis/QuickDataEntry/${activePropertyId}/Property?${params.toString()}`;
  }, [activePropertyId, searchParams, effectiveWardNo, pathname]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit();
      return;
    }
    const url = getEditUrl();
    if (url) {
      router.push(url);
    }
  }, [onEdit, getEditUrl, router]);

  const handlePrefetch = useCallback(() => {
    const url = getEditUrl();
    if (url) {
      router.prefetch(url);
    }
  }, [getEditUrl, router]);

  const isDataEmpty =
    (!masterData && !data) ||
    ((!currentData?.ownerName || currentData.ownerName === '-' || currentData.ownerName.trim() === '') &&
      (!currentData?.upic || currentData.upic === '-' || currentData.upic.trim() === ''));

  if (isLoading || (isDataEmpty && Boolean(activePropertyId || data?.propertyId || propertyId))) {
    return <PropertyMasterCardSkeleton />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-2 font-sans text-slate-800">
      {/* 1. LEFT / CENTER: MAIN PROPERTY MASTER CARD */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs px-1.5 xl:px-2 pt-1 pb-1.5 xl:pt-1.5 xl:pb-2 flex flex-col sm:flex-row items-stretch gap-1.5 xl:gap-2 min-w-0">
        {/* Building/Property Photo Thumbnail with Document overlay icon */}
        <div
          className={`relative w-full sm:w-[70px] md:w-[75px] lg:w-[70px] xl:w-[80px] 2xl:w-[115px] h-[135px] sm:h-auto rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 flex items-center justify-center group ${
            photoUrl || photoGuid ? 'cursor-pointer hover:border-blue-400' : ''
          }`}
          onClick={() => {
            if (photoUrl || photoGuid) {
              setIsDocumentViewerOpen(true);
            }
          }}
          title={photoUrl || photoGuid ? (t('photo.viewPhoto') || 'Click to view property photo') : undefined}
        >
          {photoUrl || photoGuid ? (
            <ImageWithFallback
              src={photoUrl}
              documentGuid={photoGuid}
              alt={ownerName !== '-' ? `${ownerName} ${t('photo.propertyPhoto') || 'Property Photo'}` : (t('photo.propertyPhoto') || 'Property Photo')}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 p-1 text-center bg-slate-50">
              <Building2 className="w-6 h-6 xl:w-7 xl:h-7 text-slate-300" />
              <span className="text-[9px] xl:text-[10px] font-medium text-slate-400 leading-tight">{t('photo.noPhoto') || 'No Photo'}</span>
            </div>
          )}
        </div>

        {/* Center: Main Metadata & 3 Sections Grid */}
        <div className="flex-1 flex flex-col justify-start gap-1 min-w-0 pt-0 overflow-hidden">
          {/* Top Identifiers Row */}
          <IndividualMasterHeader
            propertyNo={displayPropertyNo}
            upicId={upicId}
            ownerName={ownerName}
            onEdit={handleEdit}
            onPrefetch={handlePrefetch}
          />

          {/* 3-Section Details Grid */}
          <IndividualMasterDetailsGrid data={currentData} />
        </div>
      </div>

      {/* 2. RIGHT: REVENUE & TAX METRICS PANEL */}
      <PropertyMasterRevenueCard
        performance={currentData?.performance}
        descriptionRegional={currentData?.propertyDescriptionRegional || '-'}
      />

      {/* High-res Document / Photo Viewer Modal */}
      {photoUrl && (
        <DocumentViewerModal
          isOpen={isDocumentViewerOpen}
          onClose={() => setIsDocumentViewerOpen(false)}
          fileUrl={photoUrl}
          fileName={ownerName !== '-' ? `${ownerName} ${t('photo.propertyDocument') || 'Property Document'}` : (t('photo.propertyDocument') || 'Property Document')}
          label={t('photo.propertyPhoto') || 'Property Photo'}
        />
      )}
    </div>
  );
};

export const IndividualPropertyMasterCard = React.memo(IndividualPropertyMasterCardComponent);

