'use client';

import React from 'react';
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { FlipState } from './canvasUtils';

export type AspectType = 'original' | 'free' | '1:1' | '4:3' | '16:9';

interface ImageEditorControlsProps {
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  flip: FlipState;
  setFlip: React.Dispatch<React.SetStateAction<FlipState>>;
  aspectType: AspectType;
  setAspectType: (value: AspectType) => void;
  isSaving: boolean;
  onCancel: () => void;
  handleSave: () => Promise<void>;
}

export function ImageEditorControls({
  setRotation,
  flip,
  setFlip,
  aspectType,
  setAspectType,
  isSaving,
  onCancel,
  handleSave,
}: ImageEditorControlsProps) {
  const t = useTranslations('ptis');

  const ASPECT_RATIOS: { label: string; value: AspectType }[] = [
    { label: 'Original', value: 'original' },
    { label: 'Free', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' },
  ];

  return (
    <div className="bg-white border-t border-slate-200 p-4 sm:p-6 space-y-4 text-sm flex-shrink-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Rotation & Flip Group */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
            <Button
              size="xs"
              variant="ghost"
              icon={RotateCcw}
              onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
              className="cursor-pointer active:scale-95 hover:!bg-white !text-slate-600 !h-8 !px-2.5"
              title={t('media.rotateLeft') || 'Rotate Left'}
            >
              <span className="text-xs font-medium hidden sm:inline">
                {t('media.rotateLeft') || 'Rotate Left'}
              </span>
            </Button>

            <div className="w-px h-5 bg-slate-200" />

            <Button
              size="xs"
              variant="ghost"
              icon={RotateCw}
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="cursor-pointer active:scale-95 hover:!bg-white !text-slate-600 !h-8 !px-2.5"
              title={t('media.rotateRight') || 'Rotate Right'}
            >
              <span className="text-xs font-medium hidden sm:inline">
                {t('media.rotateRight') || 'Rotate Right'}
              </span>
            </Button>

            <div className="w-px h-5 bg-slate-200" />

            <Button
              size="xs"
              variant={flip.horizontal ? 'secondary' : 'ghost'}
              icon={FlipHorizontal}
              onClick={() => setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }))}
              className={`cursor-pointer active:scale-95 hover:!bg-white !h-8 !w-8 !p-0 !border-0 ${
                flip.horizontal ? '!bg-white !text-blue-600 font-semibold shadow-sm' : '!text-slate-500'
              }`}
              title={t('media.flipHorizontal') || 'Flip Horizontal'}
            />

            <Button
              size="xs"
              variant={flip.vertical ? 'secondary' : 'ghost'}
              icon={FlipVertical}
              onClick={() => setFlip((prev) => ({ ...prev, vertical: !prev.vertical }))}
              className={`cursor-pointer active:scale-95 hover:!bg-white !h-8 !w-8 !p-0 !border-0 ${
                flip.vertical ? '!bg-white !text-blue-600 font-semibold shadow-sm' : '!text-slate-500'
              }`}
              title={t('media.flipVertical') || 'Flip Vertical'}
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5 overflow-x-auto max-w-[280px] sm:max-w-none">
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio.label}
                size="xs"
                variant={aspectType === ratio.value ? 'secondary' : 'ghost'}
                onClick={() => setAspectType(ratio.value)}
                className={`cursor-pointer active:scale-95 hover:!bg-white !h-7 !border-0 ${
                  aspectType === ratio.value
                    ? '!bg-white !text-blue-600 font-semibold shadow-sm'
                    : '!text-slate-500 hover:!text-slate-700'
                }`}
              >
                {ratio.label === 'Original'
                  ? t('media.aspectOriginal') || 'Original'
                  : ratio.label === 'Free'
                  ? t('media.aspectFree') || 'Free'
                  : ratio.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            icon={X}
            className="cursor-pointer hover:!bg-slate-50 transition-all hover:scale-105 active:scale-95"
          >
            {t('actions.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            icon={Save}
            isLoading={isSaving}
            className="!bg-blue-600 hover:!bg-blue-700 text-white font-medium cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            {t('actions.save') || 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
