'use client';

import { LoadingState } from '@/components/common/LoadingState';
import { SubUnitBasicInfoCard } from './SubUnitBasicInfoCard';
import { SubUnitRentInfoCard } from './SubUnitRentInfoCard';
import { SubUnitFloorConstructionCard } from './SubUnitFloorConstructionCard';
import { SubUnitDocumentsPanel } from './SubUnitDocumentsPanel';
import { SubUnitConfiguratorBodyProps } from '@/types/asset/sub-units.types';

export function SubUnitConfiguratorBody({
  loading,
  occupantFieldProps,
  handleRenterToggle,
  departments,
  sectionTitle,
  showRentSection,
  isRenter,
  formData,
  setFormData,
  handleChange,
  handleFloorSelect,
  handleUseTypeSelect,
  floorSelectOptions,
  dropdownOptions,
  subFloorOptions,
  dynamicSubUseTypes,
  submissionType,
  setSubmissionType,
  roomsList,
  setRoomsList,
  openSpacesList,
  setOpenSpacesList,
  setIsRoomsDrawerOpen,
  setIsOpenSpacesDrawerOpen,
  area,
  inp,
  t,
}: SubUnitConfiguratorBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative [&_input:not(.boxed-digit-input)]:!h-7 [&_input:not(.boxed-digit-input)]:!text-[11px] [&_input:not(.boxed-digit-input)]:!font-bold [&_input:not(.boxed-digit-input)]:!rounded-md [&_input:not(.boxed-digit-input)]:!px-2 [&_label]:text-[11px] [&_label]:mb-1 [&_label]:!font-bold [&_span[id$=-label]]:text-[11px] [&_span[id$=-label]]:!font-bold [&_span.text-gray-700]:!font-bold [&_button[role=combobox]]:!px-2 [&_button[role=combobox]]:!h-7 [&_button[role=combobox]]:!text-[11px] [&_button[role=combobox]]:!font-bold [&_button[role=combobox]]:!rounded-md [&_button[role=combobox]_span]:!text-[11px] [&_button[role=combobox]_span]:!font-bold">
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <LoadingState
            message={t('loading.details')}
            minHeight=""
            className="gap-2"
            iconClassName="size-8 text-blue-500 animate-spin"
            messageClassName="text-xs font-bold text-slate-500 uppercase tracking-widest"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-4 items-start">
        {/* Left Column (Forms) */}
        <div className="space-y-3">
          {/* ════════════════════════════════════════════
          TYPE-AWARE BASIC INFORMATION
          Fields change based on unit type:
          Flat → KYC fields  |  Shop → GST/ShopAct
          Office → Company   |  Department → Staff
      ════════════════════════════════════════════ */}
          <SubUnitBasicInfoCard
            {...occupantFieldProps}
            handleRenterToggle={handleRenterToggle}
            departments={departments}
            sectionTitle={sectionTitle}
            showRentSection={showRentSection}
            isRenter={isRenter}
          />

          {/* Departments are internal allocations — they don't pay rent */}
          {showRentSection && isRenter && <SubUnitRentInfoCard {...occupantFieldProps} />}

          {/* ════════════════════════════════════════════
          FLOOR & CONSTRUCTION DETAILS
          User selects floor and enters construction
          details for this specific sub-unit.
          Capital Value is auto-calculated from area.
      ════════════════════════════════════════════ */}
          <SubUnitFloorConstructionCard
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleFloorSelect={handleFloorSelect}
            handleUseTypeSelect={handleUseTypeSelect}
            floorSelectOptions={floorSelectOptions}
            dropdownOptions={dropdownOptions}
            subFloorOptions={subFloorOptions}
            dynamicSubUseTypes={dynamicSubUseTypes}
            submissionType={submissionType}
            setSubmissionType={setSubmissionType}
            roomsList={roomsList}
            setRoomsList={setRoomsList}
            openSpacesList={openSpacesList}
            setOpenSpacesList={setOpenSpacesList}
            setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
            setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
            area={area}
            inp={inp}
            t={t}
          />
        </div>{' '}
        {/* end Left Column */}
        {/* Right Column (Media & Documents) */}
        <div className="space-y-3 flex flex-col w-full">
          <div className="subunit-media-panel w-full">
            <div />
          </div>

          {/* Unit Documents Section */}
          <SubUnitDocumentsPanel formData={formData} />
        </div>
      </div>
    </div>
  );
}
