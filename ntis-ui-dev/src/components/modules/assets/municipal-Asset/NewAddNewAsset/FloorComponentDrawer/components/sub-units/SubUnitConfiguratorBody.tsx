'use client';

import { LoadingState } from '@/components/common/LoadingState';
import { NASubUnitMedia } from './NASubUnitMedia';
import { SubUnitBasicInfoCard } from '../../../sub-units/SubUnitBasicInfoCard';
import { SubUnitRentInfoCard } from '../../../sub-units/SubUnitRentInfoCard';
import { SubUnitFloorConstructionCard } from '../../../sub-units/SubUnitFloorConstructionCard';
import { SubUnitDocumentsPanel } from '../../../sub-units/SubUnitDocumentsPanel';
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
  initialPhotoSlots,
  initialPhotos,
  isFetchingDb,
  handleFileStaged,
  handleFileUnstaged,
  handleFileReplaced,
  duplicateTableNode,
  roomsTableNode,
  onAddFloorClick,
  onCancelEditDuplicate,
  isEditingDuplicate,
  duplicateEntriesCount,
}: SubUnitConfiguratorBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar relative">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Overrides to make all configuration forms match NewAddNewAsset styles */
        .new-add-asset-configurator label {
          font-size: 9.5px !important;
          font-weight: 700 !important;
          color: #475569 !important; /* text-slate-600 */
          margin-bottom: 0.125rem !important;
          text-transform: capitalize !important;
        }
        .new-add-asset-configurator select,
        .new-add-asset-configurator input:not([type="checkbox"]):not([type="radio"]):not(.absolute),
        .new-add-asset-configurator button[role="combobox"] {
          height: 25px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #0f172a !important; /* text-slate-900 */
          border-color: #e2e8f0 !important; /* border-slate-200 */
          border-radius: 0.375rem !important; /* rounded-md */
          background-color: #ffffff !important;
          padding-top: 0.125rem !important;
          padding-bottom: 0.125rem !important;
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
        .new-add-asset-configurator input:read-only {
          background-color: #f8fafc !important; /* slate-50 */
          color: #64748b !important;
        }
        .new-add-asset-configurator button[role="combobox"] {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: relative !important;
          padding-right: 1.5rem !important;
        }
        .new-add-asset-configurator button[role="combobox"] span {
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #0f172a !important;
        }
        .new-add-asset-configurator button[role="combobox"] svg {
          width: 9px !important;
          height: 9px !important;
          position: absolute !important;
          right: 8px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
        }
        /* Card headers styled like NewAddNewAsset */
        .new-add-asset-configurator div[class*="CardHeader"] {
          background: #ffffff !important;
          background-image: none !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #f1f5f9 !important; /* border-slate-100 */
          border-radius: 0px !important;
          padding-top: 0.375rem !important;
          padding-bottom: 0.375rem !important;
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
          margin-top: 0px !important;
          margin-left: 0px !important;
          margin-right: 0px !important;
          margin-bottom: 0.5rem !important;
          box-shadow: none !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          height: auto !important;
        }
        /* Icon container inside card header */
        .new-add-asset-configurator div[class*="CardHeader"] div[class*="bg-[#1d4ed8]"],
        .new-add-asset-configurator div[class*="CardHeader"] div[class*="bg-blue-500/20"] {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: 1.25rem !important; /* w-5 */
          height: 1.25rem !important; /* h-5 */
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .new-add-asset-configurator div[class*="CardHeader"] svg {
          color: #2563eb !important;
          width: 14px !important;
          height: 14px !important;
        }
        /* Title typography inside card header */
        .new-add-asset-configurator h3[class*="CardTitle"],
        .new-add-asset-configurator span[class*="CardTitle"] {
          font-size: 11.5px !important;
          font-weight: 900 !important;
          color: #101b87 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
        }
        /* Card container overrides */
        .new-add-asset-configurator div[class*="Card"] {
          background-color: #ffffff !important;
          border-radius: 0.75rem !important; /* rounded-xl */
          border-width: 1px !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          padding: 0px !important;
          overflow: hidden !important;
        }
        .new-add-asset-configurator div[class*="CardContent"] {
          padding: 0.75rem !important;
        }
      `}} />

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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)] gap-4 items-start max-w-full">
        {/* Left Column (Forms) */}
        <div className="space-y-3 min-w-0 max-w-full">
          <SubUnitBasicInfoCard
            {...occupantFieldProps}
            handleRenterToggle={handleRenterToggle}
            departments={departments}
            sectionTitle={sectionTitle}
            showRentSection={showRentSection}
            isRenter={isRenter}
          />

          {showRentSection && isRenter && <SubUnitRentInfoCard {...occupantFieldProps} />}

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
            onAddFloorClick={onAddFloorClick}
            onCancelEditDuplicate={onCancelEditDuplicate}
            isEditingDuplicate={isEditingDuplicate}
            duplicateEntriesCount={duplicateEntriesCount}
          />

          {duplicateTableNode}

          {roomsTableNode}
        </div>{' '}
        {/* end Left Column */}
        {/* Right Column (Media & Documents) */}
        <div className="space-y-3 flex flex-col">
          <div className="subunit-media-panel w-full lg:h-[clamp(430px,52vh,520px)] lg:min-h-[430px] flex flex-col">
            <NASubUnitMedia
              initialPhotoSlots={initialPhotoSlots}
              initialPhotos={initialPhotos}
              isFetchingDb={isFetchingDb}
              onFileStaged={handleFileStaged}
              onFileUnstaged={handleFileUnstaged}
              onFileReplaced={handleFileReplaced}
            />
          </div>

          {/* Unit Documents Section */}
          <SubUnitDocumentsPanel formData={formData} />
        </div>
      </div>
    </div>
  );
}
