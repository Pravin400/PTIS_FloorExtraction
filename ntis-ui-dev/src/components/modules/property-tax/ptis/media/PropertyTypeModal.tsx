'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Drawer, Button } from '@/components/common';
import { Layers, Loader2, Info, CheckCircle2, Sparkles, Building2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPlanTypesForPropertyAction,
  getNextPlanTypeAction,
  savePlanTypeAction,
  getExistingTypesAction,
} from '@/app/[locale]/property-tax/ptis/property-type.action';

export interface PropertyTypeModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: number;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
  onSuccess?: (assignedType: string, isExistingSelection: boolean) => void;
  zIndex?: number;
}

export function PropertyTypeModal({
  open,
  onClose,
  propertyId,
  societyDetailId,
  wingDetailId,
  onSuccess,
  zIndex,
}: PropertyTypeModalProps): React.ReactElement | null {
  const t = useTranslations('ptis');
  const [existingTypes, setExistingTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [customTypeValue, setCustomTypeValue] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch existing plan types and next available plan type using Server Actions
  const fetchExistingTypes = useCallback(async () => {
    if (!propertyId || propertyId <= 0) {
      setExistingTypes([]);
      setIsCustomMode(true);
      return;
    }

    setIsLoadingTypes(true);
    setValidationError(null);

    try {
      let types: string[] = [];

      // 1. Primary endpoint: Get distinct plan types for this property's society
      const planTypesRes = await getPlanTypesForPropertyAction(propertyId);
      if (planTypesRes.success && planTypesRes.data) {
        types = planTypesRes.data;
      }

      // 2. Fallback endpoint: Get existing types by societyDetailId / wingDetailId
      if (!types || types.length === 0) {
        const fallbackRes = await getExistingTypesAction(societyDetailId, wingDetailId);
        if (fallbackRes.success && fallbackRes.data) {
          types = fallbackRes.data;
        }
      }

      // 3. Fetch next available plan type for default custom value
      let nextTypeVal = '1';
      const nextTypeRes = await getNextPlanTypeAction(propertyId);
      if (nextTypeRes.success && nextTypeRes.data !== undefined && nextTypeRes.data > 0) {
        nextTypeVal = String(nextTypeRes.data);
      }

      // Compute highest + 1 if backend returned a lower initial number
      if (types && types.length > 0) {
        const numericTypes = types.map((tVal) => Number(tVal)).filter((n) => !isNaN(n));
        if (numericTypes.length > 0) {
          const maxNum = Math.max(...numericTypes);
          if (maxNum >= Number(nextTypeVal)) {
            nextTypeVal = String(maxNum + 1);
          }
        }
      }

      setExistingTypes(types || []);
      if (types && types.length > 0) {
        setSelectedType(types[0]);
        setIsCustomMode(false);
        setCustomTypeValue(nextTypeVal);
      } else {
        setSelectedType(nextTypeVal);
        setIsCustomMode(true);
        setCustomTypeValue(nextTypeVal);
      }
    } catch {
      setExistingTypes([]);
      setIsCustomMode(true);
      setCustomTypeValue('1');
      setSelectedType('1');
    } finally {
      setIsLoadingTypes(false);
    }
  }, [propertyId, societyDetailId, wingDetailId]);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        fetchExistingTypes();
      });
    } else {
      setTimeout(() => {
        setExistingTypes([]);
        setSelectedType('');
        setCustomTypeValue('');
        setIsCustomMode(false);
        setValidationError(null);
      }, 0);
    }
  }, [open, fetchExistingTypes]);

  const getEffectiveType = (): string | null => {
    const finalType = isCustomMode ? customTypeValue.trim() : selectedType.trim();
    if (!finalType || finalType.toLowerCase() === 'null') {
      setValidationError(t('media.typeRequired'));
      return null;
    }
    return finalType;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLoadingTypes) return;

    const validatedType = getEffectiveType();
    if (validatedType === null) return;

    setIsSubmitting(true);
    const toastId = toast.loading(t('media.savingType'));

    try {
      const actionResult = await savePlanTypeAction(propertyId, validatedType);

      if (!actionResult.success) {
        const errorMsg = actionResult.error || t('media.failedToSaveType');
        toast.error(errorMsg, { id: toastId });
        setValidationError(errorMsg);
        return;
      }

      toast.success(t('media.typeAssignedSuccess'), { id: toastId });
      onClose();

      if (onSuccess) {
        onSuccess(validatedType, !isCustomMode);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('media.unexpectedError');
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || typeof window === 'undefined' || typeof document === 'undefined') return null;

  return createPortal(
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 leading-tight">
              {t('media.assignTypeTitle')}
            </h3>
            <p className="text-xs text-slate-500">{t('media.assignTypeSubtitle')}</p>
          </div>
        </div>
      }
      width="lg"
      zIndex={zIndex ?? 210}
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <div className="text-xs text-slate-500 font-medium">
            {t('media.selectedLabel')}{' '}
            <span className="font-bold text-slate-800">
              {isCustomMode
                ? t('media.newTypeSelected', { type: customTypeValue })
                : t('media.typeLabel', { type: selectedType })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 text-xs font-medium cursor-pointer"
            >
              {t('media.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingTypes}
              className="px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('media.saving')}
                </span>
              ) : (
                t('media.proceed')
              )}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 px-6 py-4">
        {/* User Guidance Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-xl flex items-start gap-3 shadow-xs">
          <div className="p-1.5 bg-blue-500/10 rounded-md shrink-0">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {t('media.assignTypeBanner')}
          </p>
        </div>

        {isLoadingTypes ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">{t('media.fetchingBuildingPlanTypes')}</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Split Section / Cards Layout */}
            {existingTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Option A: Select Existing Building Plan Card */}
                <div
                  onClick={() => {
                    setIsCustomMode(false);
                    if (existingTypes.length > 0) setSelectedType(existingTypes[0]);
                    if (validationError) setValidationError(null);
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    !isCustomMode
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
                          {t('media.optionATitle')}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">
                        {t('media.sharedPlanTag')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {t('media.optionADesc')}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      {t('media.selectPlanTypeLabel')}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                      {existingTypes.map((tVal) => {
                        const isSelected = !isCustomMode && selectedType === tVal;
                        return (
                          <button
                            key={tVal}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCustomMode(false);
                              setSelectedType(tVal);
                              if (validationError) setValidationError(null);
                            }}
                            className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/60 text-blue-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="text-xs whitespace-nowrap">{t('media.typeLabel', { type: tVal })}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Option B: Enter/Create New Custom Plan Card */}
                <div
                  onClick={() => {
                    setIsCustomMode(true);
                    setSelectedType(customTypeValue);
                    if (validationError) setValidationError(null);
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isCustomMode
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 truncate">
                          {t('media.optionBTitle')}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0 flex items-center gap-1 whitespace-nowrap">
                        <Sparkles className="w-3 h-3" /> {t('media.newTag')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {t('media.optionBDesc')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                    <span className="text-[11px] font-medium text-slate-600 block">
                      {t('media.nextAvailableTypeLabel')}
                    </span>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono font-bold tracking-wider">
                          {t('media.typeNumberHeader')}
                        </span>
                        <span className="text-xl font-black text-blue-600 whitespace-nowrap">
                          {t('media.typeLabel', { type: customTypeValue })}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-100 whitespace-nowrap ml-2">
                        {t('media.autoGeneratedTag')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Primary Card when no existing building plan types exist */
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {t('media.newCustomBuildingPlanTitle')}
                      </h4>
                      <p className="text-xs text-slate-500">{t('media.newCustomBuildingPlanDesc')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full shadow-xs whitespace-nowrap">
                    {t('media.autoGeneratedTag')}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-slate-400 block font-mono uppercase">
                      {t('media.assignedPlanType')}
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {t('media.typeLabel', { type: customTypeValue })}
                    </span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            )}

            {validationError && (
              <p id="property-type-error" className="text-xs font-medium text-red-600 animate-fadeIn px-1">
                {validationError}
              </p>
            )}
          </div>
        )}
      </form>
    </Drawer>,
    document.body
  );
}
