/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, memo, useMemo, useTransition, useCallback } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Button, ToastContainer } from '@/components/common';
import type { ToastProps } from '@/components/common';
import { CheckCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { PropertyDetailsOnRenter } from './PropertyDetailsOnRenter';
import AgreementDetails from './AgreementDetails';
import { SelectedFloorDetails } from './SelectedFloorDetails';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ActionResult } from '@/types/common.types';
import { useRenterForm } from '@/hooks/ptis/floorSubmission/renter/useRenterForm';
import { RentBreakdownDialog } from './RentBreakdownDialog';
import { calculateRentProgression } from '@/lib/utils/renter/renter-calculations';
import { validateRenterForm, type CurrentFloorContext, type ExistingFloorData } from '@/lib/utils/renter/renter-validation';
import { getFloorSubmissionsByOwnerAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

const RentManagementCard = dynamic(
  () => import('./RentManagementCard').then((mod) => ({ default: mod.RentManagementCard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-100 bg-white/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Loading rent engine...
          </span>
        </div>
      </div>
    ),
  }
);

const parseExistingFloors = (res: unknown): ExistingFloorData[] => {
  if (Array.isArray(res)) return res as ExistingFloorData[];
  if (
    res &&
    typeof res === 'object' &&
    'success' in res &&
    (res as Record<string, unknown>).success &&
    Array.isArray((res as Record<string, unknown>).data)
  ) {
    return (res as Record<string, unknown>).data as ExistingFloorData[];
  }
  if (res && typeof res === 'object' && Array.isArray((res as Record<string, unknown>).items)) {
    return (res as Record<string, unknown>).items as ExistingFloorData[];
  }
  return [];
};

export interface RenterDetailsFormProps {
  initialData?: any;
  propertyInfo?: {
    propertyName?: string;
    floorNumber?: string;
    zone?: string;
  };
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  propertyId?: string;
  floorId?: string;
  onSaveRenter?: (data: any) => void;
  saveAction?: (id: string | number, data: any, locale?: string, propertyId?: string | number) => Promise<ActionResult<any>>;
  floorLookup?: any[];
  constructionLookup?: any[];
  useLookup?: any[];
  subTypeLookup?: any[];
  subFloorLookup?: any[];
  existingFloors?: any[];
}

export const RenterDetailsForm = memo(
  ({
    initialData,
    propertyInfo,
    wardNo,
    propertyNo,
    partitionNo,
    propertyId,
    floorId,
    onSaveRenter,
    saveAction,
    floorLookup,
    constructionLookup,
    useLookup,
    subTypeLookup,
    subFloorLookup,
    existingFloors: initialExistingFloors = [],
  }: RenterDetailsFormProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const t = useTranslations('quickDataEntry');
    const { markChangesSaved } = useQdeSaveTracker(propertyId);
    const [existingFloors, setExistingFloors] = useState<ExistingFloorData[]>(initialExistingFloors);
    const [, startExistingFloorsTransition] = useTransition();

    const handleSaveSuccess = useCallback((data: Parameters<NonNullable<RenterDetailsFormProps['onSaveRenter']>>[0]) => {
      if (onSaveRenter) onSaveRenter(data);

      const rawId = data?.propertyDetailsId ?? data?.id;
      const numericId = Number(rawId);
      const savedFloorId = (!isNaN(numericId) && numericId > 0) ? String(numericId) : (floorId || 'new');

      const resolvedWardNo = wardNo || searchParams.get('wardNo') || '';
      const resolvedPropertyNo = propertyNo || searchParams.get('propertyNo') || '';
      const resolvedPartitionNo = partitionNo || searchParams.get('partitionNo') || '';

      toast.success(t('floor.renterSection.successfullySaved'));
      markChangesSaved();

      const drawerParam = searchParams.get('drawer');
      const isPlot =
        drawerParam === 'OpenPlot' ||
        (initialData as any)?.isOpenPlot === true ||
        String((initialData as any)?.selectedFloorType).toLowerCase() === 'openplot' ||
        String((initialData as any)?.floorCode || '').toLowerCase() === 'op' ||
        String((initialData as any)?.conTyp || '').toLowerCase() === 'op' ||
        String((initialData as any)?.floor || '').toLowerCase().includes('open plot');

      const redirectParams = new URLSearchParams();
      if (resolvedWardNo) redirectParams.set('wardNo', resolvedWardNo);
      if (resolvedPropertyNo) redirectParams.set('propertyNo', resolvedPropertyNo);
      if (resolvedPartitionNo) redirectParams.set('partitionNo', resolvedPartitionNo);
      redirectParams.set('floorId', savedFloorId);
      redirectParams.set('drawer', isPlot ? 'OpenPlot' : (savedFloorId === 'new' ? 'add' : 'edit'));

      try {
        sessionStorage.setItem('renter_return_focus', 'true');
      } catch {}

      router.push(
        `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/FloorSubmission?${redirectParams.toString()}`
      );
    }, [
      floorId,
      initialData,
      locale,
      onSaveRenter,
      partitionNo,
      propertyId,
      propertyNo,
      router,
      searchParams,
      t,
      wardNo,
    ]);

    const handleCancelRenter = useCallback(() => {
      const resolvedWardNo = wardNo || searchParams.get('wardNo') || '';
      const resolvedPropertyNo = propertyNo || searchParams.get('propertyNo') || '';
      const resolvedPartitionNo = partitionNo || searchParams.get('partitionNo') || '';
      const drawerParam = searchParams.get('drawer');
      const isPlot =
        drawerParam === 'OpenPlot' ||
        (initialData as any)?.isOpenPlot === true ||
        String((initialData as any)?.selectedFloorType).toLowerCase() === 'openplot' ||
        String((initialData as any)?.floorCode || '').toLowerCase() === 'op' ||
        String((initialData as any)?.conTyp || '').toLowerCase() === 'op' ||
        String((initialData as any)?.floor || '').toLowerCase().includes('open plot');

      const redirectParams = new URLSearchParams();
      if (resolvedWardNo) redirectParams.set('wardNo', resolvedWardNo);
      if (resolvedPropertyNo) redirectParams.set('propertyNo', resolvedPropertyNo);
      if (resolvedPartitionNo) redirectParams.set('partitionNo', resolvedPartitionNo);
      if (floorId) redirectParams.set('floorId', floorId);
      redirectParams.set('drawer', isPlot ? 'OpenPlot' : (floorId === 'new' ? 'add' : 'edit'));

      try {
        sessionStorage.setItem('renter_return_focus', 'true');
      } catch {}

      router.push(
        `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/FloorSubmission?${redirectParams.toString()}`
      );
    }, [wardNo, propertyNo, partitionNo, searchParams, initialData, floorId, locale, propertyId, router]);

    const { formData, setFormData, isSaving, handleSave } = useRenterForm({
      initialData,
      floorId: floorId || 'new',
      propertyId,
      locale,
      saveAction,
      onSaveSuccess: handleSaveSuccess,
    });

    useEffect(() => {
      if (!propertyId || initialExistingFloors.length > 0) return;

      let cancelled = false;
      const loadExistingFloors = () => {
        startExistingFloorsTransition(async () => {
          try {
            const res = await getFloorSubmissionsByOwnerAction(propertyId);
            if (!cancelled) setExistingFloors(parseExistingFloors(res));
          } catch {
            // Validation can proceed without cross-floor checks if this fetch fails.
          }
        });
      };

      let idleId: number | undefined;
      let timerId: ReturnType<typeof setTimeout> | undefined;

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(loadExistingFloors, { timeout: 2000 });
      } else {
        timerId = setTimeout(loadExistingFloors, 0);
      }

      return () => {
        cancelled = true;
        if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleId);
        }
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
      };
    }, [propertyId, initialExistingFloors.length]);

    // Build the current floor's logical identity from props + initialData so the
    // validator can exclude its own row AND any stray DB duplicates (same
    // floor master + sub-floor master) from agreement-id / overlap checks.
    const currentFloorContext = useMemo<CurrentFloorContext>(() => {
      const raw = (initialData ?? {}) as Record<string, unknown>;
      const formRaw = (formData ?? {}) as Record<string, unknown>;
      const firstDefined = (...vals: unknown[]): string | number | undefined => {
        for (const v of vals) {
          if (v === undefined || v === null || v === '') continue;
          if (typeof v === 'string' || typeof v === 'number') return v;
        }
        return undefined;
      };
      return {
        id: firstDefined(floorId, formRaw.id, formRaw.propertyDetailsId, raw.id, raw.propertyDetailsId),
        floorId: firstDefined(formRaw.floorId, raw.floorId, raw.floorID),
        subFloorId: firstDefined(formRaw.subFloorId, raw.subFloorId, raw.subFloorID),
        agreementId: formData?.renterDetails?.agreementId,
      };
    }, [floorId, initialData, formData]);

    const isFormValid = useMemo(() => {
      if (!formData?.renterDetails) return false;
      return validateRenterForm(formData.renterDetails, currentFloorContext, existingFloors).length === 0;
    }, [formData?.renterDetails, currentFloorContext, existingFloors]);

    const isAgreementExpired = useMemo(() => {
      const toDateStr = formData?.renterDetails?.agreementDateTo;
      if (!toDateStr) return false;
      const toDate = new Date(toDateStr);
      if (isNaN(toDate.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const compDate = new Date(toDate);
      compDate.setHours(0, 0, 0, 0);
      return compDate < today;
    }, [formData?.renterDetails?.agreementDateTo]);

    const [popupFY, setPopupFY] = useState<string | null>(null);
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    return (
      <div className="w-full h-full flex flex-col bg-white relative animate-in fade-in duration-300">
        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />

        <div className="relative z-10 flex flex-col px-4 py-3 md:px-5 md:py-4 h-full">
          {/* Combined Header Bar - Single Row */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm -mx-4 md:-mx-5 -mt-3 md:-mt-4 mb-4">
            {/* Left Side: Back Button + Title */}
            <div className="flex items-center gap-4 shrink-0">
              <Button
                variant="secondary"
                onClick={handleCancelRenter}
                className="w-10 h-10 p-0 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-500 border border-transparent hover:border-blue-100 transition-all font-bold flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Button>
              <div className="flex flex-col border-r border-gray-100 pr-6 mr-2">
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tighter leading-none">
                  {t('floor.renterSection.management')}
                </h1>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1.5">
                  {t('floor.renterSection.editFloorLeasingDetails')}
                </p>
              </div>
            </div>

            {/* Right Side: Property Context */}
            <div className="flex-1 flex items-center justify-end gap-6 px-4">
              <PropertyDetailsOnRenter propertyInfo={propertyInfo} />
            </div>
          </div>

          {isAgreementExpired && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('floor.renterSection.agreementExpiredWarning')}
              </span>
            </div>
          )}

          <SelectedFloorDetails
            formData={formData}
            floorLookup={floorLookup}
            constructionLookup={constructionLookup}
            useLookup={useLookup}
            subTypeLookup={subTypeLookup}
            subFloorLookup={subFloorLookup}
          />

          <div className="space-y-4 flex-1">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AgreementDetails
                formData={formData}
                setFormData={setFormData}
                existingFloors={existingFloors}
                currentFloorContext={currentFloorContext}
                wardNo={wardNo}
                propertyNo={propertyNo}
                partitionNo={partitionNo}
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RentManagementCard formData={formData} setFormData={setFormData} />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={handleCancelRenter}
              className="px-6 h-9 rounded-md border-red-200 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              {t('floor.renterSection.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isFormValid}
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-md shadow-md shadow-blue-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}{' '}
              {t('floor.renterSection.saveChanges')}
            </Button>
          </div>
        </div>

        {popupFY && (
          <RentBreakdownDialog
            isOpen={!!popupFY}
            onClose={() => setPopupFY(null)}
            fy={popupFY}
            progression={calculateRentProgression(formData?.renterDetails)?.progression || []}
          />
        )}
      </div>
    );
  }
);

RenterDetailsForm.displayName = 'RenterDetailsForm';

export default RenterDetailsForm;
