'use client';

import type { SubUnitDetailedConfiguratorProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

import React from 'react';
import { useNAAssetForm } from '../NAAssetFormContext';
import { MediaPanelProvider } from '@/hooks/ptis/photoplan/useMediaPanelVisibility';
import { useTranslations } from 'next-intl';
import { useSubUnitMediaStaging } from '@/hooks/asset-hooks/useSubUnitMediaStaging';
import { useSubUnitFloorSelection } from '@/hooks/asset-hooks/useSubUnitFloorSelection';
import { useSubUnitRenterInlineEdit } from '@/hooks/asset-hooks/useSubUnitRenterInlineEdit';
import { useSubUnitSave } from '@/hooks/asset-hooks/useSubUnitSave';
import { useSubUnitConfiguratorState } from '@/hooks/asset-hooks/useSubUnitConfiguratorState';
import { SubUnitConfiguratorHeader } from './SubUnitConfiguratorHeader';
import { SubUnitConfiguratorFooter } from './SubUnitConfiguratorFooter';
import { SubUnitConfiguratorBody } from './SubUnitConfiguratorBody';
import { SubUnitConfiguratorDrawers } from './SubUnitConfiguratorDrawers';
import { calculateSubUnitArea, resolveUnitTypeInfo } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/subunit-form.utils';



export function SubUnitDetailedConfigurator({
  unit,
  parentBuildingName,
  onSave,
  onCancel,
  floors: propFloors = [],
  dropdownOptions: propDropdownOptions = undefined,
  suppressToast = false,
}: SubUnitDetailedConfiguratorProps) {
  const t = useTranslations('addAssetForm');
    const { formData: globalFormData, subunitFiles } = useNAAssetForm();
  const assetId = String(unit?.id || unit?.dbId || '');
  const staged = assetId ? (subunitFiles as Record<string, unknown> | undefined)?.[assetId] : undefined;

  const {
    formData, setFormData,
    roomsList, setRoomsList,
    openSpacesList, setOpenSpacesList,
    isRoomsDrawerOpen, setIsRoomsDrawerOpen,
    isOpenSpacesDrawerOpen, setIsOpenSpacesDrawerOpen,
    submissionType, setSubmissionType,
    handleChange,
  } = useSubUnitConfiguratorState(unit, globalFormData);

  const {
    stagedFiles,
    initialPhotoSlots,
    initialPhotos,
    isFetchingDb,
    handleFileStaged,
    handleFileUnstaged,
  } = useSubUnitMediaStaging(unit, staged);

  const {
    handleLocalNameChange,
    handleLocalNameBlur,
    handleLocalRenterNameChange,
    handleLocalRenterNameBlur,
    handleRenterToggle,
    handleChangeWithTransliteration,
  } = useSubUnitRenterInlineEdit(formData, setFormData, t, handleChange);

  const {
    loading,
    dropdownOptions,
    departments,
    dynamicSubUseTypes,
    subFloorOptions,
    floorSelectOptions,
    handleFloorSelect,
    handleUseTypeSelect,
  } = useSubUnitFloorSelection(unit, globalFormData, propFloors, propDropdownOptions, formData, setFormData);

  // Select all text when user focuses a number field — lets them immediately type a replacement value
  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  const area = calculateSubUnitArea(roomsList, openSpacesList, formData.carpetAreaSqFeet);

  const { handleSaveClick } = useSubUnitSave(
    formData,
    roomsList,
    openSpacesList,
    area,
    submissionType,
    stagedFiles,
    suppressToast,
    t,
    onSave
  );

  const errors = React.useMemo(() => {
    const e: Record<string, string> = {};
    if (formData.mobileNo && formData.mobileNo.length !== 10) e.mobileNo = t('subunit.validation.mobileLength');
    if (formData.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) e.emailId = t('subunit.validation.emailInvalid');
    if (formData.renterName) {
      if (formData.renterName.startsWith(' ')) e.renterName = t('subunit.validation.renterSpace');
      else if (!/^[A-Za-z][A-Za-z\s]*$/.test(formData.renterName)) e.renterName = t('subunit.validation.renterInvalid');
    }
    if (formData.aadhaar && !/^[0-9]{12}$/.test(formData.aadhaar)) e.aadhaar = t('subunit.validation.aadhaarLength');
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) e.pan = t('subunit.validation.panInvalid');
    if (formData.gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo.toUpperCase())) e.gstNo = t('subunit.validation.gstInvalid');
    
    const alphaNumRegex = /^[A-Za-z0-9\s/-]+$/;
    if (formData.propertyNo && !alphaNumRegex.test(formData.propertyNo)) e.propertyNo = t('subunit.validation.propertyNoInvalid');
    if (formData.partitionNo && !alphaNumRegex.test(formData.partitionNo)) e.partitionNo = t('subunit.validation.partitionNoInvalid');
    if (formData.surveyNo && !alphaNumRegex.test(formData.surveyNo)) e.surveyNo = t('subunit.validation.csnInvalid');
    
    if (formData.leaseStart && formData.leaseEnd) {
      const start = new Date(formData.leaseStart);
      const end = new Date(formData.leaseEnd);
      if (start >= end) e.leaseEnd = t('subunit.validation.leaseEndAfterStart');
    }
    
    return e;
  }, [formData, t]);

  const inp = 'h-7 text-[11px] !px-2 !py-0.5 !rounded-md';

  const { isShop, isOffice, isRoom, isDepartment, sectionTitle, showRentSection, isRenter } =
    resolveUnitTypeInfo(unit, formData, t);

  const occupantFieldProps = {
    formData,
    setFormData,
    errors,
    handleChange: handleChangeWithTransliteration,
    handleLocalNameChange,
    handleLocalNameBlur,
    handleLocalRenterNameChange,
    handleLocalRenterNameBlur,
    selectOnFocus,
    isShop,
    isOffice,
    isRoom,
    isDepartment,
    inp,
    t,
  };

  return (
    <MediaPanelProvider initialVisible={true}>
      <style dangerouslySetInnerHTML={{ __html: `
        .subunit-media-panel .group {
          min-height: 160px !important;
          max-height: 160px !important;
        }
      `}} />
      <div className="flex flex-col h-full overflow-hidden bg-slate-50">
        <SubUnitConfiguratorHeader
          parentBuildingName={parentBuildingName}
          unitNumber={formData.unitNumber}
          onCancel={onCancel}
          t={t}
        />
        



        <SubUnitConfiguratorBody
          loading={loading}
          occupantFieldProps={occupantFieldProps}
          handleRenterToggle={handleRenterToggle}
          departments={departments}
          sectionTitle={sectionTitle}
          showRentSection={showRentSection}
          isRenter={isRenter}
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
          initialPhotoSlots={initialPhotoSlots}
          initialPhotos={initialPhotos}
          isFetchingDb={isFetchingDb}
          handleFileStaged={handleFileStaged}
          handleFileUnstaged={handleFileUnstaged}
        />

        <SubUnitConfiguratorFooter onCancel={onCancel} onSaveClick={handleSaveClick} t={t} />

        <SubUnitConfiguratorDrawers
          isRoomsDrawerOpen={isRoomsDrawerOpen}
          setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
          isOpenSpacesDrawerOpen={isOpenSpacesDrawerOpen}
          setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
          formData={formData}
          setFormData={setFormData}
          roomsList={roomsList}
          setRoomsList={setRoomsList}
          openSpacesList={openSpacesList}
          setOpenSpacesList={setOpenSpacesList}
          dropdownOptions={dropdownOptions}
        />
      </div>
    </MediaPanelProvider>
  );
}
