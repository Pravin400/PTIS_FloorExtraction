
export type ReferenceBlockedMessage = {
  /** The backend's display name for the blocked record, e.g. "Mouja" or "Sub Zone". */
  entity: string;
  operation: "delete" | "deactivate";
  /** Child masters the backend named, e.g. "Asset Types and Asset Room Types"; absent for "it is in use". */
  masters?: string;
};

const IN_USE_PATTERN = /^This (.+?) cannot be (deleted|deactivated) because it is in use\.?$/i;
const HAS_MASTERS_PATTERN = /^This (.+?) cannot be (deleted|deactivated) because it has (.+?)\. Please delete all .+ first\.?$/i;

/**
 * Recognises the AMS backend's reference-check message (ReferenceValidationService), returned as a 400 on
 * DELETE /{id} and on PUT /{id} with isActive: false:
 *   "This {Entity} cannot be deleted because it is in use."
 *   "This {Entity} cannot be deleted because it has {Masters}. Please delete all {Masters} for this {Entity} first."
 * ("deactivated" instead of "deleted" for the PUT.)
 */
export function parseReferenceBlockedMessage(message: string | undefined): ReferenceBlockedMessage | null {
  const msg = (message || "").trim();
  const toOperation = (verb: string) => (verb.toLowerCase() === "deactivated" ? "deactivate" : "delete");

  const hasMasters = msg.match(HAS_MASTERS_PATTERN);
  if (hasMasters) return { entity: hasMasters[1], operation: toOperation(hasMasters[2]), masters: hasMasters[3] };

  const inUse = msg.match(IN_USE_PATTERN);
  if (inUse) return { entity: inUse[1], operation: toOperation(inUse[2]) };

  return null;
}

export type ReferenceBlockedTranslationOptions = {
  /** Backend display name -> translation key prefix, e.g. { "Asset Type": "apiErrors.referenceBlocked.assetType" }. */
  entities: Record<string, string>;
  /** Backend child-master name -> translation key, e.g. { "Asset Room Types": "apiErrors.referenceMasters.assetRoomTypes" }. */
  masters?: Record<string, string>;
  /** Translation key for the word joining the last two child masters ("A, B and C"), e.g. "apiErrors.referenceMasters.and". */
  andKey?: string;
};

/**
 * Translates the backend reference-check message for the given entities. Keys under each entity prefix:
 * deleteInUse, deactivateInUse, deleteHasMasters, deactivateHasMasters ({masters} = the translated child names).
 * Returns undefined when the message is not a reference-check message for one of these entities.
 */
export function translateReferenceBlockedMessage(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  { entities, masters = {}, andKey }: ReferenceBlockedTranslationOptions
): string | undefined {
  const blocked = parseReferenceBlockedMessage(message);
  const prefix = blocked && entities[blocked.entity];
  if (!blocked || !prefix) return undefined;

  if (!blocked.masters) return t(`${prefix}.${blocked.operation}InUse`);

  // Same shape as the backend's JoinWithAnd: "A", "A and B", "A, B and C".
  const names = blocked.masters.split(/, | and /).map((name) => t(masters[name]));
  const joined = names.length === 1 || !andKey
    ? names.join(", ")
    : `${names.slice(0, -1).join(", ")} ${t(andKey)} ${names[names.length - 1]}`;
  return t(`${prefix}.${blocked.operation}HasMasters`, { masters: joined });
}

export type SharedErrorMapOptions = {
  message?: string;
  statusCode?: number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string;
  fallbackEntityName: string;
  entityLabelKey?: string;
  entityMatchers?: Array<{ test: RegExp; labelKey: string }>;
  customStatusCodes?: Record<number, string>;
};

export function mapSharedApiError({
  message,
  statusCode,
  t,
  tCommon,
  fallbackEntityName,
  entityLabelKey,
  entityMatchers = [],
  customStatusCodes,
}: SharedErrorMapOptions): string {
  let rawMsg = (message || "").trim().replace(/\.$/, "");
  const fallbackMessage = rawMsg || t("apiErrors.operationFailed") || tCommon("errors.generic") || tCommon("errors.deleteError");


  if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.errors && typeof parsed.errors === "object") {
        const firstErrorKey = Object.keys(parsed.errors)[0];
        if (firstErrorKey) {
          const errorsList = parsed.errors[firstErrorKey];
          if (Array.isArray(errorsList) && errorsList.length > 0) {
            rawMsg = String(errorsList[0]);
          } else if (typeof errorsList === "string") {
            rawMsg = errorsList;
          }
        }
      } else if (typeof parsed.message === "string" && parsed.message.trim()) {
        rawMsg = parsed.message.trim();
      }
    } catch {
      // Keep rawMsg as-is if the response is not valid JSON.
    }
  }

  const match = rawMsg.match(/Cannot deactivate\/delete this (.*?) because it is referenced in:\s*(.*)/i);
  if (match) {
    const entity = match[1];
    const tables = match[2];

    let entityName = fallbackEntityName;
    const lowerEntity = entity.toLowerCase();

    if (entityLabelKey) {
      try {
        entityName = t(entityLabelKey);
      } catch {}
    }

    for (const matcher of entityMatchers) {
      if (matcher.test.test(lowerEntity)) {
        try {
          entityName = t(matcher.labelKey);
        } catch {}
        break;
      }
    }

    try {
      const translation = t("apiErrors.referencedIn", { entity: entityName, tables });
      if (translation && translation !== "apiErrors.referencedIn") {
        return translation;
      }
    } catch {}

    return `Cannot deactivate or delete this ${entityName} because it is referenced in: ${tables}.`;
  }

  const code = statusCode ?? 0;
  if (customStatusCodes && customStatusCodes[code]) {
    return customStatusCodes[code];
  }

  try {
    const key = `apiErrors.${rawMsg}`;
    const translated = t(key as never);
    if (translated && translated !== key && !translated.includes(key)) {
      return translated;
    }
  } catch {}

  const lowerMsg = rawMsg.toLowerCase();
  if (lowerMsg.includes("duplicate") || lowerMsg.includes("already exists")) {
    try {
      const dupTranslation = t("apiErrors.duplicateRecord");
      if (dupTranslation && dupTranslation !== "apiErrors.duplicateRecord") {
        return dupTranslation;
      }
    } catch {}
  }

  if (statusCode === 409) {
    return t("apiErrors.inUse") || "Record is in use.";
  }

  if (statusCode && statusCode >= 500) {
    return t("apiErrors.operationFailed") || tCommon("errors.generic") || tCommon("errors.deleteError") || "Something went wrong.";
  }

  if (rawMsg) return rawMsg;

  return fallbackMessage;
}
