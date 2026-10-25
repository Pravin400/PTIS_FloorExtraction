'use client';

import React from 'react';
import { Button } from '@/components/common';
import { Images, X, Plus, RefreshCw } from 'lucide-react';
import { ImageHoverPreview } from './ImageHoverPreview';
import { MediaImageCard, AdditionalImagesGrid, type AdditionalImage } from './MediaImageCards';
import { formatWingCardLabel } from './mediaData';
import { ChangeDetectionCard } from './ChangeDetectionCard';
import { GisMapCard } from './GisMapCard';
import type { PhotoCategory } from './PhotoPlanSidebar';
import type { HoverPreviewData } from '@/hooks/ptis/photoplan/useImageHoverPreview';
import type { WingWiseWingDetails } from '@/types/property-tax/apartment';

interface PropertyMediaPanelContentProps {
  categories: PhotoCategory[];
  t: (key: string) => string;
  wings?: WingWiseWingDetails[];
  wingName?: string;
  openDrawer: (categoryIndex: number, imageIndex?: number, mode?: 'view' | 'create') => void;
  handleImageHover: (
    src: string,
    title: string,
    src2?: string,
    beforeLabel?: string,
    afterLabel?: string,
    fallbackSrc?: string,
    fallbackSrc2?: string,
    documentGuid?: string,
    anchorRect?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      width: number;
      height: number;
    }
  ) => void;
  handleImageLeave: () => void;
  cancelImageLeave: () => void;
  hoverPreview: HoverPreviewData | null;
  propertyPhoto?: AdditionalImage;
  propertyPhotoCategory?: PhotoCategory;
  societyPhoto?: AdditionalImage;
  societyPhotoCategory?: PhotoCategory;
  wingPhoto?: AdditionalImage;
  wingPhotoCategory?: PhotoCategory;
  photoPlanPhoto?: AdditionalImage;
  photoPlanCategory?: PhotoCategory;
  amenityPhoto?: AdditionalImage;
  amenityPhotoCategory?: PhotoCategory;
  isAmenityProperty?: boolean;
  handleCreateClick: (e: React.MouseEvent) => void;
  handleSyncPlan?: (e: React.MouseEvent) => void;
  isSyncingPlan?: boolean;
  gisPhoto?: AdditionalImage;
  hasCoords?: boolean;
  cdBeforeImg: string;
  cdAfterImg: string;
  cdBeforeLabel: string;
  cdAfterLabel: string;
  fallbackBeforeUrl: string;
  fallbackAfterUrl: string;
  cdCategory?: PhotoCategory;
  isMainProperty?: boolean;
  isQuickDataEntry?: boolean;
}

export function PropertyMediaPanelContent({
  categories,
  t,
  openDrawer,
  handleImageHover,
  handleImageLeave,
  cancelImageLeave,
  hoverPreview,
  propertyPhoto,
  propertyPhotoCategory,
  societyPhoto,
  societyPhotoCategory,
  wingPhoto,
  wingPhotoCategory,
  photoPlanPhoto,
  photoPlanCategory,
  amenityPhoto,
  amenityPhotoCategory,
  isAmenityProperty = false,
  handleCreateClick,
  handleSyncPlan,
  isSyncingPlan = false,
  gisPhoto,
  hasCoords = true,
  cdBeforeImg,
  cdAfterImg,
  cdBeforeLabel,
  cdAfterLabel,
  fallbackBeforeUrl,
  fallbackAfterUrl,
  cdCategory,
  wings: _wings = [],
  wingName,
  isMainProperty = false,
  isQuickDataEntry = false,
}: PropertyMediaPanelContentProps): React.ReactElement {
  const [expandedCategory, setExpandedCategory] = React.useState<'society' | 'wing' | 'property' | null>(null);

  const societyRemainingImages = React.useMemo(() => societyPhotoCategory?.images.slice(1) || [], [societyPhotoCategory]);
  const wingRemainingImages = React.useMemo(() => wingPhotoCategory?.images.slice(1) || [], [wingPhotoCategory]);
  const propertyRemainingImages = React.useMemo(() => propertyPhotoCategory?.images.slice(1) || [], [propertyPhotoCategory]);

  const handleCardHover = React.useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      photo?: AdditionalImage,
      fallbackTitle?: string,
      customSrc2?: string,
      beforeLabel?: string,
      afterLabel?: string,
      fallbackSrc?: string,
      fallbackSrc2?: string
    ) => {
      const src = photo?.fullSrc || photo?.src || '';
      const guid = photo?.documentGuid;
      const title = photo?.title || fallbackTitle || '';
      const hasActualPhoto = Boolean(src || guid || photo?.hasPhoto);

      if (customSrc2 || fallbackSrc2) {
        if (!src && !customSrc2 && !fallbackSrc && !fallbackSrc2) {
          handleImageHover(src, title);
          return;
        }
        const rect = e?.currentTarget?.getBoundingClientRect?.()
          ? {
              top: e.currentTarget.getBoundingClientRect().top,
              bottom: e.currentTarget.getBoundingClientRect().bottom,
              left: e.currentTarget.getBoundingClientRect().left,
              right: e.currentTarget.getBoundingClientRect().right,
              width: e.currentTarget.getBoundingClientRect().width,
              height: e.currentTarget.getBoundingClientRect().height,
            }
          : undefined;
        handleImageHover(
          src,
          title,
          customSrc2 || '',
          beforeLabel,
          afterLabel,
          fallbackSrc,
          fallbackSrc2,
          undefined,
          rect
        );
        return;
      }

      if (!hasActualPhoto) {
        handleImageHover(src, title);
        return;
      }

      const rect = e?.currentTarget?.getBoundingClientRect?.()
        ? {
            top: e.currentTarget.getBoundingClientRect().top,
            bottom: e.currentTarget.getBoundingClientRect().bottom,
            left: e.currentTarget.getBoundingClientRect().left,
            right: e.currentTarget.getBoundingClientRect().right,
            width: e.currentTarget.getBoundingClientRect().width,
            height: e.currentTarget.getBoundingClientRect().height,
          }
        : undefined;

      handleImageHover(
        src,
        title,
        undefined,
        undefined,
        undefined,
        fallbackSrc,
        undefined,
        guid,
        rect
      );
    },
    [handleImageHover]
  );

  if (isQuickDataEntry) {
    return (
      <>
        <ImageHoverPreview
          src={hoverPreview?.src ?? ''}
          src2={hoverPreview?.src2}
          title={hoverPreview?.title ?? ''}
          beforeLabel={hoverPreview?.beforeLabel}
          afterLabel={hoverPreview?.afterLabel}
          fallbackSrc={hoverPreview?.fallbackSrc}
          fallbackSrc2={hoverPreview?.fallbackSrc2}
          documentGuid={hoverPreview?.documentGuid}
          visible={hoverPreview !== null}
          onMouseEnter={cancelImageLeave}
          onMouseLeave={handleImageLeave}
        />
        <div data-media-panel="true" className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-2 scrollbar-thin">
          {categories.map((cat, idx) => {
            const latestImg = cat.images && cat.images.length > 0 ? cat.images[cat.images.length - 1] : cat.images[0];
            const latestImgIdx = cat.images && cat.images.length > 0 ? cat.images.length - 1 : 0;
            return (
              <MediaImageCard
                key={cat.photoTypeId || cat.photoTypeCode}
                src={latestImg?.src || ''}
                documentGuid={latestImg?.documentGuid}
                fullSrc={latestImg?.fullSrc || ''}
                alt={cat.photoTypeName}
                label={cat.photoTypeName}
                hoverBorderColor="hover:border-blue-500"
                onClick={() => {
                  openDrawer(idx, latestImgIdx);
                }}
                onMouseEnter={(e) => {
                  const src = latestImg?.fullSrc || latestImg?.src || '';
                  const guid = latestImg?.documentGuid;
                  if (!src && !guid) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleImageHover(
                    src,
                    cat.photoTypeName,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    guid,
                    {
                      top: rect.top,
                      bottom: rect.bottom,
                      left: rect.left,
                      right: rect.right,
                      width: rect.width,
                      height: rect.height,
                    }
                  );
                }}
                onMouseLeave={handleImageLeave}
                hasPhoto={latestImg?.hasPhoto}
              />
            );
          })}
        </div>
      </>
    );
  }

  const isSociety = !isAmenityProperty && (Boolean(isMainProperty) || societyPhotoCategory !== undefined) && categories.some((c) => c.photoTypeCode?.startsWith('SOCIETY_') || c.photoTypeCode?.includes('SOCIETY'));
  const isWing = !isAmenityProperty && (Boolean(isMainProperty) || wingPhotoCategory !== undefined || Boolean(wingName)) && categories.some((c) => c.photoTypeCode?.startsWith('WING_') || c.photoTypeCode?.includes('WING'));

  const hasPropertySlot = categories.some((c) => !c.isCustom && (c.photoTypeCode?.startsWith('PROPERTY_') || c.photoTypeCode === 'FRONT'));

  const wingCardLabel = formatWingCardLabel(
    wingPhotoCategory?.photoTypeName || t('media.wingPhoto') || 'Wing Photo',
    wingName
  );

  const effectiveWingPhotoTitle = wingPhoto?.title
    ? formatWingCardLabel(wingPhoto.title, wingName)
    : wingCardLabel;

  const effectiveWingPhotoAlt = wingPhoto?.alt
    ? formatWingCardLabel(wingPhoto.alt, wingName)
    : wingCardLabel;

  const mainCardLabel = isSociety
    ? (t('media.societyPhoto') || 'Society Photo')
    : isWing
      ? wingCardLabel
      : (t('media.propertyPhoto') || 'Property Photo');

  return (
    <>
      <ImageHoverPreview
        src={hoverPreview?.src ?? ''}
        src2={hoverPreview?.src2}
        title={hoverPreview?.title ?? ''}
        beforeLabel={hoverPreview?.beforeLabel}
        afterLabel={hoverPreview?.afterLabel}
        fallbackSrc={hoverPreview?.fallbackSrc}
        fallbackSrc2={hoverPreview?.fallbackSrc2}
        documentGuid={hoverPreview?.documentGuid}
        visible={hoverPreview !== null}
        onMouseEnter={cancelImageLeave}
        onMouseLeave={handleImageLeave}
      />

      <div data-media-panel="true" className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden p-2 flex flex-col sm:grid sm:grid-cols-3 lg:flex lg:flex-col gap-2 scrollbar-thin">
        {isAmenityProperty ? (
          <>
            {/* Amenity Photo Card */}
            <MediaImageCard
              src={amenityPhoto?.src || ''}
              documentGuid={amenityPhoto?.documentGuid}
              fullSrc={amenityPhoto?.fullSrc || ''}
              alt={amenityPhoto?.alt || t('media.amenityPhoto') || 'Amenity Photo'}
              label={amenityPhoto?.title || t('media.amenityPhoto') || 'Amenity Photo'}
              hoverBorderColor="hover:border-emerald-500"
              onClick={() => openDrawer(amenityPhotoCategory ? categories.indexOf(amenityPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, amenityPhoto, t('media.amenityPhoto') || 'Amenity Photo')}
              onMouseLeave={handleImageLeave}
              hasPhoto={amenityPhoto?.hasPhoto}
            />

            {/* Society Photo Card for Amenity Property */}
            {(societyPhotoCategory || societyPhoto?.hasPhoto) && (
              <>
                <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
                <MediaImageCard
                  src={societyPhoto?.src || ''}
                  documentGuid={societyPhoto?.documentGuid}
                  fullSrc={societyPhoto?.fullSrc || ''}
                  alt={societyPhoto?.alt || (t('media.societyPhoto') || 'Society Photo')}
                  label={societyPhoto?.title || (t('media.societyPhoto') || 'Society Photo')}
                  hoverBorderColor="hover:border-blue-500"
                  badgeText={
                    expandedCategory !== 'society' && societyRemainingImages.length > 0
                      ? `+${societyRemainingImages.length} ${t('media.more') || 'More'}`
                      : undefined
                  }
                  onClick={() => openDrawer(societyPhotoCategory ? categories.indexOf(societyPhotoCategory) : 0, 0)}
                  onMouseEnter={(e) => handleCardHover(e, societyPhoto, t('media.societyPhoto') || 'Society Photo')}
                  onMouseLeave={handleImageLeave}
                  hasPhoto={societyPhoto?.hasPhoto}
                >
                  {societyRemainingImages.length > 0 && (
                    <Button
                      variant="edit"
                      size="xs"
                      className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategory((p) => (p === 'society' ? null : 'society'));
                      }}
                      aria-label={expandedCategory === 'society' ? 'Hide more images' : 'View more images'}
                    >
                      {expandedCategory === 'society' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                    </Button>
                  )}
                </MediaImageCard>

                {expandedCategory === 'society' && (
                  <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                    <AdditionalImagesGrid
                      images={societyRemainingImages}
                      onImageClick={(index: number) => {
                        const clickedImg = societyRemainingImages[index];
                        const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                        const targetCategory = categories[catIdx];
                        const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                        openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                      }}
                      onImageHover={handleImageHover}
                      onImageLeave={handleImageLeave}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : isSociety && isWing ? (
          <>
            {/* Society Photo Card */}
            <MediaImageCard
              src={societyPhoto?.src || ''}
              documentGuid={societyPhoto?.documentGuid}
              fullSrc={societyPhoto?.fullSrc || ''}
              alt={societyPhoto?.alt || (t('media.societyPhoto') || 'Society Photo')}
              label={societyPhoto?.title || (t('media.societyPhoto') || 'Society Photo')}
              hoverBorderColor="hover:border-blue-500"
              badgeText={
                expandedCategory !== 'society' && societyRemainingImages.length > 0
                  ? `+${societyRemainingImages.length} ${t('media.more') || 'More'}`
                  : undefined
              }
              onClick={() => openDrawer(societyPhotoCategory ? categories.indexOf(societyPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, societyPhoto, t('media.societyPhoto') || 'Society Photo')}
              onMouseLeave={handleImageLeave}
              hasPhoto={societyPhoto?.hasPhoto}
            >
              {societyRemainingImages.length > 0 && (
                <Button
                  variant="edit"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategory((p) => (p === 'society' ? null : 'society'));
                  }}
                  aria-label={expandedCategory === 'society' ? 'Hide more images' : 'View more images'}
                >
                  {expandedCategory === 'society' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                </Button>
              )}
            </MediaImageCard>

            {expandedCategory === 'society' && (
              <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                <AdditionalImagesGrid
                  images={societyRemainingImages}
                  onImageClick={(index: number) => {
                    const clickedImg = societyRemainingImages[index];
                    const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                    const targetCategory = categories[catIdx];
                    const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                    openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                  }}
                  onImageHover={handleImageHover}
                  onImageLeave={handleImageLeave}
                />
              </div>
            )}

            <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />

            {/* Wing Photo Card */}
            <MediaImageCard
              src={wingPhoto?.src || ''}
              documentGuid={wingPhoto?.documentGuid}
              fullSrc={wingPhoto?.fullSrc || ''}
              alt={effectiveWingPhotoAlt}
              label={effectiveWingPhotoTitle}
              hoverBorderColor="hover:border-blue-500"
              badgeText={
                expandedCategory !== 'wing' && wingRemainingImages.length > 0
                  ? `+${wingRemainingImages.length} ${t('media.more') || 'More'}`
                  : undefined
              }
              onClick={() => openDrawer(wingPhotoCategory ? categories.indexOf(wingPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, wingPhoto, effectiveWingPhotoTitle)}
              onMouseLeave={handleImageLeave}
              hasPhoto={wingPhoto?.hasPhoto}
            >
              {wingRemainingImages.length > 0 && (
                <Button
                  variant="edit"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategory((p) => (p === 'wing' ? null : 'wing'));
                  }}
                  aria-label={expandedCategory === 'wing' ? 'Hide more images' : 'View more images'}
                >
                  {expandedCategory === 'wing' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                </Button>
              )}
            </MediaImageCard>

            {expandedCategory === 'wing' && (
              <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                <AdditionalImagesGrid
                  images={wingRemainingImages}
                  onImageClick={(index: number) => {
                    const clickedImg = wingRemainingImages[index];
                    const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                    const targetCategory = categories[catIdx];
                    const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                    openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                  }}
                  onImageHover={handleImageHover}
                  onImageLeave={handleImageLeave}
                />
              </div>
            )}

            {!isMainProperty && hasPropertySlot && (
              <>
                <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
                {/* Inner Property Photo Card */}
                <MediaImageCard
                  src={propertyPhoto?.src || ''}
                  documentGuid={propertyPhoto?.documentGuid}
                  fullSrc={propertyPhoto?.fullSrc || ''}
                  alt={propertyPhoto?.alt || (t('media.propertyPhoto') || 'Property Photo')}
                  label={propertyPhoto?.title || (t('media.propertyPhoto') || 'Property Photo')}
                  hoverBorderColor="hover:border-blue-500"
                  badgeText={
                    expandedCategory !== 'property' && propertyRemainingImages.length > 0
                      ? `+${propertyRemainingImages.length} ${t('media.more') || 'More'}`
                      : undefined
                  }
                  onClick={() => openDrawer(propertyPhotoCategory ? categories.indexOf(propertyPhotoCategory) : 0, 0)}
                  onMouseEnter={(e) => handleCardHover(e, propertyPhoto, t('media.propertyPhoto') || 'Property Photo')}
                  onMouseLeave={handleImageLeave}
                  hasPhoto={propertyPhoto?.hasPhoto}
                >
                  {propertyRemainingImages.length > 0 && (
                    <Button
                      variant="edit"
                      size="xs"
                      className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategory((p) => (p === 'property' ? null : 'property'));
                      }}
                      aria-label={expandedCategory === 'property' ? 'Hide more images' : 'View more images'}
                    >
                      {expandedCategory === 'property' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                    </Button>
                  )}
                </MediaImageCard>

                {expandedCategory === 'property' && (
                  <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                    <AdditionalImagesGrid
                      images={propertyRemainingImages}
                      onImageClick={(index: number) => {
                        const clickedImg = propertyRemainingImages[index];
                        const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                        const targetCategory = categories[catIdx];
                        const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                        openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                      }}
                      onImageHover={handleImageHover}
                      onImageLeave={handleImageLeave}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : isSociety ? (
          <>
            {/* Society Photo Card */}
            <MediaImageCard
              src={societyPhoto?.src || ''}
              documentGuid={societyPhoto?.documentGuid}
              fullSrc={societyPhoto?.fullSrc || ''}
              alt={societyPhoto?.alt || (t('media.societyPhoto') || 'Society Photo')}
              label={societyPhoto?.title || (t('media.societyPhoto') || 'Society Photo')}
              hoverBorderColor="hover:border-blue-500"
              badgeText={
                expandedCategory !== 'society' && societyRemainingImages.length > 0
                  ? `+${societyRemainingImages.length} ${t('media.more') || 'More'}`
                  : undefined
              }
              onClick={() => openDrawer(societyPhotoCategory ? categories.indexOf(societyPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, societyPhoto, t('media.societyPhoto') || 'Society Photo')}
              onMouseLeave={handleImageLeave}
              hasPhoto={societyPhoto?.hasPhoto}
            >
              {societyRemainingImages.length > 0 && (
                <Button
                  variant="edit"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategory((p) => (p === 'society' ? null : 'society'));
                  }}
                  aria-label={expandedCategory === 'society' ? 'Hide more images' : 'View more images'}
                >
                  {expandedCategory === 'society' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                </Button>
              )}
            </MediaImageCard>

            {expandedCategory === 'society' && (
              <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                <AdditionalImagesGrid
                  images={societyRemainingImages}
                  onImageClick={(index: number) => {
                    const clickedImg = societyRemainingImages[index];
                    const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                    const targetCategory = categories[catIdx];
                    const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                    openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                  }}
                  onImageHover={handleImageHover}
                  onImageLeave={handleImageLeave}
                />
              </div>
            )}
          </>
        ) : isWing ? (
          <>
            {/* Wing Photo Card */}
            <MediaImageCard
              src={wingPhoto?.src || ''}
              documentGuid={wingPhoto?.documentGuid}
              fullSrc={wingPhoto?.fullSrc || ''}
              alt={effectiveWingPhotoAlt}
              label={effectiveWingPhotoTitle}
              hoverBorderColor="hover:border-blue-500"
              badgeText={
                expandedCategory !== 'wing' && wingRemainingImages.length > 0
                  ? `+${wingRemainingImages.length} ${t('media.more') || 'More'}`
                  : undefined
              }
              onClick={() => openDrawer(wingPhotoCategory ? categories.indexOf(wingPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, wingPhoto, effectiveWingPhotoTitle)}
              onMouseLeave={handleImageLeave}
              hasPhoto={wingPhoto?.hasPhoto}
            >
              {wingRemainingImages.length > 0 && (
                <Button
                  variant="edit"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategory((p) => (p === 'wing' ? null : 'wing'));
                  }}
                  aria-label={expandedCategory === 'wing' ? 'Hide more images' : 'View more images'}
                >
                  {expandedCategory === 'wing' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                </Button>
              )}
            </MediaImageCard>

            {expandedCategory === 'wing' && (
              <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                <AdditionalImagesGrid
                  images={wingRemainingImages}
                  onImageClick={(index: number) => {
                    const clickedImg = wingRemainingImages[index];
                    const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                    const targetCategory = categories[catIdx];
                    const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                    openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                  }}
                  onImageHover={handleImageHover}
                  onImageLeave={handleImageLeave}
                />
              </div>
            )}

            {hasPropertySlot && (
              <>
                <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
                {/* Inner Property Photo Card */}
                <MediaImageCard
                  src={propertyPhoto?.src || ''}
                  documentGuid={propertyPhoto?.documentGuid}
                  fullSrc={propertyPhoto?.fullSrc || ''}
                  alt={propertyPhoto?.alt || (t('media.propertyPhoto') || 'Property Photo')}
                  label={propertyPhoto?.title || (t('media.propertyPhoto') || 'Property Photo')}
                  hoverBorderColor="hover:border-blue-500"
                  badgeText={
                    expandedCategory !== 'property' && propertyRemainingImages.length > 0
                      ? `+${propertyRemainingImages.length} ${t('media.more') || 'More'}`
                      : undefined
                  }
                  onClick={() => openDrawer(propertyPhotoCategory ? categories.indexOf(propertyPhotoCategory) : 0, 0)}
                  onMouseEnter={(e) => handleCardHover(e, propertyPhoto, t('media.propertyPhoto') || 'Property Photo')}
                  onMouseLeave={handleImageLeave}
                  hasPhoto={propertyPhoto?.hasPhoto}
                >
                  {propertyRemainingImages.length > 0 && (
                    <Button
                      variant="edit"
                      size="xs"
                      className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategory((p) => (p === 'property' ? null : 'property'));
                      }}
                      aria-label={expandedCategory === 'property' ? 'Hide more images' : 'View more images'}
                    >
                      {expandedCategory === 'property' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                    </Button>
                  )}
                </MediaImageCard>

                {expandedCategory === 'property' && (
                  <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                    <AdditionalImagesGrid
                      images={propertyRemainingImages}
                      onImageClick={(index: number) => {
                        const clickedImg = propertyRemainingImages[index];
                        const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                        const targetCategory = categories[catIdx];
                        const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                        openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                      }}
                      onImageHover={handleImageHover}
                      onImageLeave={handleImageLeave}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Standard Single Photo Card */}
            <MediaImageCard
              src={propertyPhoto?.src || ''}
              documentGuid={propertyPhoto?.documentGuid}
              fullSrc={propertyPhoto?.fullSrc || ''}
              alt={propertyPhoto?.alt || mainCardLabel}
              label={propertyPhoto?.title || mainCardLabel}
              hoverBorderColor="hover:border-blue-500"
              badgeText={
                expandedCategory !== 'property' && propertyRemainingImages.length > 0
                  ? `+${propertyRemainingImages.length} ${t('media.more') || 'More'}`
                  : undefined
              }
              onClick={() => openDrawer(propertyPhotoCategory ? categories.indexOf(propertyPhotoCategory) : 0, 0)}
              onMouseEnter={(e) => handleCardHover(e, propertyPhoto, mainCardLabel)}
              onMouseLeave={handleImageLeave}
              hasPhoto={propertyPhoto?.hasPhoto}
            >
              {propertyRemainingImages.length > 0 && (
                <Button
                  variant="edit"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategory((p) => (p === 'property' ? null : 'property'));
                  }}
                  aria-label={expandedCategory === 'property' ? 'Hide more images' : 'View more images'}
                >
                  {expandedCategory === 'property' ? <X className="w-3.5 h-3.5 cursor-pointer" /> : <Images className="w-3.5 h-3.5 cursor-pointer" />}
                </Button>
              )}
            </MediaImageCard>

            {expandedCategory === 'property' && (
              <div className="col-span-full sm:col-span-3 lg:col-span-1 flex flex-col gap-2">
                <AdditionalImagesGrid
                  images={propertyRemainingImages}
                  onImageClick={(index: number) => {
                    const clickedImg = propertyRemainingImages[index];
                    const catIdx = categories.findIndex((c) => c.photoTypeId === clickedImg.photoTypeId);
                    const targetCategory = categories[catIdx];
                    const imgIdx = targetCategory ? targetCategory.images.findIndex((img) => img.propertyPhotoId === clickedImg.propertyPhotoId) : 0;
                    openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx >= 0 ? imgIdx : 0);
                  }}
                  onImageHover={handleImageHover}
                  onImageLeave={handleImageLeave}
                />
              </div>
            )}
          </>
        )}

        {!isMainProperty && photoPlanCategory && (
          <>
            <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
            <MediaImageCard
              src={photoPlanPhoto?.src || ''}
              documentGuid={photoPlanPhoto?.documentGuid}
              fullSrc={photoPlanPhoto?.fullSrc || ''}
              alt={photoPlanPhoto?.alt || t('media.photoPlan')}
              label={photoPlanPhoto?.title || t('media.photoPlan')}
              hoverBorderColor="hover:border-purple-500"
              onClick={() => {
                const catIdx = photoPlanCategory ? categories.indexOf(photoPlanCategory) : 0;
                const imgIdx = photoPlanCategory?.images && photoPlanCategory.images.length > 0 ? photoPlanCategory.images.length - 1 : 0;
                openDrawer(catIdx >= 0 ? catIdx : 0, imgIdx);
              }}
              onMouseEnter={(e) => handleCardHover(e, photoPlanPhoto, t('media.photoPlan') || 'Photo Plan')}
              onMouseLeave={handleImageLeave}
              hasPhoto={photoPlanPhoto?.hasPhoto}
              badgeText={isSyncingPlan ? (t('media.syncing') || 'Syncing...') : undefined}
            >
              {handleSyncPlan && (
                <Button
                  variant="secondary"
                  size="xs"
                  className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncPlan(e);
                  }}
                  disabled={isSyncingPlan}
                  aria-label={t('media.syncPlan') || 'Sync floor plan from CAD drawing tool'}
                  title={t('media.syncPlan') || 'Sync floor plan from CAD drawing tool'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingPlan ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button
                variant="edit"
                size="xs"
                className="!h-7 !w-7 !p-0 shadow-lg bg-white cursor-pointer"
                onClick={handleCreateClick}
                aria-label="Create or edit plan"
                title="Create or edit plan"
              >
                <Plus className="w-3.5 h-3.5 cursor-pointer" />
              </Button>
            </MediaImageCard>
          </>
        )}

        <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
        <GisMapCard
          image={gisPhoto}
          hasCoords={hasCoords}
          onClick={() => {
            const idx = cdCategory ? categories.indexOf(cdCategory) : -1;
            openDrawer(idx >= 0 ? idx : 0);
          }}
          onMouseEnter={(e) => handleCardHover(e, gisPhoto, t('media.satelliteView') || 'Satellite View')}
          onMouseLeave={handleImageLeave}
        />

        {cdCategory && (
          <>
            <div className="border-t border-slate-300 flex-shrink-0 sm:hidden lg:block" />
            <ChangeDetectionCard
              beforeImageSrc={cdBeforeImg}
              afterImageSrc={cdAfterImg}
              beforeLabel={cdBeforeLabel}
              afterLabel={cdAfterLabel}
              fallbackBeforeSrc={fallbackBeforeUrl}
              fallbackAfterSrc={fallbackAfterUrl}
              onMouseEnter={(e) =>
                handleCardHover(
                  e,
                  {
                    src: cdBeforeImg,
                    fullSrc: cdBeforeImg,
                    alt: t('media.changeDetection') || 'Change Detection',
                    title: t('media.changeDetection') || 'Change Detection',
                    hasPhoto: Boolean(cdBeforeImg || fallbackBeforeUrl),
                  },
                  t('media.changeDetection') || 'Change Detection',
                  cdAfterImg,
                  cdBeforeLabel,
                  cdAfterLabel,
                  fallbackBeforeUrl,
                  fallbackAfterUrl
                )
              }
              onMouseLeave={handleImageLeave}
              onClick={() => {
                const changeDetectionIndex = cdCategory ? categories.indexOf(cdCategory) : -1;
                openDrawer(changeDetectionIndex >= 0 ? changeDetectionIndex : 0);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
