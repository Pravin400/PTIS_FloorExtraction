/* eslint-disable i18next/no-literal-string, @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { Button } from '@/components/common';
import { useAddFloorDrawer } from '../../../../hooks/ptis/floorSubmission/useAddFloorDrawer';
import {
  BasicInfoSection,
  UsageSection,
  RenterSection,
  AreaSection,
  PlotAreaCalculator,
  RoomSubmissionModal,
  FloorTypeToggle,
} from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/components';
import {
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
} from '@/lib/utils/floorSubmission/floor-mappers';

import { FloorResponse, ConstructionTypeResponse, TypeOfUseApiItem, SubFloorResponse } from '@/types/floor-details.types';
import { RoomAPIResponse, RoomTypeResponse } from '@/types/room-details.types';
import { convertSqMToSqFt } from '@/lib/utils/RoomSubmission/conversions';

interface AddFloorDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Which mode to open: 'Construction' or 'OpenPlot' */
  initialFloorType?: 'Construction' | 'OpenPlot';
  propertyId?: number | string;
  locale?: string;
  floorOptions?: FloorResponse[];
  constructionTypeOptions?: ConstructionTypeResponse[];
  useOptions?: TypeOfUseApiItem[];
  subFloorOptions?: SubFloorResponse[];
  isPlotCategory?: boolean;
  floorId?: number | string;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  roomTypeData?: RoomTypeResponse[];
  initialPlotArea?: {
    length?: number | string | null;
    width?: number | string | null;
    totalPlotArea?: number | string | null;
  } | null;
  existingFloors?: any[];
  initialFloorDetails?: any;
}

/**
 * AddFloorDrawer — An inline right-side drawer for adding a new floor or open plot
 * directly from the PTIS main screen.
 */
export const AddFloorDrawer: React.FC<AddFloorDrawerProps> = ({
  open,
  onClose,
  initialFloorType = 'Construction',
  propertyId,
  locale = 'en',
  floorOptions: preFetchedFloorOptions,
  constructionTypeOptions: preFetchedConstructionTypeOptions,
  useOptions: preFetchedUseOptions,
  subFloorOptions: preFetchedSubFloorOptions,
  isPlotCategory = false,
  floorId,
  wardNo,
  propertyNo,
  partitionNo,
  roomTypeData,
  initialPlotArea,
  existingFloors,
  initialFloorDetails,
}) => {
  const {
    t,
    editingFloorForm,
    setEditingFloorForm,
    formErrors,
    setFormErrors,
    selectedFloorType,
    setSelectedFloorType,
    showRoomSubmission,
    setShowRoomSubmission,
    floorOptions,
    floorLookup,
    subFloorOptions,
    subFloorLookup,
    constructionTypeOptions,
    constructionLookup,
    useOptions,
    useLookup,
    subTypeOptionsFromData,
    subTypeData,
    isSaving,
    roomsInputRef,
    areaInputRef,
    handleOpenDropdown,
    updateUrlParams,
    handleOpenRenterManagement,
    startTransition,
    handleDiscard,
    handleSave,
    handleSaveAndNext,
    roomTypeData: resolvedRoomTypeData,
    // validation exports
    plotAreaSqM,
    setPlotAreaSqM,
    isAreaExceeded,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    totalOpenSpaceAreaSqM,
    remainingAvailablePlotAreaSqM,
    enteredFloorAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    enteredOpenSpaceAreaSqM,
    totalConstructionAreaSqM,
  } = useAddFloorDrawer({
    open,
    onClose,
    initialFloorType,
    propertyId,
    locale,
    floorOptions: preFetchedFloorOptions,
    constructionTypeOptions: preFetchedConstructionTypeOptions,
    useOptions: preFetchedUseOptions,
    subFloorOptions: preFetchedSubFloorOptions,
    isPlotCategory,
    floorId,
    roomTypeData,
    initialPlotArea,
    existingFloors,
    initialFloorDetails,
  });

  const isEditMode = !!(floorId && floorId !== 'new');

  // ---------- Drawer Header ----------
  const drawerTitle = (
    <div className="flex items-center gap-2">
      <FileText className="w-5 h-5 text-indigo-600" />
      <span className="text-sm font-bold text-slate-800">
        {isEditMode
          ? selectedFloorType === 'OpenPlot'
            ? (t('floor.editOpenPlotDetails') || 'Edit Open Space Details')
            : (t('floor.editFloorDetails') || 'Edit Floor Details')
          : selectedFloorType === 'OpenPlot'
            ? (t('floor.addOpenPlotDetails') || 'Add Open Space Details')
            : (t('floor.addFloorDetails') || 'Add Floor Details')}
      </span>
    </div>
  );

  // ---------- Drawer Footer ----------
  const drawerFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        type="button"
        variant="secondary"
        onClick={handleDiscard}
        className="px-5 py-2 text-sm font-semibold text-gray-600 border-gray-300 hover:bg-gray-100 rounded-lg"
      >
        {t('floor.discard') || 'Discard'}
      </Button>
      <div className="flex items-center gap-3">
        {!isEditMode && (
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving || isAreaExceeded}
            onClick={handleSaveAndNext}
            className="px-5 py-2 text-sm font-bold border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            {t('floor.saveAndNext') || 'Save & Next'}
          </Button>
        )}
        <Button
          type="button"
          disabled={isSaving || isAreaExceeded}
          onClick={handleSave}
          className="px-5 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md rounded-lg transition-all"
        >
          {isSaving
            ? (t('floor.saving') || 'Saving...')
            : isEditMode
              ? (t('floor.updateFloor') || 'Update Floor')
              : (t('floor.saveRow') || 'Save Row')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={drawerTitle}
        width="md"
        footer={drawerFooter}
      >
        <div className="flex flex-col h-full bg-white relative">
          {/* Loading Overlay */}
          {isSaving && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-lg">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Construction / Open Plot Toggle */}
          <FloorTypeToggle
            selectedFloorType={selectedFloorType}
            onChange={setSelectedFloorType}
            isPlotCategory={isPlotCategory}
            t={t}
            size="sm"
          />

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Plot Area Calculator */}
            {(selectedFloorType === 'Construction' || selectedFloorType === 'OpenPlot') && (
              <div className="space-y-4">
                <PlotAreaCalculator
                  t={t}
                  layout="double-row"
                  propertyId={propertyId}
                  initialPlotArea={initialPlotArea}
                  onLoad={(_sqFt, sqM, _len, _wid) => {
                    setPlotAreaSqM(parseFloat(sqM) || 0);
                  }}
                  onApply={(sqFt: string, sqM: string, len?: string, wid?: string) => {
                    setPlotAreaSqM(parseFloat(sqM) || 0);
                    if (isPlotCategory) {
                      setEditingFloorForm((prev) => ({
                        ...prev,
                        ...(len ? { length: len } : {}),
                        ...(wid ? { width: wid } : {}),
                        areaSqFt: sqFt,
                        areaSqM: sqM
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        areaSqFt: '',
                        areaSqM: '',
                        ...(len ? { length: '' } : {}),
                        ...(wid ? { width: '' } : {})
                      }));
                    }
                  }}
                />

                {/* Remaining Area Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Plot Area:</span>
                    <span className="font-extrabold text-slate-800">{plotAreaSqM} Sq M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilized Area (Construction):</span>
                    <span className="font-extrabold text-slate-800">{totalConstructionAreaSqM} Sq M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Space Area:</span>
                    <span className="font-extrabold text-slate-800">{totalOpenSpaceAreaSqM} Sq M</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/80 pt-1.5 mt-0.5 text-blue-700">
                    <span>Remaining Available Area:</span>
                    <span className={`font-extrabold ${remainingAvailablePlotAreaSqM < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {remainingAvailablePlotAreaSqM} Sq M
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedFloorType === 'OpenPlot' && isOpenSpaceAreaExceeded && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs font-semibold space-y-1.5 whitespace-pre-line shadow-sm">
                <span className="font-bold text-red-800 block text-sm">
                  Total utilized area cannot exceed the Plot Area.
                </span>
                <div>
                  <p>Plot Area: {plotAreaSqM} Sq M</p>
                  <p>Already Utilized Area: {alreadyUtilizedOpenSpaceAreaSqM} Sq M</p>
                  <p>Attempted Area: {enteredOpenSpaceAreaSqM} Sq M</p>
                  <p>Available Area: {plotAreaSqM - alreadyUtilizedOpenSpaceAreaSqM} Sq M</p>
                </div>
                <p className="text-red-600 font-bold mt-1">
                  Please enter an area less than or equal to the available area.
                </p>
              </div>
            )}

            {selectedFloorType === 'Construction' && isFloorAreaExceeded && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs font-semibold space-y-1.5 whitespace-pre-line shadow-sm">
                <span className="font-bold text-red-800 block text-sm">
                  Floor Built-up Area cannot exceed the available Plot Area.
                </span>
                <div>
                  <p>Plot Area: {plotAreaSqM} Sq M</p>
                  <p>Open Space Utilized Area: {totalOpenSpaceAreaSqM} Sq M</p>
                  <p>Available Area: {remainingAvailablePlotAreaSqM} Sq M</p>
                  <p>Entered Floor Built-up Area: {enteredFloorAreaSqM} Sq M</p>
                  <p className="font-bold text-red-600">Exceeded Area (Difference): {Math.max(0, parseFloat((enteredFloorAreaSqM - remainingAvailablePlotAreaSqM).toFixed(2)))} Sq M</p>
                </div>
                <p className="text-red-600 font-bold mt-1">
                  Please enter an area less than or equal to the available area.
                </p>
              </div>
            )}

            {/* Form Sections Grid (Unified 4-column layout for OpenPlot, 2-column for Construction) */}
            <div className={selectedFloorType === 'OpenPlot' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
              <BasicInfoSection
                t={t}
                editingFloorForm={editingFloorForm}
                setEditingFloorForm={setEditingFloorForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                floorOptions={floorOptions}
                floorLookup={floorLookup}
                subFloorOptions={subFloorOptions}
                subFloorLookup={subFloorLookup}
                getFloorDescription={getFloorDescription}
                getSubFloorDescription={getSubFloorDescription}
                handleOpenDropdown={handleOpenDropdown}
                selectedFloorType={selectedFloorType}
              />

              <UsageSection
                t={t}
                editingFloorForm={editingFloorForm}
                setEditingFloorForm={setEditingFloorForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                constructionTypeOptions={constructionTypeOptions}
                constructionLookup={constructionLookup}
                useOptions={useOptions}
                useLookup={useLookup}
                subTypeOptionsFromData={subTypeOptionsFromData}
                subTypeData={subTypeData}
                startTransition={startTransition}
                updateUrlParams={updateUrlParams}
                getConstructionDescription={getConstructionDescription}
                getUseDescription={getUseDescription}
                getSubTypeDescription={getSubTypeDescription}
                handleOpenDropdown={handleOpenDropdown}
                selectedFloorType={selectedFloorType}
                isPlotCategory={isPlotCategory}
              />

              {selectedFloorType !== 'OpenPlot' && (
                <RenterSection
                  t={t}
                  editingFloorForm={editingFloorForm}
                  setEditingFloorForm={setEditingFloorForm}
                  formErrors={formErrors}
                  setFormErrors={setFormErrors}
                  handleOpenRenterManagement={handleOpenRenterManagement}
                  isOperationLoading={false}
                />
              )}

              <AreaSection
                t={t}
                editingFloorForm={editingFloorForm}
                setEditingFloorForm={setEditingFloorForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                roomsInputRef={roomsInputRef}
                areaInputRef={areaInputRef}
                setShowRoomSubmission={setShowRoomSubmission}
                selectedFloorType={selectedFloorType}
                isDrawer={true}
              />
            </div>
          </div>
        </div>
      </Drawer>

      <RoomSubmissionModal
        key={`${editingFloorForm.floorId || editingFloorForm.id || ''}-${editingFloorForm.noOfRooms || editingFloorForm.rooms || 0}`}
        isOpen={showRoomSubmission}
        onClose={() => setShowRoomSubmission(false)}
        t={t}
        wardNo={wardNo || ''}
        propertyNo={propertyNo || ''}
        partitionNo={partitionNo || ''}
        floorNumber={String(editingFloorForm.floor || '')}
        maxRooms={Number(editingFloorForm.noOfRooms || editingFloorForm.rooms || 0)}
        floorData={editingFloorForm}
        initialFloorId={editingFloorForm.floorId || editingFloorForm.id}
        initialPropertyID={propertyId}
        existingRooms={(editingFloorForm?.roomWiseSubmissionDetails as RoomAPIResponse[]) || []}
        roomTypeData={resolvedRoomTypeData}
        onUpdate={(data) => {
          const areaSqM = data.totalAreaSqM;
          const builtUpSqM = data.builtUpAreaSqM;
          const areaSqFt = convertSqMToSqFt(areaSqM);
          const builtUpAreaSqFt = convertSqMToSqFt(builtUpSqM);

          setEditingFloorForm(prev => ({
            ...prev,
            roomWiseSubmissionDetails: data.rooms as RoomAPIResponse[],
            areaSqM: areaSqM.toFixed(2),
            areaSqFt: areaSqFt.toFixed(2),
            builtupAreaSqM: builtUpSqM.toFixed(2),
            builtupAreaSqFt: builtUpAreaSqFt.toFixed(2),
            rooms: data.rooms.length,
            noOfRooms: data.rooms.length
          }));

          setFormErrors(prev => {
            if (prev.rooms) {
              return { ...prev, rooms: '' };
            }
            return prev;
          });
        }}
      />
    </>
  );
};

export default AddFloorDrawer;
