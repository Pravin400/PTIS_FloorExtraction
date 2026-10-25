'use client';

import { FloorClassificationFields } from './FloorClassificationFields';
import { FloorRenterAndRoomsFields } from './FloorRenterAndRoomsFields';
import { FloorAreaFields } from './FloorAreaFields';
import { FloorRegistrationActionButtons } from './FloorRegistrationActionButtons';
import type { FloorRegistrationFormFieldsProps } from '@/types/asset/floor-details.types';

export function FloorRegistrationFormFields(props: FloorRegistrationFormFieldsProps) {
  const {
    t,
    editingId,
    onCancelEdit,
    onAddFloor,
    isLoading,
    formState,
    setFormState,
    dropdownOptions,
    subFloorOptions,
    subUseTypeOptions,
    setIsRenterDrawerOpen,
    handleRoomsDrawerOpen,
    handleOpenSpacesDrawerOpen,
    isDuplicateFloorMode,
    onToggleDuplicateMode,
    sourceFloor,
  } = props;

  return (
    <div className="bg-white p-3 md:p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 [&_label]:!text-[10px] [&_label]:!font-bold [&_label]:!text-slate-700 [&_label]:mb-0.5 [&_input]:!px-2 [&_input]:!py-0.5 [&_input]:!h-7.5 [&_input]:!text-[10.5px] [&_input]:!font-bold [&_button[role=combobox]]:!px-2 [&_button[role=combobox]]:!h-7.5 [&_button[role=combobox]]:!text-[10.5px] [&_button[role=combobox]_span]:!text-[10.5px]">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <h4 className="text-[12.5px] font-bold text-[#101b87] flex items-center gap-2">
          <div className="w-1.5 h-3.5 bg-blue-600 rounded-full"></div>
          <span>
            {editingId
              ? (t.has('floorDetails.editFloor') ? t('floorDetails.editFloor', { id: editingId }) : `Edit Floor #${editingId}`)
              : (t.has('floorDetails.addFloorDetails') ? t('floorDetails.addFloorDetails') : 'Add Floor Details')}
          </span>
        </h4>
        {editingId && (
          <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
            {t.has('floorDetails.editingFloor') ? t('floorDetails.editingFloor', { id: editingId }) : `Editing Floor #${editingId}`}
          </span>
        )}
      </div>

      {/* 5-column grid across 3 lines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
        <FloorClassificationFields
          t={t}
          formState={formState}
          setFormState={setFormState}
          dropdownOptions={dropdownOptions}
          subFloorOptions={subFloorOptions}
          subUseTypeOptions={subUseTypeOptions}
        />
        <FloorRenterAndRoomsFields
          t={t}
          formState={formState}
          setFormState={setFormState}
          setIsRenterDrawerOpen={setIsRenterDrawerOpen}
          handleRoomsDrawerOpen={handleRoomsDrawerOpen}
          handleOpenSpacesDrawerOpen={handleOpenSpacesDrawerOpen}
        />
        <FloorAreaFields
          t={t}
          formState={formState}
          handleRoomsDrawerOpen={handleRoomsDrawerOpen}
          handleOpenSpacesDrawerOpen={handleOpenSpacesDrawerOpen}
        />
        <FloorRegistrationActionButtons
          t={t}
          editingId={editingId}
          onCancelEdit={onCancelEdit}
          onAddFloor={onAddFloor}
          isLoading={isLoading}
          isDuplicateFloorMode={isDuplicateFloorMode}
          onToggleDuplicateMode={onToggleDuplicateMode}
          sourceFloor={sourceFloor}
        />
      </div>
    </div>
  );
}
