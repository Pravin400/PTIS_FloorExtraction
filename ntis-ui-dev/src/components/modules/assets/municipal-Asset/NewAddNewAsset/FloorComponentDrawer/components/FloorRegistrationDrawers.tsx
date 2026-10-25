'use client';


import { RoomWiseSubmissionDrawer } from '../../sub-units/RoomWiseSubmissionDrawer';
import { OpenSpaceDrawer } from '../../sub-units/OpenSpaceDrawer';
import { AmenityDrawer } from '../../sub-units/AmenityDrawer';
import { RenterDetailsDrawer } from './RenterDetailsDrawer';
import type { FloorRegistrationDrawersProps } from '@/types/asset/floor-details.types';

export function FloorRegistrationDrawers({
  formState,
  setFormState,
  dropdownOptions,
  isRenterDrawerOpen,
  setIsRenterDrawerOpen,
  isDrawerOpen,
  setIsDrawerOpen,
  roomData,
  handleSaveRooms,
  isOpenSpaceDrawerOpen,
  setIsOpenSpaceDrawerOpen,
  openSpaceData,
  handleSaveSpaces,
  isAmenityDrawerOpen,
  setIsAmenityDrawerOpen,
  amenityData,
  handleSaveAmenities,
}: FloorRegistrationDrawersProps) {
  return (
    <>
      <RoomWiseSubmissionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        unit={{ unitNumber: `New Floor`, rooms: roomData }}
        onSaveRooms={handleSaveRooms}
        roomTypes={dropdownOptions?.roomTypes}
      />

      <OpenSpaceDrawer
        isOpen={isOpenSpaceDrawerOpen}
        onClose={() => setIsOpenSpaceDrawerOpen(false)}
        spaces={openSpaceData}
        onSaveSpaces={handleSaveSpaces}
      />

      <AmenityDrawer
        isOpen={isAmenityDrawerOpen}
        onClose={() => setIsAmenityDrawerOpen(false)}
        amenities={amenityData}
        onSaveAmenities={handleSaveAmenities}
      />

      <RenterDetailsDrawer
        isOpen={isRenterDrawerOpen}
        onClose={() => {
          setIsRenterDrawerOpen(false);
        }}
        renterData={{
          renterNameEnglish: formState.renterNameEnglish,
          renterNameLocal: formState.renterNameLocal,
          agreementId: formState.agreementId || formState.agreementNo || '',
          agreementNo: formState.agreementNo || formState.agreementId || '',
          agreementDate: formState.agreementDate,
          agreementFromDate: formState.agreementFromDate,
          agreementToDate: formState.agreementToDate,
          rentMonthly: formState.rentMonthly,
          rentYearly: formState.rentYearly,
          taxLiability: formState.taxLiability,
          rentType: formState.rentType,
          duration: formState.duration,
          rentFreq: formState.rentFreq,
          securityDeposit: formState.securityDeposit,
          depositType: formState.depositType,
          mobileNo: formState.mobileNo,
          emailId: formState.emailId,
          aadhaar: formState.aadhaar,
          pan: formState.pan,
          tenantAddress: formState.tenantAddress || '',
        }}
        onSave={(data) => {
          setFormState((prev: Record<string, unknown>) => ({
            ...prev,
            ...data,
            agreementId: data.agreementId || data.agreementNo || prev.agreementId || '',
            agreementNo: data.agreementNo || data.agreementId || prev.agreementNo || '',
          }));
        }}
      />
    </>
  );
}
