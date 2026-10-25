'use client';
import Image from 'next/image';
import type { AssetPhotosSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React from 'react';
import { SectionCard } from './SectionCard';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/common';

// TODO: Do NOT delete this import, it will be added back in the future.
// import { PhotoPlanDrawer } from '../municipal-Asset/NewAddNewAsset/basic-info/media/PhotoPlanDrawer';
// import type { PhotoCategory } from '@/types/asset/media.types';
// TEMPORARY: Revert this when add new asset module is merged
// type PhotoCategory = { photoTypeId: number; photoTypeCode: string; photoTypeName: string; images: { src: string; fullSrc: string; alt: string; title: string; }[]; isCustom: boolean; hasPhoto: boolean; photoCount: number; };

export function AssetPhotosSection({ data, copy }: AssetPhotosSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  // const [, setIsDrawerOpen] = useState(false);

  const displayPhotos = data.photos.filter(p => {
    const name = p.photoTypeName?.toLowerCase() || '';
    return !name.includes('plan');
  });

  const mainPhoto = displayPhotos[0] || data.photos[0];
  const fallbackPhoto = mainPhoto;

  const thumbPhotos = [];
  for (let i = 1; i <= 4; i++) {
    if (displayPhotos[i]) {
      thumbPhotos.push(displayPhotos[i]);
    } else {
      thumbPhotos.push({ ...fallbackPhoto, id: `fallback-${i}` });
    }
  }

  const extraCount = displayPhotos.length - 5;

  /* TODO: Uncomment when PhotoPlanDrawer is added back
  // Group photos by photoTypeId and photoTypeName
  const groupedPhotos = data.photos.reduce((acc, photo) => {
    const typeId = photo.photoTypeId || 1;
    const typeName = photo.photoTypeName || 'Asset Photos';
    
    let category = acc[typeId];
    if (!category) {
      category = {
        photoTypeId: typeId,
        photoTypeCode: `TYPE_${typeId}`,
        photoTypeName: typeName,
        images: [],
        isCustom: true,
        hasPhoto: true,
        photoCount: 0
      };
      acc[typeId] = category;
    }
    
    category.images.push({
      src: photo.url,
      fullSrc: photo.url,
      alt: photo.alt,
      title: photo.alt,
    });
    category.photoCount = (category.photoCount || 0) + 1;
    
    return acc;
  }, {} as Record<number, PhotoCategory>);

  const categories: PhotoCategory[] = Object.values(groupedPhotos);

  // If no categories were created (empty photos), provide a default
  if (categories.length === 0) {
    categories.push({
      photoTypeId: 1,
      photoTypeCode: 'ASSET_PHOTOS',
      photoTypeName: 'Asset Photos',
      images: [],
      isCustom: true,
      hasPhoto: false,
      photoCount: 0
    });
  }
  */

  return (
    <>
      <SectionCard
        title={copy?.assetPhotos || t('assetPhotos')}
        titleIcon={<Camera className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-purple-500"
        headerRight={
          <Button
            variant="secondary"
            className="!text-[9px] !font-bold !text-blue-600 !border-blue-200 !bg-white !rounded-full !px-2 !h-4 flex items-center hover:!bg-blue-50 transition-colors"
            // onClick={() => setIsDrawerOpen(true)}
            aria-label={copy?.viewAll || t('viewAll')}
          >
            {copy?.viewAll || t('viewAll')}
          </Button>
        }
      >
        {data.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-slate-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-[10px] font-medium">{t('noPhotosAvailable')}</span>
          </div>
        ) : (
          <>
            {/* Main photo */}
            <Button
              variant="ghost"
              className={cn(
                '!w-full !h-28 !rounded-lg !mb-2 !flex !items-center !justify-center !border !border-slate-100 !cursor-pointer hover:!opacity-90 !transition-opacity !relative !overflow-hidden !p-0 !shadow-none hover:!bg-transparent text-slate-400',
                mainPhoto?.bgColor ? `!${mainPhoto.bgColor.replace('bg-', 'bg-')}` : '!bg-slate-100', // Ensure ! is applied
              )}
              // onClick={() => setIsDrawerOpen(true)}
              aria-label={mainPhoto?.alt ?? 'Main photo'}
            >
              {mainPhoto?.url ? (
                <Image unoptimized
                  src={mainPhoto.url}
                  alt={mainPhoto.alt ?? 'Main photo'}
                  fill className="object-cover bg-white"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </Button>

            {/* Thumbnails row */}
            <div className="flex gap-1.5">
              {thumbPhotos.map((photo, i) => {
                const isLast = i === 3;
                const showExtra = isLast && extraCount > 0;

                return (
                  <Button
                    variant="ghost"
                    key={photo.id || i}
                    className={cn(
                      '!flex-1 !h-14 !rounded-md !border !border-slate-100 !flex !items-center !justify-center !cursor-pointer hover:!opacity-90 !transition-opacity !relative !overflow-hidden !p-0 !shadow-none hover:!bg-transparent text-slate-400 !min-w-0',
                      photo.bgColor ? `!${photo.bgColor}` : '',
                    )}
                    // onClick={() => setIsDrawerOpen(true)}
                    aria-label={photo.alt}
                  >
                    {photo.url ? (
                      <Image unoptimized src={photo.url} alt={photo.alt} fill className="object-cover bg-white" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300 z-0 relative" />
                    )}
                    {showExtra && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="text-white text-[13px] font-black">+{extraCount}</span>
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </>
        )}
      </SectionCard>

      {/* TODO: Do NOT delete this component usage, it will be added back in the future. */}
      {/* {isDrawerOpen && (
        <PhotoPlanDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          categories={categories}
          initialCategoryIndex={0}
          readOnly={true}
        />
      )} */}
    </>
  );
}

