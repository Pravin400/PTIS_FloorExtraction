'use client';

import type { RefObject } from 'react';
import { Upload } from 'lucide-react';
import { Button, Drawer } from '@/components/common';
import { useTranslations } from 'next-intl';

interface ULBLogoImagesDrawerProps {
  drawerOpen: boolean;
  onClose: () => void;
  drawerMode: 'upload' | 'replace';
  drawerCategory: 'Logo' | 'Background' | 'Gallery';
  setDrawerCategory: (cat: 'Logo' | 'Background' | 'Gallery') => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  handleDrawerSave: () => void;
}

export function ULBLogoImagesDrawer({
  drawerOpen,
  onClose,
  drawerMode,
  drawerCategory,
  setDrawerCategory,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  isUploading,
  handleDrawerSave,
}: ULBLogoImagesDrawerProps) {
  const t = useTranslations('ulb_configuration');

  const titleText = drawerMode === 'replace' ? t('messages.replacingImage') : t('buttons.addImages');
  const saveText = isUploading ? t('messages.saving') : t('messages.saveImage');

  return (
    <Drawer
      open={drawerOpen}
      onClose={onClose}
      title={<span className="text-base font-bold text-slate-800">{titleText}</span>}
      width="md"
      footer={
        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
          <Button variant="secondary" disabled={isUploading} onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={isUploading || (drawerMode === 'upload' && !selectedFile)}
            onClick={handleDrawerSave}
          >
            {saveText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        {/* File Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">{t('messages.selectImageFile')}</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors"
          >
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              {selectedFile ? selectedFile.name : t('messages.clickToSelect')}
            </p>
            <p className="mt-1 text-xs text-slate-400">{t('messages.imageFormatHint')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelectedFile(file);
            }}
          />
        </div>

        {/* Section Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">{t('messages.categoryTarget')}</label>
          <select
            value={drawerCategory}
            onChange={(e) => setDrawerCategory(e.target.value as 'Logo' | 'Background' | 'Gallery')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
          >
            <option value="Logo" className="bg-white text-slate-900">
              {t('messages.ulbLogoSection')}
            </option>
            <option value="Background" className="bg-white text-slate-900">
              {t('messages.backgroundImageSection')}
            </option>
          </select>
          <p className="text-[10px] text-slate-400">{t('messages.categoryHint')}</p>
        </div>
      </div>
    </Drawer>
  );
}
