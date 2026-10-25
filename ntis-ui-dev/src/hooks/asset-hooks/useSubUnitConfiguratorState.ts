/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { partitionRoomsAndOpenSpaces, applyFieldChange } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/subunit-form.utils';

function normalizeUnitFormData(unit: any, globalFormData: any) {
  const deptId = unit.departmentId ? String(unit.departmentId) : '';

  const rInfo = unit.rentInformation || {};
  // renterDetails is List<AssetLeaseRentDetailsDto> from GET /api/ManageSubUnits/{id}
  // Fields: shopName, shopRegionalName, tenantName, tenantRegionalName, tenantMobile,
  //         tenantEmail, gSTNo, leaseType, leaseStartDate, leaseEndDate, paymentFrequency,
  //         rentAmount, securityDeposit, depositType
  const leaseInfo = Array.isArray(unit.renterDetails)
    ? (unit.renterDetails[0] || {})
    : (unit.renterDetails || unit.leaseRentDetails || (unit.leaseRentDetailsList && unit.leaseRentDetailsList[0]) || {});

  const isRenter = !!(
    unit.isRenter ||
    unit.isRented ||
    unit.rentType ||
    rInfo.leaseRentType ||
    unit.renterName ||
    unit.tenantName ||
    leaseInfo.tenantName ||
    leaseInfo.leaseType
  );

  const rentType = unit.rentType || rInfo.leaseRentType || leaseInfo.leaseType || (isRenter ? 'Rent' : '');
  const leaseStartRaw = unit.leaseStart || rInfo.leaseStart || leaseInfo.leaseStartDate;
  const leaseStart = leaseStartRaw ? String(leaseStartRaw).split('T')[0] : '';
  
  const leaseEndRaw = unit.leaseEnd || rInfo.leaseEnd || leaseInfo.leaseEndDate;
  const leaseEnd = leaseEndRaw ? String(leaseEndRaw).split('T')[0] : '';
  
  const duration = unit.duration || rInfo.duration || leaseInfo.duration || '';
  const rentFreq = unit.rentFreq || rInfo.rentFrequency || leaseInfo.paymentFrequency || '';
  
  const rentAmount = unit.rentAmount !== undefined && unit.rentAmount !== null && unit.rentAmount !== ''
    ? unit.rentAmount
    : (rInfo.rentAmount !== undefined && rInfo.rentAmount !== null ? rInfo.rentAmount : (leaseInfo.rentAmount !== undefined && leaseInfo.rentAmount !== null ? leaseInfo.rentAmount : ''));
    
  const securityDeposit = unit.securityDeposit !== undefined && unit.securityDeposit !== null && unit.securityDeposit !== ''
    ? unit.securityDeposit
    : (rInfo.securityDeposit !== undefined && rInfo.securityDeposit !== null ? rInfo.securityDeposit : (leaseInfo.securityDeposit !== undefined && leaseInfo.securityDeposit !== null ? leaseInfo.securityDeposit : ''));
    
  const depositType = unit.depositType || rInfo.depositType || leaseInfo.depositType || '';
  const agreementId =
    unit.agreementId ||
    unit.agreementNo ||
    rInfo.agreementId ||
    rInfo.agreementNo ||
    leaseInfo.agreementId ||
    leaseInfo.AgreementId ||
    leaseInfo.agreementNo ||
    leaseInfo.AgreementNo ||
    '';

  const aadhaar = unit.aadhaar || unit.aadhaarCardNo || leaseInfo.tenantAadhaarNo || unit.tenantAadhaarNo || '';
  const pan = unit.pan || unit.panCardNo || leaseInfo.tenantPanCardNo || unit.tenantPanCardNo || '';
  const renterName = unit.renterName || unit.tenantName || leaseInfo.tenantName || leaseInfo.TenantName || leaseInfo.renterName || '';
  const renterNameLocal =
    unit.renterNameLocal ||
    unit.RenterNameLocal ||
    unit.tenantRegionalName ||
    unit.TenantRegionalName ||
    rInfo.renterNameLocal ||
    rInfo.tenantRegionalName ||
    leaseInfo.tenantRegionalName ||
    leaseInfo.TenantRegionalName ||
    leaseInfo.renterNameLocal ||
    leaseInfo.RenterNameLocal ||
    leaseInfo.tenantNameLocal ||
    leaseInfo.TenantNameLocal ||
    '';
  // shopName and shopRegionalName come from AssetLeaseRentDetailsDto
  const unitName =
    unit.shopUnitName ||
    unit.ShopUnitName ||
    unit.unitName ||
    unit.UnitName ||
    unit.shopName ||
    unit.ShopName ||
    rInfo.shopName ||
    rInfo.ShopName ||
    leaseInfo.shopName ||
    leaseInfo.ShopName ||
    '';
  const unitNameLocal =
    unit.shopUnitNameLocal ||
    unit.ShopUnitNameLocal ||
    unit.shopRegionalName ||
    unit.ShopRegionalName ||
    unit.unitNameLocal ||
    unit.UnitNameLocal ||
    rInfo.shopRegionalName ||
    rInfo.ShopRegionalName ||
    leaseInfo.shopRegionalName ||
    leaseInfo.ShopRegionalName ||
    leaseInfo.shopUnitNameLocal ||
    leaseInfo.ShopUnitNameLocal ||
    '';
  const mobileNo = unit.mobileNo || leaseInfo.tenantMobile || unit.tenantMobile || '';
  const emailId = unit.emailId || leaseInfo.tenantEmail || unit.tenantEmail || '';
  // GSTNo from C# serializes to gSTNo in JSON camelCase
  const gstNo = unit.gstNo || leaseInfo.gSTNo || leaseInfo.gstNo || leaseInfo.GSTNo || '';
  const tenantAddress =
    unit.tenantAddress ||
    unit.TenantAddress ||
    rInfo.tenantAddress ||
    rInfo.TenantAddress ||
    leaseInfo.tenantAddress ||
    leaseInfo.TenantAddress ||
    '';

  const asstYear = unit.asstYear || unit.assessmentYear || globalFormData.asstYear || globalFormData.assessmentYear || '';
  const conYear = unit.conYear || unit.constructionYear || globalFormData.conYear || globalFormData.constructionYear || '';

  const propertyNo =
    unit.propertyNo ||
    unit.PropertyNo ||
    unit.details?.propertyNo ||
    globalFormData?.propertyNo ||
    globalFormData?.propertyNumber ||
    '';
  const unitNo =
    unit.unitNo ||
    unit.UnitNo ||
    unit.details?.unitNo ||
    '';

  const partitionNo =
    unit.partitionNo ||
    unit.PartitionNo ||
    unit.details?.partitionNo ||
    '';

  const mpmsNo =
    unit.mpmsNo ||
    unit.MpmsNo ||
    unit.MPMSNo ||
    unit.details?.mpmsNo ||
    unit.details?.MpmsNo ||
    unit.details?.MPMSNo ||
    '';

  return {
    ...unit,
    propertyNo,
    unitNo,
    partitionNo,
    mpmsNo,
    departmentId: deptId,
    departmentName:
      deptId && unit.departmentName && isNaN(Number(unit.departmentName)) ? unit.departmentName : '',
    isRenter,
    isRented: isRenter,
    rentType,
    leaseStart,
    leaseEnd,
    duration,
    rentFreq,
    rentAmount,
    securityDeposit,
    depositType,
    agreementId,
    agreementNo: agreementId,
    aadhaar,
    pan,
    renterName,
    renterNameLocal,
    unitName,
    unitNameLocal,
    mobileNo,
    emailId,
    gstNo,
    tenantAddress,
    asstYear,
    conYear,
  };
}

/** Owns the configurator's core form/room/open-space/drawer state, including
 * the initial seed from `unit` and the resync-on-unit-identity-change effect
 * (keyed by unit.dbId/id/unitNumber so switching to a different unit resets
 * in-progress edits, while re-renders of the same unit don't). */
export function useSubUnitConfiguratorState(unit: any, globalFormData: any) {
  const [formData, setFormData] = useState<any>(() => normalizeUnitFormData(unit, globalFormData));

  const [roomsList, setRoomsList] = useState<any[]>(
    () => partitionRoomsAndOpenSpaces(unit?.rooms).roomsList
  );
  const [openSpacesList, setOpenSpacesList] = useState<any[]>(
    () => partitionRoomsAndOpenSpaces(unit?.rooms).openSpacesList
  );
  const [isRoomsDrawerOpen, setIsRoomsDrawerOpen] = useState(false);
  const [isOpenSpacesDrawerOpen, setIsOpenSpacesDrawerOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<'Construction' | 'Open Space'>(() => {
    if (openSpacesList.length > 0 && roomsList.length === 0) {
      return 'Open Space';
    }
    return 'Construction';
  });

  useEffect(() => {
    setTimeout(() => { setFormData(normalizeUnitFormData(unit, globalFormData)); }, 0);
    const { roomsList: nextRooms, openSpacesList: nextOpenSpaces } = partitionRoomsAndOpenSpaces(
      unit?.rooms
    );
    setTimeout(() => { setRoomsList(nextRooms); }, 0);
    setTimeout(() => { setOpenSpacesList(nextOpenSpaces); }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    setFormData((prev: any) => applyFieldChange(prev, name, value, type));

    const lowerName = name.toLowerCase();
    const isTitleCased = lowerName.includes('name') || lowerName.includes('owner') || lowerName.includes('person');
    
    if (start !== null && end !== null && isTitleCased && type !== 'email') {
      requestAnimationFrame(() => {
        try {
          target.setSelectionRange(start, end);
        } catch { }
      });
    }
  };

  return {
    formData, setFormData,
    roomsList, setRoomsList,
    openSpacesList, setOpenSpacesList,
    isRoomsDrawerOpen, setIsRoomsDrawerOpen,
    isOpenSpacesDrawerOpen, setIsOpenSpacesDrawerOpen,
    submissionType, setSubmissionType,
    handleChange,
  };
}
