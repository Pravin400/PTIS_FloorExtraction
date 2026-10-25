'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Building2, Image as ImageIcon } from 'lucide-react';
import { Button, SaveButton } from '@/components/common';
import type { ULBLogoImagesTabProps } from '@/types/ulbconfig-master.types';
import { ULBImageCard } from '../parts/ULBImageCard';
import { ULBImageGallery } from '../parts/ULBImageGallery';
import { ULBLogoImagesDrawer } from '../parts/ULBLogoImagesDrawer';

export function ULBLogoImagesTab({
  t,
  logoUrl,
  onLogoChange,
  onSave,
  onPrevious,
  onNext,
  isSaving,
  footerClassName,
  imagesHook,
}: ULBLogoImagesTabProps) {
  const {
    images,
    isUploading,
    deleteImage,
    setAsBackground,
    uploadOrReplaceImage,
  } = imagesHook;

  // Drawer modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'upload' | 'replace'>('upload');
  const [drawerCategory, setDrawerCategory] = useState<'Logo' | 'Background' | 'Gallery'>('Gallery');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceImageId, setReplaceImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync Logo URL with parent form state on mount/change
  useEffect(() => {
    const logoImagesList = images.filter((img) => img.name.toLowerCase() === 'logo');
    const currentLogoExists = logoImagesList.some((img) => img.url === logoUrl);
    if (!logoUrl || !currentLogoExists) {
      const defaultLogo = logoImagesList[0]?.url || null;
      onLogoChange(defaultLogo, true);
    }
  }, [images, logoUrl, onLogoChange]);

  const logoImages = images.filter((img) => img.name.toLowerCase() === 'logo');
  const activeLogoImg = logoImages.find((img) => img.url === logoUrl) || null;
  const unselectedLogos = logoImages.filter((img) => img.url !== logoUrl);
  const backgroundImg = images.find((img) => img.name.toLowerCase() === 'background' || img.isBackgroundImage) || null;
  const unselectedBackgrounds = images.filter((img) => img.name === 'BackgroundLibrary');
  const galleryImages = images.filter(
    (img) =>
      img.name.toLowerCase() !== 'logo' &&
      img.name !== 'Background' &&
      img.name !== 'BackgroundLibrary'
  );

  const handleDrawerSave = async () => {
    await uploadOrReplaceImage(drawerMode, drawerCategory, selectedFile, replaceImageId, logoUrl);
    setDrawerOpen(false);
    setSelectedFile(null);
    setReplaceImageId(null);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex min-h-[420px] gap-4 lg:min-h-[480px]">
          <div className="flex w-[300px] flex-shrink-0 flex-col gap-4">
            <ULBImageCard
              title="ULB Logo"
              imageUrl={activeLogoImg?.url}
              imageId={activeLogoImg ? Number(activeLogoImg.id) : null}
              isUploading={isUploading}
              required
              helpText="Primary Organization Identity"
              icon={Building2}
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
              onTriggerUploadOrReplace={() => {
                setDrawerMode('upload');
                setDrawerCategory('Logo');
                setReplaceImageId(null);
                setSelectedFile(null);
                setDrawerOpen(true);
              }}
              onTriggerDelete={() => {
                if (activeLogoImg) void deleteImage(activeLogoImg.id, 'Logo');
              }}
            />

            <ULBImageCard
              title="Background Image"
              imageUrl={backgroundImg?.url}
              imageId={backgroundImg ? Number(backgroundImg.id) : null}
              isUploading={isUploading}
              helpText="Default Portal Wallpaper"
              icon={ImageIcon}
              iconBgColor="bg-amber-50"
              iconTextColor="text-amber-600"
              isLandscape={true}
              onTriggerUploadOrReplace={() => {
                setDrawerMode('upload');
                setDrawerCategory('Background');
                setReplaceImageId(null);
                setSelectedFile(null);
                setDrawerOpen(true);
              }}
              onTriggerDelete={() => {
                if (backgroundImg) void deleteImage(backgroundImg.id, 'Background');
              }}
            />
          </div>

          <ULBImageGallery
            images={galleryImages}
            unselectedLogos={unselectedLogos}
            unselectedBackgrounds={unselectedBackgrounds}
            isLoading={false}
            isUploading={isUploading}
            onTriggerUpload={() => {
              setDrawerMode('upload');
              setDrawerCategory('Logo');
              setReplaceImageId(null);
              setSelectedFile(null);
              setDrawerOpen(true);
            }}
            onTriggerReplace={(id) => {
              setDrawerMode('replace');
              setDrawerCategory('Gallery');
              setReplaceImageId(id);
              setSelectedFile(null);
              setDrawerOpen(true);
            }}
            onSetAsBackground={setAsBackground}
            onDeleteImage={(id) => void deleteImage(id, 'Gallery')}
            onLogoChange={onLogoChange}
            onDeleteLogoOrBackground={(id, category) => void deleteImage(id, category)}
          />
        </div>
      </div>

      <div className={`${footerClassName} justify-end`}>
        <Button
          onClick={onPrevious}
          icon={ChevronLeft}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-700 bg-blue-700 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
        >
          {t('buttons.previous')}
        </Button>
        <SaveButton label={t('buttons.save')} onClick={onSave} disabled={isSaving} className="h-11 rounded-xl px-6" />
        <Button
          onClick={onNext}
          disabled={isSaving}
          icon={ChevronRight}
          iconPosition="right"
          className="inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-blue-700 px-8 font-black text-white hover:bg-blue-800"
        >
          {t('buttons.next')}
        </Button>
      </div>

      <ULBLogoImagesDrawer
        drawerOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedFile(null);
          setReplaceImageId(null);
        }}
        drawerMode={drawerMode}
        drawerCategory={drawerCategory}
        setDrawerCategory={setDrawerCategory}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        fileInputRef={fileInputRef}
        isUploading={isUploading}
        handleDrawerSave={handleDrawerSave}
      />
    </>
  );
}
