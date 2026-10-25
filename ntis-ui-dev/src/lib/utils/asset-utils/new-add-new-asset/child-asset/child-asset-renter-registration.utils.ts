/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { apiClient } from '@/services/api.service';
import { logger } from '@/lib/utils/logger';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';
import { toApiDateString, calcDurationMonths } from './child-asset.utils';

/**
 * Registers or updates the renter/lease record for a just-created child
 * asset. Only attempted when the "RENTER: Yes/No" toggle was actually Yes
 * (renterName can stay populated even when the toggle is No — Shop Details
 * reuses it as the occupant's identity — so its presence alone must not
 * trigger a registration call).
 */
export async function registerRenterDetails(
  data: CreateChildAssetRequest,
  createdAssetId: number,
  renterDetailsId: number | undefined,
  roomWiseSubmissionDetailId: any,
  userId: number | undefined
): Promise<{ success: true } | { success: false; error: string }> {
  const rentInfo = data.rentInformation;
  const leaseStartDateStr = toApiDateString(rentInfo?.leaseStart);
  const leaseEndDateStr = toApiDateString(rentInfo?.leaseEnd);
  const computedDuration = calcDurationMonths(rentInfo?.leaseStart || '', rentInfo?.leaseEnd || '');

  if (!data.isRenter) return { success: true };

  if (renterDetailsId) {
    try {
      const renterPayload: any = {
        id: Number(renterDetailsId),
        parentAssetId: Number(data.parentAssetId),
        assetId: Number(createdAssetId),
        floorDetailsId: data.floorDetailsId ? Number(data.floorDetailsId) : null,
        floorId: data.floorId ? Number(data.floorId) : null,
        subFloorId: data.subFloorId ? Number(data.subFloorId) : null,
        roomWiseSubmissionDetailsId: roomWiseSubmissionDetailId
          ? Number(roomWiseSubmissionDetailId)
          : null,
        shopNo: data.unitNo || null,
        shopName: data.shopUnitName || null,
        shopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
        ShopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
        tenantName: data.renterName || 'N/A',
        tenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
        TenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
        renterName: data.renterName || 'N/A',
        renterNameLocal: data.renterNameLocal || (data as any).tenantRegionalName || null,
        tenantMobile: data.mobileNo || '9999999999',
        mobileNo: data.mobileNo || '9999999999',
        tenantEmail: data.emailId || null,
        emailId: data.emailId || null,
        tenantAadhaarNo: data.aadhaarCardNo || null,
        aadhaarCardNo: data.aadhaarCardNo || null,
        tenantPanCardNo: data.panCardNo || null,
        panCardNo: data.panCardNo || null,
        gstNo: data.gstNo || null,
        tenantAddress: (data as any).tenantAddress || data.locationAddress || null,
        leaseType: (rentInfo?.leaseRentType || '').toLowerCase().includes('lease') ? 'Lease' : 'Rent',
        leaseStartDate: leaseStartDateStr,
        fromDate: leaseStartDateStr,
        leaseEndDate: leaseEndDateStr,
        toDate: leaseEndDateStr,
        agreementId: rentInfo?.agreementId || rentInfo?.agreementNo || data.agreementId || data.agreementNo || null,
        duration: computedDuration,
        paymentFrequency: rentInfo?.rentFrequency || null,
        rentAmount: rentInfo?.rentAmount ? Number(rentInfo.rentAmount) : 0,
        monthlyRent: rentInfo?.rentAmount ? Number(rentInfo.rentAmount) : 0,
        rentMonthly: rentInfo?.rentAmount ? Number(rentInfo.rentAmount) : 0,
        securityDeposit: rentInfo?.securityDeposit ? Number(rentInfo.securityDeposit) : 0,
        depositType: rentInfo?.depositType || null,
        isActive: true,
      };

      logger.info('createChildAssetAction: Sending PUT to /AssetLeaseRentDetails/' + renterDetailsId, { renterPayload });
      const putRes = await apiClient.put(`/AssetLeaseRentDetails/${renterDetailsId}`, renterPayload);
      logger.info('createChildAssetAction: PUT response', { response: putRes });
      if (!putRes.success) {
        logger.error('createChildAssetAction: PUT to /AssetLeaseRentDetails failed', {
          error: new Error(putRes.error || 'Unknown error'),
        });
        return { success: false, error: `Failed to save renter details: ${putRes.error}` };
      }
      return { success: true };
    } catch (renterErr: any) {
      logger.error('Failed to update child asset renter details:', renterErr);
      return { success: false, error: `Failed to save renter details: ${renterErr.message || renterErr}` };
    }
  }

  if (!(data.renterName || rentInfo?.leaseRentType)) return { success: true };

  // No existing AssetLeaseRentDetails row for this asset yet — create one via the
  // real /AssetLeaseRentDetails POST endpoint. Use fallback of 1 if monthly rent not specified.
  const rawMonthlyRent = rentInfo?.rentAmount ? Number(rentInfo.rentAmount) : 0;
  const monthlyRent = rawMonthlyRent > 0 ? rawMonthlyRent : 1;

  try {
    const isLease = (rentInfo?.leaseRentType || '').toLowerCase().includes('lease');
    const regPayload: any = {
      isActive: true,
      createdBy: userId ?? 1,
      parentAssetId: data.parentAssetId ? Number(data.parentAssetId) : null,
      assetId: Number(createdAssetId),
      applicationTypeId: 1, // APP-NEW
      shopNo: data.unitNo || null,
      shopName: data.shopUnitName || null,
      shopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
      ShopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
      floorDetailsId: data.floorDetailsId ? Number(data.floorDetailsId) : null,
      totalAreaSqFt: data.totalAreaSqFt ?? null,
      tenantName: data.renterName || 'N/A',
      tenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
      TenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
      renterName: data.renterName || 'N/A',
      renterNameLocal: data.renterNameLocal || (data as any).tenantRegionalName || null,
      tenantMobile: data.mobileNo || '9999999999',
      tenantEmail: data.emailId || null,
      tenantType: 'Individual',
      tenantAadhaarNo: data.aadhaarCardNo || null,
      tenantPanCardNo: data.panCardNo || null,
      tenantAddress: (data as any).tenantAddress || data.locationAddress || null,
      gstNo: data.gstNo || null,
      leaseType: isLease ? 'Lease' : 'Rent',
      leaseStartDate: leaseStartDateStr || new Date().toISOString(),
      leaseEndDate: leaseEndDateStr,
      agreementId: rentInfo?.agreementId || rentInfo?.agreementNo || data.agreementId || data.agreementNo || null,
      duration: computedDuration,
      monthlyRent,
      rentAmount: monthlyRent,
      securityDeposit: rentInfo?.securityDeposit ? Number(rentInfo.securityDeposit) : 0,
      depositType: rentInfo?.depositType || null,
      paymentFrequency: rentInfo?.rentFrequency || 'Monthly',
      reason: data.propertyDescription || null,
    };

    logger.info('createChildAssetAction: Sending POST to /AssetLeaseRentDetails', { regPayload });
    const postRes = await apiClient.post<any>('/AssetLeaseRentDetails', regPayload);
    logger.info('createChildAssetAction: POST /AssetLeaseRentDetails response', { response: postRes });
    if (!postRes.success) {
      logger.error('createChildAssetAction: POST to /AssetLeaseRentDetails failed', {
        error: new Error(postRes.error || 'Unknown error'),
      });
      return { success: false, error: `Failed to register renter: ${postRes.error}` };
    }
    return { success: true };
  } catch (regErr: any) {
    logger.error('Failed to create child asset renter details registration:', regErr);
    return { success: false, error: `Failed to register renter: ${regErr.message || regErr}` };
  }
}
