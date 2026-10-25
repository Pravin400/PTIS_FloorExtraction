import { LookupData } from "@/types/common-details.types";

/**
 * Type guard to check if an object has a specific property
 * @internal
 */
function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Safely extracts a string property from an object
 * @internal
 */
function getStringProperty(obj: unknown, prop: string): string | undefined {
  if (!hasProperty(obj, prop)) return undefined;
  const value = obj[prop];
  return typeof value === 'string' ? value : String(value);
}

/**
 * Formats a code and description into a readable display string (e.g. "G - तळमजला").
 * Avoids duplicate prefixing if the description already includes the code.
 */
export const formatCodeAndDescription = (code?: string, desc?: string): string => {
  const cleanCode = (code ?? '').trim();
  const cleanDesc = (desc ?? '').trim();

  if (cleanCode && cleanCode.toLowerCase() !== 'undefined' && cleanCode.toLowerCase() !== 'null' && cleanDesc) {
    if (cleanDesc === cleanCode || cleanDesc.startsWith(`${cleanCode} - `) || cleanDesc.startsWith(`${cleanCode}-`)) {
      return cleanDesc;
    }
    return `${cleanCode} - ${cleanDesc}`;
  }

  if (cleanCode && cleanCode.toLowerCase() !== 'undefined' && cleanCode.toLowerCase() !== 'null') {
    return cleanCode;
  }

  return cleanDesc;
};

/**
 * Retrieves floor description from lookup data
 */
export const getFloorDescription = (id: string | number, floorData: LookupData[]): string => {
  if (!id || !floorData?.length) return '';
  const found = floorData.find((f) => String(f.floorId || f.id || f.ID) === String(id));
  if (!found) return '';

  const code = found.floorCode || getStringProperty(found, 'code');
  const desc = found.description || '';
  return formatCodeAndDescription(code, desc);
};

/**
 * Retrieves sub-floor description from lookup data
 */
export const getSubFloorDescription = (id: string | number, subFloorData: LookupData[]): string => {
  if (!id || !subFloorData?.length) return '';
  const found = subFloorData.find((f) => String(f.subFloorId || f.id || f.ID) === String(id));
  if (!found) return '';

  const code = getStringProperty(found, 'subFloorCode') ||
    getStringProperty(found, 'code') ||
    found.floorCode;
  const desc = found.description || '';
  return formatCodeAndDescription(code, desc);
};

/**
 * Retrieves construction type description from lookup data
 */
export const getConstructionDescription = (
  id: string | number,
  constructionTypeData: LookupData[]
): string => {
  if (!id || !constructionTypeData?.length) return '';
  const found = constructionTypeData.find(
    (c) => String(c.constructionTypeId || c.id || c.ID) === String(id)
  );
  if (!found) return '';

  const code = getStringProperty(found, 'constructionCode') ||
    getStringProperty(found, 'code');
  const desc = getStringProperty(found, 'description') || '';

  return formatCodeAndDescription(code, desc);
};

/**
 * Retrieves type of use description from lookup data
 */
export const getUseDescription = (id: string | number, useData: LookupData[]): string => {
  if (!id || !useData?.length) return '';
  const found = useData.find((u) => String(u.typeOfUseId || u.id || u.ID) === String(id));
  if (!found) return '';

  const code = getStringProperty(found, 'typeOfUseCode') ||
    getStringProperty(found, 'code');
  const desc = getStringProperty(found, 'description') || '';

  return formatCodeAndDescription(code, desc);
};

/**
 * Retrieves sub-type of use description from lookup data
 */
export const getSubTypeDescription = (id: number | string, subTypeData: LookupData[]): string => {
  if (!id || !subTypeData?.length) return '';
  const found = subTypeData.find((s) => String(s.subTypeOfUseId || s.id || s.ID) === String(id));
  if (!found) return '';

  const key = getStringProperty(found, 'searchKey') ||
    getStringProperty(found, 'code');
  const desc = getStringProperty(found, 'description') || '';

  return key ? `${key} - ${desc}` : desc;
};
