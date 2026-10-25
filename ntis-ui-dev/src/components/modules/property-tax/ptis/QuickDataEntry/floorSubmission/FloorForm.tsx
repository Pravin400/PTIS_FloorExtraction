'use client';

import React from 'react';
import { Edit2, X } from 'lucide-react';
import {
  Button,
  IconButton,
  SearchSelect,
  useConfirm,
} from '@/components/common';
import { FloorFormProps } from '@/types/floor-details.types';
import { FloorData } from '@/types/room-details.types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LookupData } from '@/types/common-details.types';
import {
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
} from '@/lib/utils/floorSubmission/floor-mappers';

import { floorFormSchema } from '@/lib/validations/floor-form.schema';

import {
  BasicInfoSection,
  UsageSection,
  RenterSection,
  AreaSection,
} from './components';
import { FieldWrapper } from './components/SectionField';


const FloorForm: React.FC<FloorFormProps & {
  selectedFloorType?: 'Construction' | 'OpenPlot';
  selectedFloor?: FloorData | null;
  isPlotCategory?: boolean;
  isAreaExceeded?: boolean;
  plotAreaSqM?: number;
  isOpenSpaceAreaExceeded?: boolean;
  isFloorAreaExceeded?: boolean;
  totalOpenSpaceAreaSqM?: number;
  totalConstructionAreaSqM?: number;
  availableRemainingOpenSpaceAreaSqM?: number;
  availableRemainingConstructionAreaSqM?: number;
  enteredFloorAreaSqM?: number;
  alreadyUtilizedOpenSpaceAreaSqM?: number;
  enteredOpenSpaceAreaSqM?: number;
}> = ({
  t,
  selectedFloor,
  isAddingNewFloor,
  setIsAddingNewFloor,
  editingFloorForm,
  setEditingFloorForm,
  formErrors,
  setFormErrors,
  resetForm,
  handleOpenDropdown,
  handleOpenRenterManagement,
  updateUrlParams,
  isOperationLoading,
  startTransition,
  roomsInputRef,
  areaInputRef,
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
  setShowRoomSubmission,
  onSave,
  wardNo,
  propertyNo,
  partitionNo,
  propertyId,
  selectedFloorType = 'Construction',
  isPlotCategory = false,
  isAreaExceeded: _isAreaExceeded = false,
  plotAreaSqM: _plotAreaSqM = 0,
  isOpenSpaceAreaExceeded: _isOpenSpaceAreaExceeded = false,
  isFloorAreaExceeded: _isFloorAreaExceeded = false,
  totalOpenSpaceAreaSqM: _totalOpenSpaceAreaSqM = 0,
  totalConstructionAreaSqM: _totalConstructionAreaSqM = 0,
  availableRemainingOpenSpaceAreaSqM: _availableRemainingOpenSpaceAreaSqM = 0,
  availableRemainingConstructionAreaSqM: _availableRemainingConstructionAreaSqM = 0,
  enteredFloorAreaSqM: _enteredFloorAreaSqM = 0,
  alreadyUtilizedOpenSpaceAreaSqM: _alreadyUtilizedOpenSpaceAreaSqM = 0,
  enteredOpenSpaceAreaSqM: _enteredOpenSpaceAreaSqM = 0,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { confirm } = useConfirm();

    const isUseValidForProperty = React.useMemo(() => {
      if (!useLookup || useLookup.length === 0) return true;
      const currentUseId = String(editingFloorForm.typeOfUseId || '').trim();
      const currentUseDesc = String(
        editingFloorForm.use || editingFloorForm.usageDescription || editingFloorForm.typeOfUseDescription || ''
      ).trim().toLowerCase();

      if (!currentUseId && !currentUseDesc) return false;

      const validUseIds = new Set(useLookup.map(u => String(u.typeOfUseId || u.id || u.ID || '')));
      const validUseDescs = new Set<string>();
      useLookup.forEach((u) => {
        const desc = String(u.description || '').trim().toLowerCase();
        const code = String(u.typeOfUseCode || u.code || '').trim().toLowerCase();
        if (desc) validUseDescs.add(desc);
        if (code) validUseDescs.add(code);
        if (code && desc) validUseDescs.add(`${code} - ${desc}`);
        if (code && desc) validUseDescs.add(`${code}-${desc}`);
      });

      const matchesId = currentUseId ? validUseIds.has(currentUseId) : false;
      const matchesDesc = currentUseDesc ? validUseDescs.has(currentUseDesc) : false;

      return matchesId || matchesDesc;
    }, [useLookup, editingFloorForm.typeOfUseId, editingFloorForm.use, editingFloorForm.usageDescription, editingFloorForm.typeOfUseDescription]);

    const isFormValid = React.useMemo(() => {
      const result = floorFormSchema.safeParse({
        ...editingFloorForm,
        isAddingNewFloor,
        selectedFloorType,
      });
      return result.success && isUseValidForProperty;
    }, [editingFloorForm, isAddingNewFloor, selectedFloorType, isUseValidForProperty]);

    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 m-0 p-2.5 sm:p-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b-2 border-blue-200">
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            {(!selectedFloor && isAddingNewFloor)
              ? (selectedFloorType === 'OpenPlot' ? (t('floor.addOpenPlotDetails') || 'Add Open Space Details') : (t('floor.addFloorDetails') || 'Add Floor Details'))
              : (selectedFloorType === 'OpenPlot' ? (t('floor.editOpenPlotDetails') || 'Edit Open Space Details') : (t('floor.editFloorDetails') || 'Edit Floor Details'))}
          </h3>
          <IconButton
            icon={X}
            onClick={() => {
              resetForm();
            }}
            className="bg-transparent border-0 hover:bg-blue-50 text-blue-400 hover:text-blue-600"
          />
        </div>

        <div className={selectedFloorType === 'OpenPlot' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3' : 'grid grid-cols-1 md:grid-cols-3 gap-3'}>
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
            getFloorDescription={(val: string, lookup: LookupData[]): string => val ? (getFloorDescription(val, lookup) || String(editingFloorForm.floorDescription || '')) : ''}
            getSubFloorDescription={(val: string, lookup: LookupData[]): string => val ? (getSubFloorDescription(val, lookup) || String(editingFloorForm.subFloorDescription || '')) : ''}
            handleOpenDropdown={handleOpenDropdown}
            selectedFloorType={selectedFloorType}
            isAddingNewFloor={isAddingNewFloor}
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
            getConstructionDescription={(val: string, lookup: LookupData[]): string => val ? (getConstructionDescription(val, lookup) || String(editingFloorForm.constructionDescription || '')) : ''}
            getUseDescription={(val: string, lookup: LookupData[]): string => val ? (getUseDescription(val, lookup) || String(editingFloorForm.usageDescription || '')) : ''}
            getSubTypeDescription={(val: string, lookup: LookupData[]): string => val ? (getSubTypeDescription(val, lookup) || String(editingFloorForm.subTypeDescription || '')) : ''}
            handleOpenDropdown={handleOpenDropdown}
            selectedFloorType={selectedFloorType}
            isPlotCategory={isPlotCategory}
          />

          <div className={isAddingNewFloor || selectedFloorType === 'OpenPlot' ? "w-full" : "grid grid-cols-2 gap-3"}>
            <RenterSection
              t={t}
              editingFloorForm={editingFloorForm}
              setEditingFloorForm={setEditingFloorForm}
              formErrors={formErrors}
              setFormErrors={setFormErrors}
              handleOpenRenterManagement={handleOpenRenterManagement}
              isOperationLoading={isOperationLoading}
            />

            {!isAddingNewFloor && selectedFloorType !== 'OpenPlot' && (
              <FieldWrapper label={t('floor.updateBuildingPermission') || 'Update Building Permission?'} htmlFor="floor-update-building-permission">
                <SearchSelect
                  id="floor-update-building-permission"
                  name="updateBuildingPermission"
                  menuPlacement="top"
                  options={[
                    { label: t('floor.no') || 'No', value: 'No' },
                    { label: t('floor.yes') || 'Yes', value: 'Yes' },
                  ]}
                  value={editingFloorForm.updateBuildingPermission || 'No'}
                  onChange={(_name, value) => {
                    setEditingFloorForm({ ...editingFloorForm, updateBuildingPermission: value });
                    if (value === 'Yes') {
                      const floorDetailsId = editingFloorForm.propertyDetailsId || editingFloorForm.id;

                      const pathSegments = pathname.split('/').filter(Boolean);
                      const qdeIndex = pathSegments.indexOf('QuickDataEntry');
                      const baseTabPath =
                        qdeIndex !== -1 && pathSegments[qdeIndex + 1]
                          ? `/${pathSegments.slice(0, qdeIndex + 2).join('/')}`
                          : `/${pathSegments.slice(0, -1).join('/')}`;

                      const tabPath = `${baseTabPath}/Building`;
                      const searchParamsObj = new URLSearchParams(searchParams.toString());
                      searchParamsObj.set('activeScope', 'Floor');
                      searchParamsObj.set('activeFloorId', String(floorDetailsId || ''));

                      router.push(`${tabPath}?${searchParamsObj.toString()}`);
                    }
                  }}
                  placeholder={t('floor.select') || 'Select'}
                  className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </FieldWrapper>
            )}
          </div>

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
            wardNo={wardNo || searchParams?.get('wardNo') || undefined}
            propertyNo={propertyNo || searchParams?.get('propertyNo') || undefined}
            partitionNo={partitionNo || searchParams?.get('partitionNo') || undefined}
            propertyId={propertyId || (pathname?.match(/QuickDataEntry\/([^/]+)/)?.[1])}
          />

          <div className={`mt-4 flex items-center ${selectedFloor ? 'justify-between' : 'justify-end'} gap-4 ${selectedFloorType === 'OpenPlot' ? 'md:col-span-4' : 'md:col-span-3'}`}>
            {Boolean(selectedFloor) && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 hover:text-blue-700 transition-colors select-none">
                <input
                  type="checkbox"
                  id="floor-mode-toggle-checkbox"
                  checked={isAddingNewFloor}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    confirm({
                      title: checked
                        ? (t('floor.confirmSwitchToAddTitle') || 'Duplicate Floor Details?')
                        : (t('floor.confirmSwitchToUpdateTitle') || 'Switch to Update Mode?'),
                      description: checked
                        ? (t('floor.confirmSwitchToAddDesc') || 'Are you sure you want to duplicate the selected floor? All floor details will be copied to a new floor record.')
                        : (t('floor.confirmSwitchToUpdateDesc') || 'Are you sure you want to switch back to Update Floor mode?'),
                      confirmText: t('floor.yes') || 'Yes',
                      cancelText: t('floor.no') || 'No',
                      onConfirm: () => {
                        setIsAddingNewFloor?.(checked);
                        if (checked) {
                          setEditingFloorForm((prev) => ({
                            ...prev,
                            id: undefined,
                            propertyDetailsId: undefined,
                          }));
                        } else if (selectedFloor) {
                          const propDetId = selectedFloor.propertyDetailsId ?? (typeof selectedFloor.id === 'number' ? selectedFloor.id : undefined);
                          setEditingFloorForm((prev) => ({
                            ...prev,
                            id: selectedFloor.id,
                            propertyDetailsId: propDetId,
                          }));
                        }
                      },
                    });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span>{t('floor.addNewMode') || 'Duplicate Floor Mode'}</span>
              </label>
            )}

            <div className="flex items-center gap-2">
              <Button
                id="floor-save-btn"
                onClick={onSave}
                isLoading={isOperationLoading}
                disabled={isOperationLoading || !isFormValid}
                className="px-6 h-9 text-xs font-bold shadow-md rounded-lg transition-all duration-300 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:pointer-events-none"
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    const taxableInput = document.getElementById('floor-is-taxable');
                    if (taxableInput) {
                      taxableInput.focus();
                    }
                  }
                }}
              >
                {(isAddingNewFloor || !selectedFloor) ? (t('floor.add') || 'Add') : (t('floor.updateFloor') || 'Update')}
              </Button>
              {(isOperationLoading || !isFormValid) && (
                <span
                  tabIndex={0}
                  onFocus={(e) => {
                    e.preventDefault();
                    const lengthEl = document.getElementById('plot-length');
                    if (lengthEl) {
                      lengthEl.focus();
                    }
                  }}
                  className="sr-only"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default FloorForm;
