/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getChildAssetByIdAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";

/** Opening a standalone sub-unit that's already saved to the DB but hasn't
 * had its full detail loaded yet (no rooms/renter fetched) triggers a
 * one-time fetch of the complete child asset record before opening the
 * configurator. */
export function useStandaloneUnitConfigure(units: any[], setUnits: (units: any[]) => void) {
  const [activeUnit, setActiveUnit] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleConfigureUnit = useCallback(async (unit: any) => {
    const assetId = unit.id ? Number(unit.id) : (unit.assetId ? Number(unit.assetId) : null);

    if (assetId && assetId > 0 && !unit.isModified && (!unit.rooms || unit.rooms.length === 0) && !unit.renterName) {
      setIsLoadingDetails(true);
      try {
        const res = await getChildAssetByIdAction(assetId);
        if (res.success && res.data) {
          const detail = res.data;

          const conYear = detail.conYear || detail.constructionYear || unit.conYear || "";
          const conType = detail.conType || (detail.constructionTypeId ? String(detail.constructionTypeId) : "") || unit.conType || "";
          const useType = detail.useType || (detail.typeOfUseId ? String(detail.typeOfUseId) : "") || unit.useType || "";
          const subUseType = detail.subUseType || (detail.subTypeOfUseId ? String(detail.subTypeOfUseId) : "") || unit.subUseType || "";

          const rent = Array.isArray(detail.renterDetails)
            ? detail.renterDetails[0]
            : (detail.renterDetailsList && detail.renterDetailsList[0]) || detail.renterDetails;

          const detailedUnit = {
            ...unit,
            ...detail,
            id: assetId,
            assetId: assetId,
            conYear,
            conType,
            useType,
            subUseType,
            carpetAreaSqFeet: Number(detail.carpetAreaSqFeet || detail.totalAreaSqFt || unit.carpetAreaSqFeet),
            rooms: Array.isArray(detail.rooms) ? detail.rooms : (Array.isArray(detail.roomDetails) ? detail.roomDetails : []),
            renterName: detail.renterName || rent?.renterName || rent?.tenantName || null,
            renterNameLocal: detail.renterNameLocal || detail.RenterNameLocal || detail.tenantRegionalName || detail.TenantRegionalName || rent?.tenantRegionalName || rent?.TenantRegionalName || rent?.renterNameLocal || null,
            mobileNo: detail.mobileNo || rent?.tenantMobile || rent?.mobileNo || null,
            emailId: detail.emailId || rent?.tenantEmail || rent?.emailId || null,
            gstNo: detail.gstNo || rent?.gstNo || null,
            aadhaar: detail.aadhaarCardNo || rent?.tenantAadhaarNo || rent?.aadhaar || null,
            pan: detail.panCardNo || rent?.tenantPanCardNo || rent?.pan || null,
            propertyNo: detail.propertyNo || detail.details?.propertyNo || detail.Details?.propertyNo || rent?.propertyNo || null,
            surveyNo: detail.surveyNo || detail.details?.surveyNo || detail.Details?.surveyNo || rent?.surveyNo || null,
            partitionNo: detail.partitionNo || detail.details?.partitionNo || detail.Details?.partitionNo || rent?.partitionNo || null,
            mpmsNo: detail.mpmsNo || detail.MPMSNo || detail.details?.mpmsNo || detail.details?.MPMSNo || detail.Details?.mpmsNo || detail.Details?.MPMSNo || rent?.mpmsNo || null,
            propertyDescription: detail.propertyDescription || rent?.reason || rent?.propertyDescription || null,
            unitName: detail.unitName || detail.shopUnitName || rent?.shopName || rent?.unitName || null,
            unitNameLocal: detail.unitNameLocal || detail.shopUnitNameLocal || detail.shopRegionalName || rent?.shopRegionalName || rent?.unitNameLocal || null,
            shopName: detail.shopName || detail.ShopName || detail.shopUnitName || rent?.shopName || null,
            shopRegionalName: detail.shopRegionalName || detail.ShopRegionalName || detail.shopUnitNameLocal || rent?.shopRegionalName || null,
            tenantAddress: detail.tenantAddress || rent?.tenantAddress || rent?.TenantAddress || null,
            capitalValue: Number(detail.capitalValue || rent?.capitalValue || 0),

            rentType: rent?.leaseRentType || rent?.leaseType || null,
            leaseStart: rent?.leaseStartDate || rent?.fromDate || rent?.leaseStart || null,
            leaseEnd: rent?.leaseEndDate || rent?.toDate || rent?.leaseEnd || null,
            rentFreq: rent?.paymentFrequency || rent?.rentFreq || "Monthly",
            rentAmount: Number(rent?.rentAmount || rent?.monthlyRent || rent?.rentMonthly || 0),
            securityDeposit: Number(rent?.securityDeposit || 0),
            depositType: rent?.depositType || "Refundable",
            agreementId: rent?.agreementId || rent?.AgreementId || rent?.agreementNo || null,
            agreementNo: rent?.agreementNo || rent?.AgreementNo || rent?.agreementId || null,

            isSaved: true,
          };

          setUnits(units.map((u: any) => u.tempId === unit.tempId ? detailedUnit : u));
          setActiveUnit(detailedUnit);
        } else {
          toast.error(res.error || "Failed to load subunit details");
        }
      } catch (err: any) {
        toast.error("Failed to load subunit details from server: " + err.message);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      setActiveUnit(unit);
    }
  }, [units, setUnits]);

  return { activeUnit, setActiveUnit, isLoadingDetails, handleConfigureUnit };
}
