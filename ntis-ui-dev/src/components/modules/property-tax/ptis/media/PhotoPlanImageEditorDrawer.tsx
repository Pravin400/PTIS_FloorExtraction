'use client';

import { Crop } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/common';
import { ImageEditor } from './ImageEditor';

interface PhotoPlanImageEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  imageSrc?: string;
  imageTitle?: string;
  onSave: (file: File) => Promise<boolean>;
}

export function PhotoPlanImageEditorDrawer({
  open,
  onClose,
  imageSrc,
  imageTitle,
  onSave,
}: PhotoPlanImageEditorDrawerProps) {
  const t = useTranslations('ptis');

  return (
    <>
      {open && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .drawer-instance:has(.image-editor-drawer-content-wrapper) {
              width: 50% !important;
              max-width: 50vw !important;
            }
            .drawer-instance:has(.image-editor-drawer-content-wrapper) .overflow-y-auto {
              overflow: hidden !important;
            }
            body:has(.image-editor-drawer-content-wrapper) div:has(+ .drawer-instance) {
              background-color: transparent !important;
              backdrop-filter: none !important;
            }
          `
        }} />
      )}
      <Drawer
        open={open}
        onClose={onClose}
        width="xl"
        zIndex={160}
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {t('media.editImage') || 'Edit Image'}
              </h2>
              <p className="text-xs text-slate-400 font-normal">
                {imageTitle}
              </p>
            </div>
          </div>
        }
      >
        <div className="image-editor-drawer-content-wrapper min-h-full">
          {open && imageSrc && imageTitle && (
            <ImageEditor
              imageSrc={imageSrc}
              imageTitle={imageTitle}
              onSave={onSave}
              onCancel={onClose}
            />
          )}
        </div>
      </Drawer>
    </>
  );
}
