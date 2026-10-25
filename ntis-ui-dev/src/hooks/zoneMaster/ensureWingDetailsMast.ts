import { SocietyDetailItem, CreateSocietyDetailPayload } from "@/types/zone-master/properties/societyDetails.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { createSocietyDetailAction, createWingDetailsMastAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface EnsureWingDetailsMastParams {
  selectedPropertyId: number;
  wingMasterId: number;
  wingName: string;
  societyDetails: SocietyDetailItem[];
  wingDetailsMast: WingDetailsMastItem[];
}

interface EnsureWingDetailsMastResult {
  societyDetail: SocietyDetailItem;
  wingDetail: WingDetailsMastItem;
  createdSocietyDetail: boolean;
  createdWingDetail: boolean;
}

/**
 * Ensures a SocietyDetailsMast row (society-level, one per property) and a
 * WingDetailsMast row (one per wingMasterId) exist for the given property,
 * creating whichever is missing. Used both by explicit "Add Wing" and by the
 * implicit "Main Society" wing used for no-wing amenities.
 */
export async function ensureWingDetailsMast({
  selectedPropertyId,
  wingMasterId,
  wingName,
  societyDetails,
  wingDetailsMast,
}: EnsureWingDetailsMastParams): Promise<EnsureWingDetailsMastResult> {
  let societyDetailRecord = societyDetails[0];
  let createdSocietyDetail = false;

  if (!societyDetailRecord) {
    const societyPayload: CreateSocietyDetailPayload = {
      propertyId: selectedPropertyId,
      isActive: true,
      createdBy: 1,
    };
    const societyResult = await createSocietyDetailAction(societyPayload);

    if (!societyResult.success || !societyResult.data) {
      throw new Error(societyResult.error || "Failed to create society detail");
    }

    societyDetailRecord = societyResult.data;
    createdSocietyDetail = true;
  }

  const existingWingDetailsMast = wingDetailsMast.find(
    w => w.wingMasterId === wingMasterId && !w.markedForDeletion
  );

  if (existingWingDetailsMast) {
    return {
      societyDetail: societyDetailRecord,
      wingDetail: existingWingDetailsMast,
      createdSocietyDetail,
      createdWingDetail: false,
    };
  }

  const wingDetailsMastResult = await createWingDetailsMastAction({
    isActive: true,
    createdBy: 0,
    societyDetailsMastId: societyDetailRecord.id,
    wingMasterId,
    wingName,
    societyWingDetails: {
      isActive: true,
      createdBy: 0,
      wingId: wingMasterId,
      propertyId: selectedPropertyId,
      societyDetailId: societyDetailRecord.id,
      wingDetailsMastId: 0,
      fromFloor: "",
      toFloor: "",
      oldWingName: "",
      newWingName: wingName,
      noOfFlat: 0,
      noOfShop: 0,
      noOfRowHouse: 0,
    },
  });

  if (!wingDetailsMastResult.success || !wingDetailsMastResult.data) {
    // societyDetailRecord is kept in place so a retry reuses it instead of
    // creating a duplicate SocietyDetailsMast row.
    throw new Error(wingDetailsMastResult.error || "Failed to create wing detail");
  }

  return {
    societyDetail: societyDetailRecord,
    wingDetail: wingDetailsMastResult.data,
    createdSocietyDetail,
    createdWingDetail: true,
  };
}
