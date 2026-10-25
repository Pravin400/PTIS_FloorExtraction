import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
  SharedErrorMapOptions,
} from "@/lib/utils/asset-utils/shared-error-mapping";

// Reference check (DELETE, or PUT with isActive: false), keyed by the backend's display name, e.g.
//   "This Type Of Use Group cannot be deleted because it has Type Of Uses and CV Rates. Please delete all Type Of Uses and CV Rates for this Type Of Use Group first."
//   "This Sub Type Of Use cannot be deactivated because it is in use."
const REFERENCE_BLOCKED_ENTITIES: Record<string, string> = {
  "Type Of Use Group": "apiErrors.referenceBlocked.typeOfUseGroup",
  "Type Of Use": "apiErrors.referenceBlocked.typeOfUse",
  "Sub Type Of Use": "apiErrors.referenceBlocked.subTypeOfUse",
};

const REFERENCE_BLOCKED_MASTERS: Record<string, string> = {
  "Type Of Uses": "apiErrors.referenceMasters.typeOfUses",
  "CV Rates": "apiErrors.referenceMasters.cvRates",
  "Sub Type Of Uses": "apiErrors.referenceMasters.subTypeOfUses",
  "Use Factors": "apiErrors.referenceMasters.useFactors",
};

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export function getErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string>) => string,
  tCommon: (key: string) => string,
  fallbackEntityName: string
): string {
  const referenceBlocked = translateReferenceBlockedMessage(message, t as SharedErrorMapOptions["t"], {
    entities: REFERENCE_BLOCKED_ENTITIES,
    masters: REFERENCE_BLOCKED_MASTERS,
    andKey: "apiErrors.referenceMasters.and",
  });
  if (referenceBlocked) return referenceBlocked;

  return mapSharedApiError({
    message,
    statusCode,
    t: t as SharedErrorMapOptions["t"],
    tCommon: tCommon as SharedErrorMapOptions["tCommon"],
    fallbackEntityName,
  });
}
