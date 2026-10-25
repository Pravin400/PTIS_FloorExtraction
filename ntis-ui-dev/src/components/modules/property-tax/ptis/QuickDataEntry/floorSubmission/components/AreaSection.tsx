'use client';

import React from 'react';
import { LayoutGrid, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, usePathname } from 'next/navigation';
import { Input, AnimatedDigitInput } from '@/components/common';
import { AreaSectionProps } from '@/types/floor-details.types';
import { FieldWrapper, ReadOnlyField } from './SectionField';
import { cn } from '@/lib/utils/cn';
import { checkIsUtilityCategory } from '@/lib/utils/floorSubmission/floor-utility-checks';
import { extractRoomsFromFloorPlanAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';

export const AreaSection: React.FC<AreaSectionProps & { selectedFloorType?: 'Construction' | 'OpenPlot'; isDrawer?: boolean }> = ({
  t,
  editingFloorForm,
  setEditingFloorForm,
  formErrors,
  setFormErrors,
  roomsInputRef,
  areaInputRef,
  setShowRoomSubmission,
  selectedFloorType = 'Construction',
  isDrawer = false,
  wardNo,
  propertyNo,
  partitionNo,
  propertyId,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const toggleButtonRef = React.useRef<HTMLButtonElement>(null);
  const isUtility = checkIsUtilityCategory(editingFloorForm?.typeOfUseCategoryId);
  const isOpenPlot = selectedFloorType === 'OpenPlot';

  const [isExtractingRooms, setIsExtractingRooms] = React.useState(false);
  const autoExtractedFloorKeyRef = React.useRef<string | null>(null);

  // Parameter resolution
  const effWardNo = wardNo || searchParams?.get('wardNo') || undefined;
  const effPropertyNo = propertyNo || searchParams?.get('propertyNo') || undefined;
  const effPartitionNo = partitionNo || searchParams?.get('partitionNo') || undefined;
  const pathPropId = pathname ? pathname.match(/QuickDataEntry\/([^/]+)/)?.[1] : undefined;
  const effPropertyId = propertyId || searchParams?.get('propertyId') || pathPropId;

  // Extract room count handler
  const handleExtractRoomCount = React.useCallback(async (isSilent = false) => {
    if (isOpenPlot || isUtility) return;
    setIsExtractingRooms(true);
    try {
      const res = await extractRoomsFromFloorPlanAction({
        propertyId: effPropertyId,
        wardNo: effWardNo,
        propertyNo: effPropertyNo,
        partitionNo: effPartitionNo,
        floorNumber: editingFloorForm.floor || undefined,
      });

      if (res.success && res.data && typeof res.data.rooms_detected === 'number' && res.data.rooms_detected > 0) {
        const detectedCount = res.data.rooms_detected;
        // User requested: "only room count i want"
        setEditingFloorForm((prev) => ({
          ...prev,
          rooms: String(detectedCount),
          noOfRooms: detectedCount,
        }));
        if (formErrors.rooms) {
          setFormErrors((prev) => ({ ...prev, rooms: '' }));
        }
        toast.success(`Extracted ${detectedCount} rooms from floor plan.`);
      } else if (!isSilent) {
        toast.info(res.error || 'No rooms detected in the floor plan.');
      }
    } catch (err) {
      if (!isSilent) {
        console.warn('Failed to extract rooms from floor plan:', err);
        toast.error('Could not extract rooms from floor plan');
      }
    } finally {
      setIsExtractingRooms(false);
    }
  }, [effPropertyId, effWardNo, effPropertyNo, effPartitionNo, editingFloorForm.floor, isOpenPlot, isUtility, formErrors.rooms, setEditingFloorForm, setFormErrors]);

  // Automatically extract room count when floor form is opened and rooms count is 0 or empty
  React.useEffect(() => {
    if (isOpenPlot || isUtility) return;
    const floorKey = `${effPropertyId || ''}-${editingFloorForm.floorId || editingFloorForm.id || 'new'}-${editingFloorForm.floor || ''}`;
    const roomsVal = editingFloorForm.rooms !== undefined && editingFloorForm.rooms !== null ? String(editingFloorForm.rooms).trim() : '';
    const isZeroOrEmpty = !roomsVal || roomsVal === '0';

    if (isZeroOrEmpty && autoExtractedFloorKeyRef.current !== floorKey) {
      autoExtractedFloorKeyRef.current = floorKey;
      handleExtractRoomCount(true);
    }
  }, [effPropertyId, editingFloorForm.floorId, editingFloorForm.id, editingFloorForm.floor, editingFloorForm.rooms, isOpenPlot, isUtility, handleExtractRoomCount]);

  const content = (
    <>
      {/* Rooms */}
      {!isOpenPlot && (
        <FieldWrapper
          label={t('floor.rooms')}
          htmlFor="floor-rooms"
          required={!isUtility}
          error={formErrors.rooms}
          labelExtra={
            <div className="flex items-center gap-1.5 flex-wrap">
              {isExtractingRooms ? (
                <span className="inline-flex items-center gap-1 text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-medium animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />
                  <span>{t('floor.extracting') || 'Extracting...'}</span>
                </span>
              ) : (
                <button
                  type="button"
                  id="extract-rooms-from-plan-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExtractRoomCount(false);
                  }}
                  title="Extract room count from photo plan"
                  className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                  <span>{t('floor.extractRooms') || 'Extract from Plan'}</span>
                </button>
              )}
              {!formErrors.rooms && !editingFloorForm.use && (
                <span className="text-[9px] text-orange-500 font-medium px-1.5 py-0.5 bg-orange-50 rounded border border-orange-100 animate-pulse">
                  {t('floor.selectUseFirst')}
                </span>
              )}
            </div>
          }
        >
          <AnimatedDigitInput
            ref={roomsInputRef}
            id="floor-rooms"
            maxLength={2}
            value={String(editingFloorForm.rooms || '')}
            placeholder="0"
            disabled={!editingFloorForm.use || isUtility}
            onChange={(cleaned) => {
              setEditingFloorForm({
                ...editingFloorForm,
                rooms: cleaned,
                noOfRooms: cleaned ? Number(cleaned) : 0,
              });
              if (formErrors.rooms) setFormErrors((prev) => ({ ...prev, rooms: '' }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                toggleButtonRef.current?.focus();
              }
            }}
          />
        </FieldWrapper>
      )}

      {/* Area / Plot Area (Sq Ft) */}
      <FieldWrapper
        label={isOpenPlot ? (t('floor.plotAreaSqFt') || 'Plot Area (Sq Ft)') : t('floor.areaSqFt')}
        htmlFor="floor-area-sqft"
        required
        error={formErrors.areaSqFt}
        labelExtra={
          !isOpenPlot ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full shrink-0 whitespace-nowrap">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-[8px] text-blue-700 font-bold uppercase tracking-tight">
                {t('floor.autoCalculated') || 'Auto'}
              </span>
            </span>
          ) : undefined
        }
      >
        <div className="group relative">
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100/90 hover:bg-slate-200/90 px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs transition-all duration-200 group-hover:shadow group-focus-within:border-blue-400 group-focus-within:ring-1 group-focus-within:ring-blue-100 z-20">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
              {t('floor.sqFt')}
            </span>
            <>
              <div className="w-[1px] h-3 bg-slate-400 mx-0.5 opacity-60" />
              <button
                ref={toggleButtonRef}
                type="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUtility && !isOpenPlot) {
                    const roomsStr = editingFloorForm.rooms !== undefined && editingFloorForm.rooms !== null ? String(editingFloorForm.rooms) : '';
                    const roomCount = parseInt(roomsStr, 10);
                    if (!roomsStr || isNaN(roomCount) || roomCount <= 0) {
                      setFormErrors((prev) => ({
                        ...prev,
                        rooms: t('floor.errors.roomsRequiredForDetails') || 'Number of rooms must be greater than zero before entering room details.'
                      }));
                      toast.error(
                        t('floor.errors.roomGuidance') || 'Guidance: To enter room-wise breakdown, please first enter the total number of rooms (1 to 9999) for this floor.'
                      );
                      return;
                    }
                  }
                  setShowRoomSubmission(true);
                }}
                className="flex items-center justify-center p-0.5 rounded hover:bg-blue-600 hover:text-white text-blue-600 transition-all active:scale-90"
                title={t('floor.openRoomSubmission') || 'Open Room Submission'}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            </>
          </div>
          <Input
            ref={areaInputRef}
            id="floor-area-sqft"
            type="text"
            placeholder="0.00"
            value={editingFloorForm.areaSqFt ? parseFloat(String(editingFloorForm.areaSqFt)).toFixed(2) : ''}
            readOnly={true}
            className={cn(
              "h-9 text-sm pr-20 border-gray-300 focus:border-blue-500 focus:ring-blue-200 transition-colors",
              "bg-gray-50 cursor-default group-hover:bg-blue-50/30"
            )}
          />
        </div>
      </FieldWrapper>

      {/* Calculated Fields / Plot Area (Sq M) */}
      <ReadOnlyField
        id="floor-area-sqm"
        label={isOpenPlot ? (t('floor.plotAreaSqM') || 'Plot Area (Sq M)') : t('floor.areaSqM')}
        value={editingFloorForm.areaSqM ? parseFloat(String(editingFloorForm.areaSqM)).toFixed(2) : ''}
        badgeText={!isOpenPlot ? (t('floor.autoCalculated') || 'Auto') : undefined}
      />

      {!isOpenPlot && (
        <>
          <ReadOnlyField
            id="floor-builtup-sqft"
            label={t('floor.builtupAreaSqFt')}
            value={editingFloorForm.builtupAreaSqFt ? parseFloat(String(editingFloorForm.builtupAreaSqFt)).toFixed(2) : ''}
          />

          <ReadOnlyField
            id="floor-builtup-sqm"
            label={t('floor.builtupAreaSqM')}
            value={editingFloorForm.builtupAreaSqM ? parseFloat(String(editingFloorForm.builtupAreaSqM)).toFixed(2) : ''}
          />
        </>
      )}
    </>
  );

  if (isDrawer) {
    return content;
  }

  return (
    <div className={cn(
      "grid grid-cols-5 gap-2.5 w-full",
      isOpenPlot ? "col-span-2 grid-cols-2" : "col-span-3 grid-cols-5"
    )}>
      {content}
    </div>
  );
};
