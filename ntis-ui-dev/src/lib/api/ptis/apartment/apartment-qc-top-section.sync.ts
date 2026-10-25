import {
  getPropertySocietyDetails,
  updatePropertySocietyDetails,
} from '@/lib/api/property-society.service';
import {
  getPropertyKycById,
  updatePropertyKyc,
} from '@/lib/api/property-kyc.service';
import type { KycDetails } from '@/types/property-kyc.types';
import type { UpdatePropertySocietyDetailsDto } from '@/types/property-society-details.types';
import type { UpdateApartmentQcTopSectionPayload } from './apartment-qc-top-section.service';

export async function syncSocietyAndKycDetails(
  numPropId: number,
  payload: UpdateApartmentQcTopSectionPayload
): Promise<{ success: boolean; error?: string }> {
  if (isNaN(numPropId) || numPropId <= 0) return { success: false, error: 'Invalid property ID' };

  let societySuccess = false;

  try {
    const existingSoc = await getPropertySocietyDetails(numPropId).catch(() => null);

    const builderVal =
      payload.builderName !== undefined && payload.builderName !== null
        ? payload.builderName
        : payload.occupierName !== undefined && payload.occupierName !== null
        ? payload.occupierName
        : payload.builder !== undefined && payload.builder !== null
        ? payload.builder
        : existingSoc?.builderName || null;

    const builderEnglishVal =
      payload.builderNameEnglish !== undefined && payload.builderNameEnglish !== null
        ? payload.builderNameEnglish
        : payload.occupierNameEnglish !== undefined && payload.occupierNameEnglish !== null
        ? payload.occupierNameEnglish
        : payload.builderEnglish !== undefined && payload.builderEnglish !== null
        ? payload.builderEnglish
        : existingSoc?.builderNameEnglish || null;

    const ownerVal =
      payload.landOwnerName !== undefined && payload.landOwnerName !== null
        ? payload.landOwnerName
        : payload.ownerName !== undefined && payload.ownerName !== null
        ? payload.ownerName
        : payload.owner !== undefined && payload.owner !== null
        ? payload.owner
        : existingSoc?.landOwnerName || null;

    const ownerEnglishVal =
      payload.landOwnerNameEnglish !== undefined && payload.landOwnerNameEnglish !== null
        ? payload.landOwnerNameEnglish
        : payload.ownerNameEnglish !== undefined && payload.ownerNameEnglish !== null
        ? payload.ownerNameEnglish
        : existingSoc?.landOwnerNameEnglish || null;

    const addressVal =
      payload.societyAddress !== undefined && payload.societyAddress !== null
        ? payload.societyAddress
        : payload.address !== undefined && payload.address !== null
        ? payload.address
        : existingSoc?.societyAddress || null;

    const addressEnglishVal =
      payload.societyAddressEnglish !== undefined && payload.societyAddressEnglish !== null
        ? payload.societyAddressEnglish
        : existingSoc?.societyAddressEnglish || null;

    const societyNameVal =
      payload.societyName !== undefined && payload.societyName !== null
        ? payload.societyName
        : payload.propertyHolder !== undefined && payload.propertyHolder !== null
        ? payload.propertyHolder
        : payload.holderRegional !== undefined && payload.holderRegional !== null
        ? payload.holderRegional
        : existingSoc?.societyName || null;

    const societyNameEnglishVal =
      payload.societyNameEnglish !== undefined && payload.societyNameEnglish !== null
        ? payload.societyNameEnglish
        : existingSoc?.societyNameEnglish || null;

    const societyPayload: UpdatePropertySocietyDetailsDto = {
      propertyId: numPropId,
      societyDetailId: existingSoc?.societyDetailId ?? null,
      wingId: existingSoc?.wingId ?? null,
      wingNo: existingSoc?.wingNo ?? null,
      wingName: existingSoc?.wingName ?? null,
      societyName: societyNameVal || null,
      societyAddress: addressVal || null,
      secretaryName: payload.secretaryName ?? existingSoc?.secretaryName ?? null,
      managerName: payload.managerName ?? existingSoc?.managerName ?? null,
      landOwnerName: ownerVal || null,
      builderName: builderVal || null,
      builderNameEnglish: builderEnglishVal || null,
      societyNameEnglish: societyNameEnglishVal || null,
      societyAddressEnglish: addressEnglishVal || null,
      secretaryNameEnglish: payload.secretaryNameEnglish ?? existingSoc?.secretaryNameEnglish ?? null,
      managerNameEnglish: payload.managerNameEnglish ?? existingSoc?.managerNameEnglish ?? null,
      landOwnerNameEnglish: ownerEnglishVal || null,
      managerMobileNo: payload.managerMobileNo ? payload.managerMobileNo.replace(/\D/g, '').slice(-10) : (existingSoc?.managerMobileNo ? existingSoc.managerMobileNo.replace(/\D/g, '').slice(-10) : null),
      secretaryMobileNo: payload.secretaryMobileNo ? payload.secretaryMobileNo.replace(/\D/g, '').slice(-10) : (existingSoc?.secretaryMobileNo ? existingSoc.secretaryMobileNo.replace(/\D/g, '').slice(-10) : null),
      societyEmailId: payload.societyEmailId || payload.societyEmail || payload.emailId || existingSoc?.societyEmailId || null,
      secretaryEmailId: payload.secretaryEmailId || existingSoc?.secretaryEmailId || null,
      managerEmailId: payload.managerEmailId || existingSoc?.managerEmailId || null,
    };

    const socRes = await updatePropertySocietyDetails(numPropId, societyPayload);
    societySuccess = socRes?.success ?? true;
  } catch {
    // Graceful fallback for society sync
  }

  try {
    const existingKyc = await getPropertyKycById(numPropId).catch(() => null);
    if (existingKyc?.items) {
      const kycPayload: KycDetails = {
        ...existingKyc.items,
        mobileNo: payload.mobileNo ? payload.mobileNo.replace(/\D/g, '').slice(-10) : existingKyc.items.mobileNo,
        alternateMobileNo: payload.alternateMobileNo ? payload.alternateMobileNo.replace(/\D/g, '').slice(-10) : existingKyc.items.alternateMobileNo,
        emailId: payload.societyEmailId || payload.societyEmail || payload.emailId || existingKyc.items.emailId,
        address: payload.societyAddress || payload.address || existingKyc.items.address,
        addressEnglish: payload.societyAddressEnglish || existingKyc.items.addressEnglish,
        ownerName: payload.landOwnerName || payload.ownerName || payload.owner || existingKyc.items.ownerName,
        ownerNameEnglish: payload.landOwnerNameEnglish || payload.ownerNameEnglish || existingKyc.items.ownerNameEnglish,
        occupierName: payload.builderName || payload.occupierName || payload.builder || existingKyc.items.occupierName,
        occupierNameEnglish: payload.builderNameEnglish || payload.occupierNameEnglish || payload.builderEnglish || existingKyc.items.occupierNameEnglish,
        pinCode: payload.pinCode || existingKyc.items.pinCode,
        adharCardNo: payload.aadharNo || existingKyc.items.adharCardNo,
      };
      await updatePropertyKyc(numPropId, kycPayload).catch(() => null);
    }
  } catch {
    // Graceful fallback for KYC sync
  }

  return { success: societySuccess };
}
