'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { UploadCloud, FileImage, X, Loader2 } from 'lucide-react';
import { Input, Button, Select, Drawer } from '@/components/common';
import { photoPlanNamingSchema, validatePhotoFile } from '@/lib/validation/ptis/photo-plan-validation';
import { UploadInstructions } from './UploadInstructions';
import { PhotoPlanImageEditorDrawer } from './PhotoPlanImageEditorDrawer';

const _FALLBACKS: Record<string, string> = {
  'media.invalidDisplayOrder': 'Display order must be a positive integer',
  'media.photoTypeIdRequired': 'Valid Photo Type ID is required',
  'media.fileRequired': 'Photo file is required',
  'media.allowedFormats': 'Only JPEG, JPG, and PNG images are allowed',
  'media.maxFileSize': 'File size should not exceed 5 MB',
  'media.invalidImage': 'Please upload a valid image file',
  'media.nameTooLong': 'Slot name must not exceed 250 characters',
  'media.invalidNameFormat': 'Slot name contains invalid characters',
  'media.nameRequired': 'Photo plan name is required',
};

interface PhotoPlanNamingModalProps {
  open: boolean; onClose: () => void;
  onSubmit: (name: string, displayOrder: number, photoTypeId: number, file?: File, remarks?: string) => void;
  availableTypes: { label: string; value: string }[];
  defaultDisplayOrder: number; defaultName?: string; isReplacement?: boolean;
  defaultPhotoTypeId?: number; isEdit?: boolean; defaultRemarks?: string; isLoading?: boolean;
  photoTypeCode?: string;
}

export function PhotoPlanNamingModal({
  open, onClose, onSubmit, availableTypes, defaultDisplayOrder,
  defaultName = '', isReplacement = false, defaultPhotoTypeId,
  isEdit = false, defaultRemarks = '', isLoading = false,
  photoTypeCode: _photoTypeCode = '',
}: PhotoPlanNamingModalProps): React.ReactElement {
  const t = useTranslations('ptis');
  const [name, setName] = useState(defaultName);
  const displayOrder = String(defaultDisplayOrder);
  const [photoTypeId, setPhotoTypeId] = useState(defaultPhotoTypeId ? String(defaultPhotoTypeId) : '');
  const [remarks, setRemarks] = useState(defaultRemarks);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editImageSrc, setEditImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading);
  const [uploadProgress, setUploadProgress] = useState(() => (isLoading ? 8 : 0));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageCorrupted, setIsImageCorrupted] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const isMounted = useRef(true);

  if (prevIsLoading !== isLoading) {
    setPrevIsLoading(isLoading);
    setUploadProgress(isLoading ? 8 : 0);
  }

  const filePreviewUrl = useMemo(() => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 94) return prev;
        const inc = Math.floor(Math.random() * 12) + 6;
        return Math.min(prev + inc, 94);
      });
    }, 180);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleTypeChange = (value: string) => {
    setPhotoTypeId(value);
    setErrors(({ photoTypeId: _, ...next }) => next);
    const selectedType = availableTypes.find((t) => t.value === value);
    if (selectedType && (!name || availableTypes.some((t) => t.label === name) || name === 'Custom Photo Plan')) setName(selectedType.label);
  };

  const getMsg = (key: string) => {
    const msg = t(key as Parameters<typeof t>[0]);
    return msg === key ? (_FALLBACKS[key] || key) : msg;
  };

  const updateSelectedFileWithValidation = (file: File | null) => {
    setSelectedFile(file);
    setIsImageCorrupted(false);
    const fileErrKey = validatePhotoFile(file);
    if (fileErrKey && (!isEdit || file)) {
      setErrors((prev) => ({ ...prev, file: getMsg(fileErrKey) }));
      return;
    }

    if (file) {
      setIsValidatingImage(true);
      setErrors(({ file: _, ...next }) => next);
      
      const url = URL.createObjectURL(file);
      const img = typeof window !== 'undefined' ? new window.Image() : null;
      if (!img) return;
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (!isMounted.current) return;
        setIsValidatingImage(false);
        setIsImageCorrupted(false);
        setErrors(({ file: _, ...next }) => next);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (!isMounted.current) return;
        setIsValidatingImage(false);
        setIsImageCorrupted(true);
        setErrors((prev) => ({ ...prev, file: getMsg('media.invalidImage') || 'Please upload a valid image file' }));
      };
      img.src = url;
    } else {
      setErrors(({ file: _, ...next }) => next);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      updateSelectedFileWithValidation(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateSelectedFileWithValidation(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const orderNum = Number(displayOrder);
    const validationResult = photoPlanNamingSchema.safeParse({
      name, displayOrder: isNaN(orderNum) ? undefined : orderNum,
      remarks: remarks || undefined, photoTypeId: photoTypeId ? Number(photoTypeId) : undefined,
    });
    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        const path = err.path[0];
        if (typeof path === 'string') newErrors[path] = getMsg(err.message);
      });
    }
    if (!isEdit || selectedFile) {
      const fileErrorKey = validatePhotoFile(selectedFile);
      if (fileErrorKey) {
        newErrors.file = getMsg(fileErrorKey);
      } else if (isImageCorrupted) {
        newErrors.file = getMsg('media.invalidImage') || 'Please upload a valid image file';
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(name.trim(), orderNum, Number(photoTypeId || '0'), selectedFile || undefined, remarks.trim());
  };

  const fileValidationErrKey = selectedFile ? validatePhotoFile(selectedFile) : null;
  const isFileRequiredMissing = !isEdit && !selectedFile;
  const isFileInvalid = isFileRequiredMissing || !!fileValidationErrKey || isImageCorrupted;
  const isSaveDisabled = isLoading || isValidatingImage || !name.trim() || !displayOrder.trim() || (!isEdit && !photoTypeId) || isFileInvalid || Object.keys(errors).length > 0;
  const selectedPhotoTypeName = availableTypes.find((t) => String(t.value) === String(photoTypeId))?.label || defaultName || t('media.slot') || 'Photo Slot';
  const isPlanSlot = Boolean(
    _photoTypeCode?.toUpperCase().includes('PLAN') ||
    selectedPhotoTypeName?.toLowerCase().includes('plan') ||
    defaultName?.toLowerCase().includes('plan')
  );
  const titleStr = isEdit
    ? (t('media.editPhotoDetails') || 'Edit Photo Details')
    : isReplacement
      ? isPlanSlot
        ? (t('media.replacePlan') || 'Replace Plan')
        : (t('media.replaceImageTitle') || 'Replace Image')
      : isPlanSlot
        ? (t('media.uploadPlan') || 'Upload Plan')
        : (t('media.addPhotoFor', { name: selectedPhotoTypeName }) || `Add Photo for ${selectedPhotoTypeName}`);
  const subtitleStr = isEdit
    ? (t('media.editPhotoSubtitle') || 'Update the display name, display order and remarks.')
    : isReplacement && isPlanSlot
      ? (t('media.replacePlanDescription') || 'Uploading a new plan image will replace the existing property plan.')
      : undefined;

  const handleEditorSave = async (file: File) => (setSelectedFile(file), true);
  const handleEditorClose = () => { if (editImageSrc) URL.revokeObjectURL(editImageSrc); setEditImageSrc(null); };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width="sm"
        zIndex={150}
        title={<div className="flex flex-col"><h2 className="text-base font-semibold text-slate-800">{titleStr}</h2>{subtitleStr && <p className="text-xs text-slate-400 font-normal mt-0.5">{subtitleStr}</p>}</div>}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading} className="cursor-pointer hover:!bg-slate-100 hover:!text-slate-900 transition-all hover:scale-105 active:scale-95 duration-200">{t('actions.cancel') || 'Cancel'}</Button>
            <Button variant="primary" onClick={handleSubmit} type="button" disabled={isSaveDisabled} className="!bg-blue-600 hover:!bg-blue-700 !text-white font-medium px-4 py-2 rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading
                ? (t('media.saving') || 'Saving...')
                : isReplacement
                  ? isPlanSlot
                    ? (t('media.replacePlanConfirm') || 'Replace Plan')
                    : (t('media.replaceImage') || 'Replace Image')
                  : (t('actions.save') || 'Save')}
            </Button>
          </div>
        }
      >
        <form onSubmit={isLoading ? undefined : handleSubmit} className="space-y-4 p-5 photo-plan-naming-modal-content">
          {!isReplacement && !isEdit ? (
            <Select
              label={t('media.photoTypeSlot') || 'Photo Type Slot'} options={availableTypes}
              value={photoTypeId} onChange={(_, val) => handleTypeChange(val)}
              placeholder={t('media.photoTypePlaceholder') || 'Select target slot...'}
              error={errors.photoTypeId} disabled={true} required
            />
          ) : (
            <Input
              label={t('media.photoTypeSlot') || 'Photo Type Slot'} fullWidth disabled
              value={availableTypes.find((t) => t.value === photoTypeId)?.label || defaultName || t('media.standardSlot') || 'Standard Slot'}
            />
          )}
          <Input
            label={t('media.photoPlanName') || 'Photo Plan Name'}
            placeholder={t('media.photoPlanNamePlaceholder') || 'e.g. Front Elevation, Terrace View'}
            value={name} error={errors.name} disabled={isReplacement || isLoading} required fullWidth autoFocus={!isReplacement && !isEdit}
            maxLength={250}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => {
                const { name: _, ...next } = prev;
                return next;
              });
            }}
          />
          <input type="hidden" value={displayOrder} />
          <Input
            label={t('media.remarks') || 'Remarks'}
            placeholder={t('media.remarksPlaceholder') || 'Enter any remarks...'}
            value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isLoading} fullWidth
          />
          {!isEdit && (
            <>
              <UploadInstructions />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t('media.photoFile') || 'Photo File'} <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100/50 scale-[1.01]'
                      : errors.file || fileValidationErrKey
                      ? 'border-red-400 bg-red-50/40 hover:border-red-500 ring-2 ring-red-100'
                      : selectedFile
                      ? 'border-blue-300 bg-slate-50/70 hover:border-blue-400'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/30'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isLoading}
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  {isLoading ? (
                    <div className="w-full flex flex-col justify-center py-1.5 px-1 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-xs font-semibold text-slate-800">
                            {uploadProgress < 75
                              ? (t('media.uploadingAndSaving') || 'Uploading image...')
                              : (t('media.saving') || 'Saving photo record...')}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-blue-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>

                      {selectedFile && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="truncate max-w-[220px] text-slate-700">{selectedFile.name}</span>
                          <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  ) : !selectedFile ? (
                    <div className="flex flex-col items-center text-center py-2">
                      <div className={`p-2.5 rounded-full mb-2 transition-transform duration-200 group-hover:scale-110 ${isDragging ? 'bg-blue-200/80 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        <span className="text-blue-600 hover:underline">
                          {t('media.chooseFile') || 'Choose a file'}
                        </span>{' '}
                        {t('media.orDragDrop') || 'or drag & drop it here'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {t('media.allowedFormatsSubtitle') || 'Supports JPEG, JPG, PNG (Max 5MB)'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-3 p-1">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center relative">
                          {filePreviewUrl ? (
                            <NextImage
                              src={filePreviewUrl}
                              alt="Selected preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <FileImage className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-medium text-slate-800 truncate" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {selectedFile.size <= 5 * 1024 * 1024 && /\.(jpe?g|png)$/i.test(selectedFile.name) && !isImageCorrupted && !isValidatingImage && (
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => setEditImageSrc(URL.createObjectURL(selectedFile))}
                            className="text-xs px-2.5 py-1.5 hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            {t('media.editImage') || 'Edit Image'}
                          </Button>
                        )}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSelectedFileWithValidation(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={t('media.removeFile') || 'Remove file'}
                          aria-label={t('media.removeFile') || 'Remove file'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.file && <p className="text-xs text-red-500 mt-0.5">{errors.file}</p>}
              </div>
            </>
          )}
        </form>
      </Drawer>
      <PhotoPlanImageEditorDrawer
        open={!!editImageSrc} onClose={handleEditorClose}
        imageSrc={editImageSrc || undefined} imageTitle={name || 'Selected Image'}
        onSave={handleEditorSave}
      />
    </>
  );
}

