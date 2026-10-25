'use client';
import Image from 'next/image';
import type { AssetPhotoPlanSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React from 'react';
import { SectionCard } from './SectionCard';
import { Map } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/common';

// TODO: Do NOT delete this import, it will be added back in the future.
// import { PhotoPlanDrawer } from '../municipal-Asset/NewAddNewAsset/basic-info/media/PhotoPlanDrawer';
// import type { PhotoCategory } from '@/types/asset/media.types';

// TEMPORARY: Revert this when add new asset module is merged
type PhotoCategory = {
  photoTypeId: number;
  photoTypeCode: string;
  photoTypeName: string;
  images: {
    src: string;
    fullSrc: string;
    alt: string;
    title: string;
  }[];
  isCustom: boolean;
  hasPhoto: boolean;
  photoCount: number;
};

export function AssetPhotoPlanSection({ data, copy }: AssetPhotoPlanSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  // const [/* isDrawerOpen */, setIsDrawerOpen] = useState(false);
  // const [/* clickedCategoryId */, setClickedCategoryId] = useState<string | null>(null);

  // Group ALL photos so the drawer has access to everything
  const groupedPhotos = data?.photos?.reduce((acc, photo) => {
    const typeId = photo.photoTypeId || 1;
    const typeName = photo.photoTypeName || 'Asset Photos';

    if (!acc[typeId]) {
      acc[typeId] = {
        photoTypeId: typeId,
        photoTypeCode: `TYPE_${typeId}`,
        photoTypeName: typeName,
        images: [],
        isCustom: true,
        hasPhoto: true,
        photoCount: 0
      };
    }
    acc[typeId]!.images.push({
      src: photo.url,
      fullSrc: photo.url,
      alt: photo.alt,
      title: photo.alt,
    });
    acc[typeId]!.photoCount = (acc[typeId]!.photoCount || 0) + 1;
    return acc;
  }, {} as Record<number, PhotoCategory>) || {};

  let allCategories: PhotoCategory[] = Object.values(groupedPhotos);

  if (allCategories.length === 0) {
    allCategories = [
      {
        photoTypeId: 1,
        photoTypeCode: 'ASSET_PHOTOS',
        photoTypeName: 'Asset Photos',
        images: [],
        isCustom: true,
        hasPhoto: false,
        photoCount: 0
      }
    ];
  }

  // Filter ONLY plan categories for the display cards
  const planCategories = allCategories.filter(c => c.photoTypeName?.toLowerCase().includes('plan'));

  // Extract the first image of each category to show on the card
  const plansToShow = planCategories.map(c => ({
    id: c.photoTypeCode,
    label: c.photoTypeName,
    title: c.images[0]?.title || c.photoTypeName,
    imgSrc: c.images[0]?.src
  })).filter(p => p.imgSrc); // only show if there is actually an image

  // let startIndex = 0;
  // if (clickedCategoryId) {
  //   const idx = allCategories.findIndex(c => c.photoTypeCode === clickedCategoryId);
  //   if (idx >= 0) startIndex = idx;
  // } else {
  //   const fallbackIdx = allCategories.findIndex(c => c.photoTypeName?.toLowerCase().includes('plan'));
  //   if (fallbackIdx >= 0) startIndex = fallbackIdx;
  // }

  return (
    <>
      <SectionCard
        title={copy?.assetPhotoPlan || t('assetPhotoPlan') || 'Asset Photo Plan & DP Plan'}
        titleIcon={<Map className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-purple-500"
        headerRight={
          plansToShow.length > 0 ? (
            <Button
              variant="secondary"
              className="!text-[9px] !font-bold !text-blue-600 !border-blue-200 !bg-white !rounded-full !px-2 !h-4 flex items-center hover:!bg-blue-50 transition-colors"
              aria-label={copy?.viewFullPlan || t('viewFullPlan')}
            // onClick={() => {
            //   setClickedCategoryId(null);
            //   setIsDrawerOpen(true);
            // }}
            >
              {copy?.viewFullPlan || t('viewFullPlan')}
            </Button>
          ) : undefined
        }
      >
        {plansToShow.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-slate-400">
            <Map className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-[10px] font-medium">{t('noPlansAvailable')}</span>
          </div>
        ) : (
          <div className={cn("grid gap-2", plansToShow.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {/* Plans Grid */}
            {plansToShow.map((plan) => {
              // Try to localize the plan label if it matches common keys
              let localizedLabel = plan.label;
              if (localizedLabel.toLowerCase() === 'asset photo plan' && t('assetPhotoPlan')) {
                localizedLabel = t('assetPhotoPlan');
              } else if (localizedLabel.toLowerCase() === 'asset photos' && t('assetPhotos')) {
                localizedLabel = t('assetPhotos');
              }

              return (
                <Button
                  key={plan.id}
                  type="button"
                  variant="ghost"
                  className="w-full h-40 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group p-0"
                  aria-label={`View ${localizedLabel}`}
                  title={localizedLabel}
                >
                  {/* Title */}
                  <div className="absolute top-2 left-0 right-0 text-center px-1 z-10 drop-shadow-md bg-white/70 backdrop-blur-sm mx-2 rounded py-0.5 border border-white/50 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-wider line-clamp-1">
                      {localizedLabel.toUpperCase()}
                    </span>
                  </div>

                  {/* presentation image */}
                  <Image unoptimized
                    src={plan.imgSrc || ""}
                    alt={localizedLabel}
                    fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity bg-white"
                  />
                </Button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* TODO: Do NOT delete this component usage, it will be added back in the future. */}
      {/* {isDrawerOpen && (
        <PhotoPlanDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          categories={allCategories}
          initialCategoryIndex={startIndex}
          readOnly={true}
        />
      )} */}
    </>
  );
}

