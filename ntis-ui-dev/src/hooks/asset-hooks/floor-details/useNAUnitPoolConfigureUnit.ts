/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { PoolUnit } from '@/types/asset/floor-details.types';
// NA version: uses new-add-new-asset actions, NOT add-New-Asset
import { getChildAssetByIdAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/**
 * NA (NewAddNewAsset) version of useUnitPoolConfigureUnit.
 * Opens a pool unit that is already saved to the DB but has not yet had its
 * full detail loaded (no rooms/renter fetched). Triggers a one-time fetch of
 * the complete child asset record before showing the configurator.
 */
export function useNAUnitPoolConfigureUnit(
  setPool: React.Dispatch<React.SetStateAction<PoolUnit[]>>,
  setActiveUnit: React.Dispatch<React.SetStateAction<PoolUnit | null>>,
  setIsLoadingDetails: React.Dispatch<React.SetStateAction<boolean>>
) {
  const handleConfigureUnit = useCallback(
    async (unit: PoolUnit) => {
      const assetId = unit.dbId ? Number(unit.dbId) : unit.id ? Number(unit.id) : unit.assetId ? Number(unit.assetId) : null;

      // If the unit exists in the DB and is not in local unsaved modified state, fetch fresh complete details
      if (assetId && assetId > 0 && !unit.isModified) {
        setIsLoadingDetails(true);
        try {
          const res = await getChildAssetByIdAction(assetId);
          if (res.success && res.data) {
            const detail = res.data;

            const conYear = detail.conYear || detail.constructionYear || unit.conYear || '';
            const conType =
              detail.conType ||
              (detail.constructionTypeId ? String(detail.constructionTypeId) : '') ||
              unit.conType ||
              '';
            const useType =
              detail.useType ||
              (detail.typeOfUseId ? String(detail.typeOfUseId) : '') ||
              unit.useType ||
              '';
            const subUseType =
              detail.subUseType ||
              (detail.subTypeOfUseId ? String(detail.subTypeOfUseId) : '') ||
              unit.subUseType ||
              '';

            const rent = Array.isArray(detail.renterDetails)
              ? detail.renterDetails[0]
              : (detail.renterDetailsList && detail.renterDetailsList[0]) ||
                detail.renterDetails ||
                (Array.isArray(detail.leaseRentDetails) ? detail.leaseRentDetails[0] : detail.leaseRentDetails);


            const rentType = rent?.leaseRentType || rent?.leaseType || unit.rentType || null;
            const leaseStart = rent?.leaseStartDate
              ? String(rent.leaseStartDate).split('T')[0]
              : rent?.fromDate
                ? String(rent.fromDate).split('T')[0]
                : rent?.leaseStart
                  ? String(rent.leaseStart).split('T')[0]
                  : unit.leaseStart || null;
            const leaseEnd = rent?.leaseEndDate
              ? String(rent.leaseEndDate).split('T')[0]
              : rent?.toDate
                ? String(rent.toDate).split('T')[0]
                : rent?.leaseEnd
                  ? String(rent.leaseEnd).split('T')[0]
                  : unit.leaseEnd || null;
            const duration = rent?.duration || unit.duration || null;
            const rentFreq = String(rent?.paymentFrequency || rent?.rentFrequency || rent?.rentFreq || unit.rentFreq || 'Monthly');
            const rentAmount = rent?.rentAmount !== undefined ? rent.rentAmount : (rent?.monthlyRent !== undefined ? rent.monthlyRent : (unit.rentAmount ?? ''));
            const securityDeposit = rent?.securityDeposit !== undefined ? rent.securityDeposit : (unit.securityDeposit ?? '');
            const depositType = rent?.depositType || unit.depositType || 'Refundable';
            const agreementId = rent?.agreementId || unit.agreementId || '';
            const aadhaar = detail.aadhaarCardNo || rent?.tenantAadhaarNo || rent?.aadhaar || unit.aadhaar || null;
            const pan = detail.panCardNo || rent?.tenantPanCardNo || rent?.pan || unit.pan || null;

            const isRenterUnit = !!(
              detail.isRenter ||
              detail.isRented ||
              rentType ||
              detail.renterName ||
              rent?.tenantName ||
              unit.isRenter ||
              unit.isRented
            );

            const detailedUnit: PoolUnit = {
              ...unit,
              ...detail,
              id: assetId,
              assetId: assetId,
              conYear,
              conType,
              useType,
              subUseType,
              // Prefer explicit carpet field; never let totalAreaSqFt (builtup) override it
              carpetAreaSqFt: Number(
                detail.carpetAreaSqFeet || detail.carpetAreaSqFt || unit.carpetAreaSqFt
              ),
              rooms: Array.isArray(detail.rooms)
                ? detail.rooms
                : Array.isArray(detail.roomDetails)
                  ? detail.roomDetails
                  : [],
              isRenter: isRenterUnit,
              isRented: isRenterUnit,
              renterName: detail.renterName || rent?.renterName || rent?.tenantName || unit.renterName || null,
              mobileNo: detail.mobileNo || rent?.tenantMobile || rent?.mobileNo || unit.mobileNo || null,
              emailId: detail.emailId || rent?.tenantEmail || rent?.emailId || unit.emailId || null,
              gstNo: detail.gstNo || rent?.gstNo || unit.gstNo || null,
              aadhaarCardNo: aadhaar,
              panCardNo: pan,
              aadhaar,
              pan,
              propertyNo: detail.propertyNo || detail.details?.propertyNo || detail.Details?.propertyNo || rent?.propertyNo || unit.propertyNo || null,
              unitNo: detail.unitNo || detail.details?.unitNo || detail.Details?.unitNo || unit.unitNo || null,
              surveyNo: detail.surveyNo || detail.details?.surveyNo || detail.Details?.surveyNo || rent?.surveyNo || unit.surveyNo || null,
              partitionNo: detail.partitionNo || detail.details?.partitionNo || rent?.partitionNo || unit.partitionNo || null,
              mpmsNo: detail.mpmsNo || detail.MPMSNo || detail.details?.mpmsNo || detail.details?.MPMSNo || detail.Details?.mpmsNo || detail.Details?.MPMSNo || rent?.mpmsNo || unit.mpmsNo || null,
              propertyDescription:
                detail.propertyDescription || rent?.reason || rent?.propertyDescription || unit.propertyDescription || null,
              unitName: detail.shopUnitName || detail.ShopUnitName || detail.unitName || detail.UnitName || rent?.shopName || rent?.ShopName || rent?.shopUnitName || unit.unitName || null,
              unitNameLocal:
                detail.shopUnitNameLocal ||
                detail.ShopUnitNameLocal ||
                detail.shopRegionalName ||
                detail.ShopRegionalName ||
                detail.unitNameLocal ||
                detail.UnitNameLocal ||
                rent?.shopRegionalName ||
                rent?.ShopRegionalName ||
                rent?.shopUnitNameLocal ||
                rent?.ShopUnitNameLocal ||
                unit.unitNameLocal ||
                null,
              renterNameLocal:
                detail.renterNameLocal ||
                detail.RenterNameLocal ||
                detail.tenantRegionalName ||
                detail.TenantRegionalName ||
                detail.tenantNameLocal ||
                detail.TenantNameLocal ||
                rent?.tenantRegionalName ||
                rent?.TenantRegionalName ||
                rent?.renterNameLocal ||
                rent?.RenterNameLocal ||
                rent?.tenantNameLocal ||
                rent?.TenantNameLocal ||
                unit.renterNameLocal ||
                null,
              shopName: detail.shopName || detail.ShopName || detail.shopUnitName || detail.ShopUnitName || rent?.shopName || rent?.ShopName || unit.shopName || null,
              shopRegionalName:
                detail.shopRegionalName ||
                detail.ShopRegionalName ||
                detail.shopUnitNameLocal ||
                detail.ShopUnitNameLocal ||
                rent?.shopRegionalName ||
                rent?.ShopRegionalName ||
                unit.shopRegionalName ||
                null,
              tenantAddress:
                detail.tenantAddress ||
                detail.TenantAddress ||
                rent?.tenantAddress ||
                rent?.TenantAddress ||
                unit.tenantAddress ||
                null,
              departmentId: detail.departmentId || unit.departmentId || null,
              capitalValue: Number(detail.capitalValue || rent?.capitalValue || unit.capitalValue || 0),

              // Flat rent fields for direct form binding
              rentType,
              leaseStart,
              leaseEnd,
              duration,
              rentFreq,
              rentAmount: rentAmount !== '' ? Number(rentAmount) : '',
              securityDeposit: securityDeposit !== '' ? Number(securityDeposit) : '',
              depositType,
              agreementId: agreementId || null,
              agreementNo: agreementId || null,

              // Nested rentInformation object for API compatibility
              rentInformation: isRenterUnit && rentType
                ? {
                  leaseRentType: rentType,
                  leaseStart,
                  leaseEnd,
                  rentFrequency: rentFreq,
                  rentAmount: Number(rentAmount || 0),
                  securityDeposit: Number(securityDeposit || 0),
                  depositType,
                  agreementId,
                  shopName: detail.shopName || rent?.shopName || rent?.ShopName || unit.shopName || null,
                  shopRegionalName:
                    detail.shopRegionalName ||
                    detail.ShopRegionalName ||
                    rent?.shopRegionalName ||
                    rent?.ShopRegionalName ||
                    unit.shopRegionalName ||
                    null,
                  tenantAddress:
                    detail.tenantAddress ||
                    detail.TenantAddress ||
                    rent?.tenantAddress ||
                    rent?.TenantAddress ||
                    unit.tenantAddress ||
                    null,
                }
                : null,

              renterDetails: detail.renterDetails ?? (rent ? [rent] : unit.renterDetails ?? null),
              isSaved: true,
            };

            setPool((prev) => prev.map((u) => (u.tempId === unit.tempId ? detailedUnit : u)));
            setActiveUnit(detailedUnit);
          } else {
            toast.error(res.error || 'Failed to load unit details');
          }
        } catch (err: any) {
          toast.error('Failed to load unit details from server: ' + err.message);
        } finally {
          setIsLoadingDetails(false);
        }
      } else {
        // Unit is either local-only or already fully loaded — open directly
        setActiveUnit(unit);
      }
    },
    [setPool, setActiveUnit, setIsLoadingDetails]
  );

  return { handleConfigureUnit };
}
