'use client';

/**
 * Edit Evidence Card (Presentation Component)
 * Path: src/components/modules/grievance/citizen/edit/EditEvidenceCard.tsx
 * Line ceiling: <= 300 lines.
 */

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Loader2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, ConfirmDialog } from '@/components/common';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { getGrievancePhotoViewUrl } from '@/lib/utils/grievance';

interface EditEvidenceCardProps {
  existingPhotos: GrievancePhotoItem[];
  localImages: string[];
  isLoadingPhotos?: boolean;
  deletingPhotoId?: number | null;
  onUploadClick: () => void;
  onCameraClick: () => void;
  onDeleteExistingPhoto: (photoId: number) => Promise<void> | void;
  onRemoveLocalImage: (index: number) => void;
}

export function EditEvidenceCard({
  existingPhotos,
  localImages,
  isLoadingPhotos = false,
  deletingPhotoId = null,
  onUploadClick,
  onCameraClick,
  onDeleteExistingPhoto,
  onRemoveLocalImage,
}: EditEvidenceCardProps) {
  const t = useTranslations('grievance');
  const [pendingDelete, setPendingDelete] = useState<{ type: 'db' | 'local'; idOrIndex: number } | null>(null);
  const totalCount = existingPhotos.length + localImages.length;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'db') {
      await onDeleteExistingPhoto(pendingDelete.idOrIndex);
    } else {
      onRemoveLocalImage(pendingDelete.idOrIndex);
    }
    setPendingDelete(null);
  };

  return (
    <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
      {/* 1. Header with Title & Count */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-800">
        <span className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          {t('evidencePhotos')}
        </span>
        {totalCount > 0 && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {t('photosCountBadge', { count: `${totalCount}/5` })}
          </span>
        )}
      </div>

      {/* 2. Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onUploadClick}
          icon={Upload}
          className="h-8 w-full bg-white hover:bg-slate-100 border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs cursor-pointer active:scale-95 transition-all"
        >
          {t('uploadPhoto')}
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onCameraClick}
          icon={Camera}
          className="h-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer active:scale-95 transition-all"
        >
          {t('cameraPwa')}
        </Button>
      </div>

      {/* 3. Tip Notice */}
      <div className="flex items-start gap-1.5 text-[9px] text-slate-500 font-medium px-0.5">
        <Info className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
        <span>{t('gpsPhotoTip')}</span>
      </div>

      {/* 4. Thumbnails Strip */}
      {(totalCount > 0 || isLoadingPhotos) && (
        <div className="flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
          {isLoadingPhotos && (
            <div className="w-11 h-11 rounded-xl border border-dashed border-slate-300 flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            </div>
          )}

          {/* Database Photos */}
          {existingPhotos.map((photo) => (
            <div key={`db-${photo.id}`} className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 group">
              <Image src={getGrievancePhotoViewUrl(photo.id)} alt={t('evidenceLabel')} fill unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => setPendingDelete({ type: 'db', idOrIndex: photo.id })}
                disabled={deletingPhotoId === photo.id}
                className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                title={t('removeImage')}
              >
                {deletingPhotoId === photo.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
              </button>
            </div>
          ))}

          {/* Newly Attached Local Photos */}
          {localImages.map((url, idx) => (
            <div key={`local-${idx}`} className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-blue-400 shadow-2xs shrink-0 group">
              <Image src={url} alt={t('evidenceLabel')} fill unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => setPendingDelete({ type: 'local', idOrIndex: idx })}
                className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                title={t('removeImage')}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modern Compact Confirmation Dialog */}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="delete"
        size="sm"
        title={t('deletePhotoTitle')}
        description={t('deletePhotoWarning')}
        confirmText={t('deletePhotoAction')}
        cancelText={t('cancel')}
        isLoading={deletingPhotoId !== null && pendingDelete?.type === 'db'}
      />
    </div>
  );
}
