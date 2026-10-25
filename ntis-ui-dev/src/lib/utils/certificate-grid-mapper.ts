export interface CertificateItem {
  rowNumber?: number;
  level: 'Apartment' | 'Wing' | 'Unit' | 'Floor' | string;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
  propertyId?: number | null;
  propertyDetailsId?: number | null;
  applicableToLabel?: string;
  applicableToSubLabel?: string | null;
  unitsCoveredCount?: number | null;
  unitsTotalCount?: number | null;
  unitsMissingCount?: number | null;
  coveredUnitNumbers?: string[];
  coveredPropertyIds?: number[];
  certificateTypeId: number;
  certificateTypeCode?: string;
  certificateTypeName?: string;
  certificateDate?: string | null;
  certificateNumber?: string;
  status?: string;
  entityType?: string;
  propertyCertificateId?: number | null;
  hasDocument?: boolean;
  documentGuid?: string | null;
  fileName?: string | null;
}


export interface WingOption {
  wingDetailId: number;
  wingName?: string | null;
  wingNo?: string | null;
}

export interface CertificateGridItems {
  wingCount?: number;
  unitCount?: number;
  societyCertificates?: CertificateItem[];
  wingCertificates?: CertificateItem[];
  unitCertificates?: CertificateItem[];
  floorCertificates?: CertificateItem[];
}

export interface CertificateGridApiResponseData {
  wingCount?: number;
  unitCount?: number;
  records?: CertificateItem[];
  items?: CertificateGridItems | CertificateItem[];
  societyCertificates?: CertificateItem[];
  wingCertificates?: CertificateItem[];
  unitCertificates?: CertificateItem[];
  floorCertificates?: CertificateItem[];
}

export function mapRawCertificateItem(item: unknown): CertificateItem {
  if (!item || typeof item !== 'object') return item as CertificateItem;
  const raw = item as Record<string, unknown>;
  const certNo = String(
    raw.certificateNumber || raw.CertificateNumber ||
    raw.certificateNo || raw.CertificateNo ||
    raw.permitNo || raw.PermitNo ||
    raw.number || raw.Number || ''
  );
  const certDate = (
    raw.certificateDate || raw.CertificateDate ||
    raw.certificateIssueDate || raw.CertificateIssueDate ||
    raw.issueDate || raw.IssueDate ||
    raw.date || raw.Date
  ) as string | null | undefined;
  const certTypeId = Number(raw.certificateTypeId || raw.CertificateTypeId || raw.typeId || raw.TypeId || 0);
  const docGuid = (raw.documentGuid || raw.DocumentGuid || raw.guid || raw.Guid || raw.documentId || raw.DocumentId || raw.documentBindingId || raw.DocumentBindingId) as string | null | undefined;
  const hasDoc = Boolean(raw.hasDocument || raw.HasDocument || raw.hasDocumentBinding || raw.HasDocumentBinding || (docGuid && String(docGuid).trim().length > 0 && String(docGuid).toLowerCase() !== 'null'));
  const docName = (raw.fileName || raw.FileName || raw.documentName || raw.DocumentName || raw.name || raw.Name) as string | null | undefined;
  const rawEntity = String(raw.entityType || raw.EntityType || '').toUpperCase();
  const level = String(
    raw.level || raw.Level ||
    (rawEntity === 'S' ? 'Apartment' : rawEntity === 'W' ? 'Wing' : rawEntity === 'P' ? 'Unit' : rawEntity === 'F' ? 'Floor' : 'Apartment')
  );
  const rawUnitNos = raw.coveredUnitNumbers || raw.CoveredUnitNumbers || raw.unitNumbers || raw.UnitNumbers || raw.applicableToSubLabel || raw.ApplicableToSubLabel;
  const coveredUnitNos: string[] = Array.isArray(rawUnitNos)
    ? (rawUnitNos as unknown[]).map(String)
    : typeof rawUnitNos === 'string'
      ? rawUnitNos.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  if (raw.unitNo && !coveredUnitNos.includes(String(raw.unitNo))) coveredUnitNos.push(String(raw.unitNo));
  if (raw.UnitNo && !coveredUnitNos.includes(String(raw.UnitNo))) coveredUnitNos.push(String(raw.UnitNo));
  if (raw.partitionNo && !coveredUnitNos.includes(String(raw.partitionNo))) coveredUnitNos.push(String(raw.partitionNo));
  if (raw.PartitionNo && !coveredUnitNos.includes(String(raw.PartitionNo))) coveredUnitNos.push(String(raw.PartitionNo));

  const rawPropIds = raw.coveredPropertyIds || raw.CoveredPropertyIds || raw.propertyIds || raw.PropertyIds;
  const coveredPropIds: number[] = Array.isArray(rawPropIds)
    ? (rawPropIds as unknown[]).map(Number).filter((n) => !isNaN(n))
    : typeof rawPropIds === 'string'
      ? rawPropIds.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
  if (raw.propertyId && !coveredPropIds.includes(Number(raw.propertyId))) coveredPropIds.push(Number(raw.propertyId));
  if (raw.PropertyId && !coveredPropIds.includes(Number(raw.PropertyId))) coveredPropIds.push(Number(raw.PropertyId));
  if (raw.propertyDetailsId && !coveredPropIds.includes(Number(raw.propertyDetailsId))) coveredPropIds.push(Number(raw.propertyDetailsId));
  if (raw.PropertyDetailsId && !coveredPropIds.includes(Number(raw.PropertyDetailsId))) coveredPropIds.push(Number(raw.PropertyDetailsId));

  return {
    ...(raw as unknown as CertificateItem),
    level: level as CertificateItem['level'],
    entityType: rawEntity || (raw.entityType as string | undefined),
    certificateTypeId: certTypeId || (raw.certificateTypeId as number),
    certificateNumber: certNo,
    certificateDate: certDate ? String(certDate) : (raw.certificateDate as string | null | undefined),
    propertyCertificateId:
      raw.propertyCertificateId != null
        ? Number(raw.propertyCertificateId)
        : raw.PropertyCertificateId != null
          ? Number(raw.PropertyCertificateId)
          : raw.id != null
            ? Number(raw.id)
            : raw.Id != null
              ? Number(raw.Id)
              : undefined,
    hasDocument: hasDoc,
    documentGuid: docGuid ? String(docGuid) : (raw.documentGuid as string | null | undefined),
    fileName: docName ? String(docName) : (raw.fileName as string | null | undefined),

    wingDetailId: raw.wingDetailId != null ? Number(raw.wingDetailId) : raw.WingDetailId != null ? Number(raw.WingDetailId) : (raw.wingDetailId as number | null | undefined),
    societyDetailId: raw.societyDetailId != null ? Number(raw.societyDetailId) : raw.SocietyDetailId != null ? Number(raw.SocietyDetailId) : (raw.societyDetailId as number | null | undefined),
    propertyId: raw.propertyId != null ? Number(raw.propertyId) : raw.PropertyId != null ? Number(raw.PropertyId) : (raw.propertyId as number | null | undefined),
    propertyDetailsId: raw.propertyDetailsId != null ? Number(raw.propertyDetailsId) : raw.PropertyDetailsId != null ? Number(raw.PropertyDetailsId) : (raw.propertyDetailsId as number | null | undefined),
    coveredUnitNumbers: coveredUnitNos,
    coveredPropertyIds: coveredPropIds,
  };
}

/**
 * Normalizes any structure returned by `/api/ApartmentQC/certificate-grid` into a standard `CertificateGridItems` container.
 */
export function normalizeCertificateGridData(data: unknown): CertificateGridItems {
  if (!data || typeof data !== 'object') {
    return { societyCertificates: [], wingCertificates: [], unitCertificates: [], floorCertificates: [] };
  }

  const raw = data as Record<string, unknown>;
  const rawTarget = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;

  const societyList = (rawTarget.societyCertificates || rawTarget.SocietyCertificates || raw.societyCertificates || raw.SocietyCertificates) as unknown[];
  const wingList = (rawTarget.wingCertificates || rawTarget.WingCertificates || raw.wingCertificates || raw.WingCertificates) as unknown[];
  const unitList = (rawTarget.unitCertificates || rawTarget.UnitCertificates || raw.unitCertificates || raw.UnitCertificates) as unknown[];
  const floorList = (rawTarget.floorCertificates || rawTarget.FloorCertificates || raw.floorCertificates || raw.FloorCertificates) as unknown[];

  if (Array.isArray(societyList) || Array.isArray(wingList) || Array.isArray(unitList)) {
    return {
      wingCount: Number(rawTarget.wingCount || raw.wingCount || 0),
      unitCount: Number(rawTarget.unitCount || raw.unitCount || 0),
      societyCertificates: Array.isArray(societyList) ? societyList.map(mapRawCertificateItem).filter(c => c.entityType === 'S' || c.level === 'Apartment' || (!c.entityType && !c.level)) : [],
      wingCertificates: Array.isArray(wingList) ? wingList.map(mapRawCertificateItem).filter(c => c.entityType === 'W' || c.level === 'Wing' || (!c.entityType && !c.level)) : [],
      unitCertificates: Array.isArray(unitList) ? unitList.map(mapRawCertificateItem).filter(c => c.entityType === 'P' || c.level === 'Unit' || (!c.entityType && !c.level)) : [],
      floorCertificates: Array.isArray(floorList) ? floorList.map(mapRawCertificateItem).filter(c => c.entityType === 'F' || c.level === 'Floor' || (!c.entityType && !c.level)) : [],
    };
  }

  // Case 3: Response has a flat `records` or `items` array
  const rawArray = Array.isArray(raw.records)
    ? raw.records
    : Array.isArray(raw.Records)
    ? raw.Records
    : Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.Items)
    ? raw.Items
    : Array.isArray(data)
    ? data
    : [];
  if (Array.isArray(rawArray) && rawArray.length > 0) {
    const itemsList = (rawArray as unknown[]).map(mapRawCertificateItem);
    return {
      societyCertificates: itemsList.filter((c) => c.level === 'Apartment' || (c as unknown as { entityType?: string }).entityType === 'S'),
      wingCertificates: itemsList.filter((c) => c.level === 'Wing' || (c as unknown as { entityType?: string }).entityType === 'W'),
      unitCertificates: itemsList.filter((c) => c.level === 'Unit' || (c as unknown as { entityType?: string }).entityType === 'P'),
      floorCertificates: itemsList.filter((c) => c.level === 'Floor' || (c as unknown as { entityType?: string }).entityType === 'F'),
    };
  }

  return { societyCertificates: [], wingCertificates: [], unitCertificates: [], floorCertificates: [] };
}

/**
 * Extracts all certificate items into a single flat array
 */
export function flattenCertificateRecords(gridItems: CertificateGridItems | null | undefined): CertificateItem[] {
  if (!gridItems) return [];
  return [
    ...(gridItems.societyCertificates || []),
    ...(gridItems.wingCertificates || []),
    ...(gridItems.unitCertificates || []),
    ...(gridItems.floorCertificates || []),
  ];
}

export interface MatchedCertificateResult {
  certificate: CertificateItem | null;
  inheritedFrom: 'Direct' | 'Wing' | 'Apartment' | null;
}

/**
 * Flexible helper to resolve numerical wingDetailId from string name or ID across wings list and grid items
 */
export function findWingDetailId(
  wingValue: string | number | null | undefined,
  wingsList: WingOption[] = [],
  gridItems?: CertificateGridItems | null
): number | null {
  if (!wingValue || wingValue === 'all') return null;

  const valStr = String(wingValue).trim().toLowerCase();
  const valNum = Number(wingValue);

  // 1. Direct numeric match in wingsList
  if (!isNaN(valNum) && valNum > 0) {
    const directMatch = wingsList.find((w) => w.wingDetailId === valNum);
    if (directMatch && directMatch.wingDetailId != null) return directMatch.wingDetailId;
  }

  // 2. Name match in wingsList (exact, "Wing X", "X Wing", or substring)
  const nameMatch = wingsList.find((w) => {
    const name = (w.wingName ?? '').trim().toLowerCase();
    return (
      name === valStr ||
      name === `wing ${valStr}` ||
      name === `${valStr} wing` ||
      name === `block ${valStr}` ||
      name === `${valStr} block` ||
      name.includes(valStr)
    );
  });
  if (nameMatch && nameMatch.wingDetailId != null) return nameMatch.wingDetailId;

  // 3. Match in gridItems.wingCertificates (applicableToLabel or wingDetailId)
  if (gridItems?.wingCertificates) {
    const gridMatch = gridItems.wingCertificates.find((c) => {
      if (!isNaN(valNum) && valNum > 0 && c.wingDetailId === valNum) return true;
      const label = (c.applicableToLabel || '').trim().toLowerCase();
      return (
        label === valStr ||
        label === `wing ${valStr}` ||
        label === `${valStr} wing` ||
        label.includes(valStr)
      );
    });
    if (gridMatch?.wingDetailId) return gridMatch.wingDetailId;
  }

  return !isNaN(valNum) && valNum > 0 ? valNum : null;
}

export type UnitCertificateStatusType = 'direct' | 'wing' | 'apartment' | 'none';

export interface UnitStatusResolution {
  status: UnitCertificateStatusType;
  certificate: CertificateItem | null;
  certificateNumber?: string;
  certificateDate?: string | null;
  hasDocument?: boolean;
  documentGuid?: string | null;
  fileName?: string | null;
}

/**
/**
 * Helper to determine if a certificate (e.g. from wingCertificates or unitCertificates)
 * is actually an inherited/reflected Apartment-level certificate.
 */
export function isCertificateFromApartmentLevel(
  cert: CertificateItem | null | undefined,
  aptCert: CertificateItem | null | undefined
): boolean {
  if (!cert) return false;
  if (cert.entityType === 'S') return true;
  if (!aptCert) return false;

  const aptHasData = Boolean(
    (aptCert.propertyCertificateId && aptCert.propertyCertificateId > 0) ||
    (aptCert.documentGuid && aptCert.documentGuid !== 'temp-guid' && aptCert.documentGuid !== 'null') ||
    (aptCert.certificateNumber && aptCert.certificateNumber.trim() !== '')
  );
  if (!aptHasData) return false;

  // If cert has its own distinct certificate number different from the apartment certificate, it's direct!
  if (
    cert.certificateNumber &&
    aptCert.certificateNumber &&
    cert.certificateNumber.trim() !== '' &&
    aptCert.certificateNumber.trim() !== '' &&
    cert.certificateNumber.trim().toLowerCase() !== aptCert.certificateNumber.trim().toLowerCase()
  ) {
    return false;
  }

  if (cert.propertyCertificateId != null && aptCert.propertyCertificateId != null && cert.propertyCertificateId === aptCert.propertyCertificateId) {
    return true;
  }

  if (
    cert.certificateNumber &&
    aptCert.certificateNumber &&
    cert.certificateNumber.trim() !== '' &&
    cert.certificateNumber.trim().toLowerCase() === aptCert.certificateNumber.trim().toLowerCase()
  ) {
    return true;
  }

  if (
    cert.documentGuid &&
    aptCert.documentGuid &&
    cert.documentGuid !== 'temp-guid' &&
    cert.documentGuid === aptCert.documentGuid &&
    (!cert.certificateNumber || !aptCert.certificateNumber || cert.certificateNumber.trim().toLowerCase() === aptCert.certificateNumber.trim().toLowerCase())
  ) {
    return true;
  }

  return false;
}

/**
 * Helper to determine if a certificate (e.g. from unitCertificates)
 * is actually an inherited/reflected Wing-level certificate.
 */
export function isCertificateFromWingLevel(
  cert: CertificateItem | null | undefined,
  wingCert: CertificateItem | null | undefined
): boolean {
  if (!cert) return false;
  if (cert.entityType === 'W') return true;
  if (!wingCert) return false;

  const wingHasData = Boolean(
    (wingCert.propertyCertificateId && wingCert.propertyCertificateId > 0) ||
    (wingCert.documentGuid && wingCert.documentGuid !== 'temp-guid' && wingCert.documentGuid !== 'null') ||
    (wingCert.certificateNumber && wingCert.certificateNumber.trim() !== '')
  );
  if (!wingHasData) return false;

  // If cert has its own distinct certificate number different from the wing certificate, it's direct!
  if (
    cert.certificateNumber &&
    wingCert.certificateNumber &&
    cert.certificateNumber.trim() !== '' &&
    wingCert.certificateNumber.trim() !== '' &&
    cert.certificateNumber.trim().toLowerCase() !== wingCert.certificateNumber.trim().toLowerCase()
  ) {
    return false;
  }

  // If cert has its own distinct DB ID different from the wing certificate, it's direct!
  if (
    cert.propertyCertificateId != null &&
    wingCert.propertyCertificateId != null &&
    cert.propertyCertificateId !== wingCert.propertyCertificateId &&
    (cert.entityType === 'P' || cert.level === 'Unit')
  ) {
    return false;
  }

  // If DB IDs match
  if (cert.propertyCertificateId != null && wingCert.propertyCertificateId != null && cert.propertyCertificateId === wingCert.propertyCertificateId) {
    return true;
  }

  // If certificate numbers match
  if (
    cert.certificateNumber &&
    wingCert.certificateNumber &&
    cert.certificateNumber.trim() !== '' &&
    cert.certificateNumber.trim().toLowerCase() === wingCert.certificateNumber.trim().toLowerCase()
  ) {
    return true;
  }

  // If documentGuid matches and certificate numbers are not conflicting
  if (
    cert.documentGuid &&
    wingCert.documentGuid &&
    cert.documentGuid !== 'temp-guid' &&
    cert.documentGuid === wingCert.documentGuid &&
    (!cert.certificateNumber || !wingCert.certificateNumber || cert.certificateNumber.trim().toLowerCase() === wingCert.certificateNumber.trim().toLowerCase())
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the certificate status for an individual unit given the hierarchical grid items.
 */
export function resolveUnitCertificateStatus(
  gridItems: CertificateGridItems | null | undefined,
  certificateTypeId: number,
  unit: { propertyId?: number | null; propertyDetailsId?: number | null; unitNo?: string | null; wingDetailId?: number | null; wingName?: string | null },
  societyId?: number | null
): UnitStatusResolution {
  if (!gridItems) {
    return { status: 'none', certificate: null };
  }

  const { societyCertificates = [], wingCertificates = [], unitCertificates = [] } = gridItems;
  const propId = unit.propertyId != null ? Number(unit.propertyId) : null;
  const propDetailsId = unit.propertyDetailsId != null ? Number(unit.propertyDetailsId) : null;
  const unitNumber = (unit.unitNo || '').trim().toLowerCase();
  const wingId = unit.wingDetailId != null ? Number(unit.wingDetailId) : null;
  const unitWingName = (unit.wingName || '').trim().toLowerCase();
  const socId = societyId != null ? Number(societyId) : null;

  // Society / Apartment Inherited Match (resolved early to check inheritance)
  const societyMatch = societyCertificates.find((c) => {
    if (c.certificateTypeId !== certificateTypeId) return false;
    if (socId != null && (Number(c.societyDetailId) === socId || c.societyDetailId == null)) return true;
    return true;
  });

  const hasSocContent = Boolean(
    societyMatch && (
      (societyMatch.propertyCertificateId && societyMatch.propertyCertificateId > 0) ||
      (societyMatch.documentGuid && societyMatch.documentGuid !== 'temp-guid' && societyMatch.documentGuid !== 'null') ||
      (societyMatch.certificateNumber && societyMatch.certificateNumber.trim() !== '')
    )
  );

  // Wing Inherited Match (resolved early to check inheritance)
  const wingMatch = wingCertificates.find((c) => {
    if (c.certificateTypeId !== certificateTypeId) return false;
    if (wingId != null && Number(c.wingDetailId) === wingId) return true;
    if (unitWingName && c.applicableToLabel) {
      const cLabel = c.applicableToLabel.trim().toLowerCase();
      if (cLabel === unitWingName || cLabel === `wing ${unitWingName}` || cLabel === `${unitWingName} wing`) {
        return true;
      }
    }
    return false;
  });

  const isWingApt = isCertificateFromApartmentLevel(wingMatch, societyMatch);
  const hasWingContent = Boolean(
    wingMatch &&
    !isWingApt &&
    ((wingMatch.propertyCertificateId && wingMatch.propertyCertificateId > 0) ||
      wingMatch.certificateNumber?.trim() ||
      wingMatch.hasDocument ||
      (wingMatch.documentGuid && wingMatch.documentGuid !== 'temp-guid'))
  );

  // 1. Direct Unit Match
  const directMatch = unitCertificates.find((c) => {
    if (c.certificateTypeId !== certificateTypeId) return false;
    if (propId != null && (c.propertyId === propId || c.coveredPropertyIds?.includes(propId))) return true;
    if (propDetailsId != null && (c.propertyDetailsId === propDetailsId || c.coveredPropertyIds?.includes(propDetailsId))) return true;
    if (unitNumber && c.coveredUnitNumbers?.some((num) => num.trim().toLowerCase() === unitNumber)) return true;
    return false;
  });

  if (directMatch) {
    const isDirectApt = isCertificateFromApartmentLevel(directMatch, societyMatch);
    if (isDirectApt && hasSocContent) {
      const cert = societyMatch || directMatch;
      return {
        status: 'apartment',
        certificate: cert,
        certificateNumber: cert.certificateNumber,
        certificateDate: cert.certificateDate,
        hasDocument: cert.hasDocument,
        documentGuid: cert.documentGuid,
        fileName: cert.fileName,
      };
    }

    const isDirectWing = isCertificateFromWingLevel(directMatch, wingMatch);
    if (isDirectWing && hasWingContent) {
      const cert = wingMatch || directMatch;
      return {
        status: 'wing',
        certificate: cert,
        certificateNumber: cert.certificateNumber,
        certificateDate: cert.certificateDate,
        hasDocument: cert.hasDocument,
        documentGuid: cert.documentGuid,
        fileName: cert.fileName,
      };
    }

    const hasDirectContent = Boolean(
      directMatch.certificateNumber?.trim() ||
      directMatch.hasDocument ||
      (directMatch.documentGuid && directMatch.documentGuid !== 'temp-guid') ||
      (directMatch.propertyCertificateId && directMatch.propertyCertificateId > 0)
    );

    if (hasDirectContent && !isDirectApt && !isDirectWing) {
      return {
        status: 'direct',
        certificate: directMatch,
        certificateNumber: directMatch.certificateNumber,
        certificateDate: directMatch.certificateDate,
        hasDocument: directMatch.hasDocument,
        documentGuid: directMatch.documentGuid,
        fileName: directMatch.fileName,
      };
    }
  }

  // 2. Wing Inherited Match
  if (isWingApt && hasSocContent) {
    const cert = societyMatch || wingMatch || null;
    return {
      status: 'apartment',
      certificate: cert,
      certificateNumber: cert?.certificateNumber,
      certificateDate: cert?.certificateDate,
      hasDocument: cert?.hasDocument,
      documentGuid: cert?.documentGuid,
      fileName: cert?.fileName,
    };
  }

  if (wingMatch && hasWingContent) {
    return {
      status: 'wing',
      certificate: wingMatch,
      certificateNumber: wingMatch.certificateNumber,
      certificateDate: wingMatch.certificateDate,
      hasDocument: wingMatch.hasDocument,
      documentGuid: wingMatch.documentGuid,
      fileName: wingMatch.fileName,
    };
  }

  // 3. Society / Apartment Inherited Match
  if (societyMatch && hasSocContent) {
    return {
      status: 'apartment',
      certificate: societyMatch,
      certificateNumber: societyMatch.certificateNumber,
      certificateDate: societyMatch.certificateDate,
      hasDocument: societyMatch.hasDocument,
      documentGuid: societyMatch.documentGuid,
      fileName: societyMatch.fileName,
    };
  }

  // 3. Society / Apartment Inherited Match
  if (societyMatch && hasSocContent) {
    return {
      status: 'apartment',
      certificate: societyMatch,
      certificateNumber: societyMatch.certificateNumber,
      certificateDate: societyMatch.certificateDate,
      hasDocument: societyMatch.hasDocument,
      documentGuid: societyMatch.documentGuid,
      fileName: societyMatch.fileName,
    };
  }

  return { status: 'none', certificate: null };
}

export type FloorCertificateStatusType = 'direct' | 'property' | 'none';

export interface FloorStatusResolution {
  status: FloorCertificateStatusType;
  certificate: CertificateItem | null;
  certificateNumber?: string;
  certificateDate?: string | null;
  hasDocument?: boolean;
  documentGuid?: string | null;
  fileName?: string | null;
}

/**
 * Resolves the certificate status for a floor in an Individual property.
 */
export function resolveFloorCertificateStatus(
  floorCertificates: CertificateItem[] | null | undefined,
  propertyCertificate: CertificateItem | null | undefined,
  certificateTypeId: number,
  floorDetailsId: number
): FloorStatusResolution {
  // 1. Check direct floor certificate
  if (Array.isArray(floorCertificates)) {
    const directMatch = floorCertificates.find((c) => {
      if (c.certificateTypeId !== certificateTypeId) return false;
      const cFloorId = c.propertyDetailsId != null ? Number(c.propertyDetailsId) : null;
      return cFloorId === Number(floorDetailsId);
    });

    const hasDirectContent = Boolean(
      directMatch && (directMatch.certificateNumber?.trim() || directMatch.hasDocument || directMatch.documentGuid)
    );

    if (directMatch && hasDirectContent) {
      return {
        status: 'direct',
        certificate: directMatch,
        certificateNumber: directMatch.certificateNumber,
        certificateDate: directMatch.certificateDate,
        hasDocument: directMatch.hasDocument,
        documentGuid: directMatch.documentGuid,
        fileName: directMatch.fileName,
      };
    }
  }

  // 2. Check property-wide inherited certificate
  const hasPropContent = Boolean(
    propertyCertificate &&
    propertyCertificate.certificateTypeId === certificateTypeId &&
    (propertyCertificate.certificateNumber?.trim() || propertyCertificate.hasDocument || propertyCertificate.documentGuid)
  );

  if (propertyCertificate && hasPropContent) {
    return {
      status: 'property',
      certificate: propertyCertificate,
      certificateNumber: propertyCertificate.certificateNumber,
      certificateDate: propertyCertificate.certificateDate,
      hasDocument: propertyCertificate.hasDocument,
      documentGuid: propertyCertificate.documentGuid,
      fileName: propertyCertificate.fileName,
    };
  }

  return { status: 'none', certificate: null };
}

/**
 * Retrieves the matching certificate for the given UI level, certificateTypeId, wingDetailId, propertyId, and societyId.
 * Hierarchical mapping:
 * - Apartment level: ONLY societyDetailId match. Strict: Never Wing or Unit.
 * - Wing level: wingDetailId match -> falls back to Apartment inherited banner. Strict: Never Unit.
 * - Unit level: strict unit propertyId/detailsId match -> wingDetailId match -> societyDetailId match.
 * - Entire Property level: ONLY property-level match. Strict: Never Floor-level.
 * - Floor level: floorDetailsId match -> property-level match fallback.
 */
export function getActiveCertificateForLevel(
  gridItems: CertificateGridItems | null | undefined,
  selectedLevel: 'Apartment' | 'Wing' | 'Unit' | 'Entire Property' | 'Property' | 'Floor' | string,
  selectedTypeId: number,
  selectedWingDetailId?: number | null,
  selectedPropertyId?: number | string | null,
  selectedSocietyId?: number | string | null,
  selectedPropertyIds?: (number | string)[] | null,
  selectedUnitNumbers?: string[] | null,
  selectedFloorDetailsId?: number | null
): MatchedCertificateResult {
  if (!gridItems) return { certificate: null, inheritedFrom: null };

  const { societyCertificates = [], wingCertificates = [], unitCertificates = [], floorCertificates = [] } = gridItems;
  const numericPropId = selectedPropertyId != null && String(selectedPropertyId).trim() !== '' ? Number(selectedPropertyId) : null;
  const numericWingId = selectedWingDetailId != null ? Number(selectedWingDetailId) : null;
  const numericSocietyId = selectedSocietyId != null ? Number(selectedSocietyId) : null;

  // CASE 1: Apartment Level - Must ONLY display certificates explicitly saved at Apartment/Society level
  if (selectedLevel === 'Apartment') {
    const societyMatch = societyCertificates.find(
      (c) => c.certificateTypeId === selectedTypeId && (numericSocietyId != null ? c.societyDetailId === numericSocietyId || c.societyDetailId == null : true)
    );
    const hasSocContent = Boolean(
      societyMatch && (societyMatch.certificateNumber?.trim() || societyMatch.hasDocument || societyMatch.documentGuid || societyMatch.status === 'Active')
    );
    if (societyMatch && hasSocContent) {
      return { certificate: societyMatch, inheritedFrom: 'Direct' };
    }
    return { certificate: null, inheritedFrom: null };
  }

  // CASE 2: Wing Level - Must ONLY display certificates for selected Wing (or fallback to Apartment inherited)
  // STRICT RULE: Never display Unit-level certificates inside Wing Level
  if (selectedLevel === 'Wing') {
    const societyMatch = societyCertificates.find(
      (c) => c.certificateTypeId === selectedTypeId && (numericSocietyId != null ? Number(c.societyDetailId) === numericSocietyId || c.societyDetailId == null : true)
    );
    const hasSocContent = Boolean(
      societyMatch && (societyMatch.certificateNumber?.trim() || societyMatch.hasDocument || societyMatch.documentGuid || societyMatch.status === 'Active')
    );

    const wingMatch = numericWingId != null
      ? wingCertificates.find(
          (c) => c.certificateTypeId === selectedTypeId && Number(c.wingDetailId) === numericWingId
        )
      : null;

    const isWingApt = isCertificateFromApartmentLevel(wingMatch, societyMatch);
    if (isWingApt && hasSocContent) {
      return { certificate: societyMatch || wingMatch || null, inheritedFrom: 'Apartment' };
    }

    const hasWingContent = Boolean(
      wingMatch && !isWingApt && (wingMatch.certificateNumber?.trim() || wingMatch.hasDocument || wingMatch.documentGuid || wingMatch.status === 'Active')
    );
    if (wingMatch && hasWingContent) {
      return { certificate: wingMatch, inheritedFrom: 'Direct' };
    }

    // Inherited from Apartment Level
    if (societyMatch && hasSocContent) {
      return { certificate: societyMatch, inheritedFrom: 'Apartment' };
    }

    return { certificate: null, inheritedFrom: null };
  }

  // CASE 3: Unit Level
  if (selectedLevel === 'Unit') {
    const propIdList: number[] = [];
    if (numericPropId != null) propIdList.push(numericPropId);
    if (Array.isArray(selectedPropertyIds)) {
      selectedPropertyIds.forEach((id) => {
        const num = Number(id);
        if (!isNaN(num) && num > 0 && !propIdList.includes(num)) {
          propIdList.push(num);
        }
      });
    }

    const unitNumberList = (selectedUnitNumbers || []).map((n) => String(n).trim().toLowerCase());

    const societyMatch = societyCertificates.find(
      (c) => c.certificateTypeId === selectedTypeId && (numericSocietyId != null ? Number(c.societyDetailId) === numericSocietyId || c.societyDetailId == null : true)
    );
    const hasSocContent = Boolean(
      societyMatch && (societyMatch.certificateNumber?.trim() || societyMatch.hasDocument || societyMatch.documentGuid || societyMatch.status === 'Active')
    );

    const wingMatch = numericWingId != null
      ? wingCertificates.find(
          (c) => c.certificateTypeId === selectedTypeId && Number(c.wingDetailId) === numericWingId
        )
      : null;

    const isWingApt = isCertificateFromApartmentLevel(wingMatch, societyMatch);
    const hasWingContent = Boolean(
      wingMatch && !isWingApt && (wingMatch.certificateNumber?.trim() || wingMatch.hasDocument || wingMatch.documentGuid || wingMatch.status === 'Active')
    );

    // Priority 1: Direct Unit Match
    if (propIdList.length > 0 || unitNumberList.length > 0) {
      const unitMatch = unitCertificates.find((c) => {
        if (c.certificateTypeId !== selectedTypeId) return false;
        if (c.propertyId != null && propIdList.includes(c.propertyId)) return true;
        if (c.propertyDetailsId != null && propIdList.includes(c.propertyDetailsId)) return true;
        if (c.coveredPropertyIds && c.coveredPropertyIds.some((id) => propIdList.includes(id))) return true;
        if (c.coveredUnitNumbers && c.coveredUnitNumbers.some((num) => unitNumberList.includes(String(num).trim().toLowerCase()))) return true;
        return false;
      });

      const isUnitApt = isCertificateFromApartmentLevel(unitMatch, societyMatch);
      if (isUnitApt && hasSocContent) {
        return { certificate: societyMatch || unitMatch || null, inheritedFrom: 'Apartment' };
      }

      const isUnitWing = isCertificateFromWingLevel(unitMatch, wingMatch);
      if (isUnitWing && hasWingContent) {
        return { certificate: wingMatch || unitMatch || null, inheritedFrom: 'Wing' };
      }

      const hasUnitContent = Boolean(
        unitMatch && !isUnitApt && !isUnitWing && (unitMatch.certificateNumber?.trim() || unitMatch.hasDocument || unitMatch.documentGuid || (unitMatch.propertyCertificateId && unitMatch.propertyCertificateId > 0))
      );
      if (unitMatch && hasUnitContent) return { certificate: unitMatch, inheritedFrom: 'Direct' };
    }

    // Priority 2: Wing Level Match
    if (isWingApt && hasSocContent) {
      return { certificate: societyMatch || wingMatch || null, inheritedFrom: 'Apartment' };
    }
    if (wingMatch && hasWingContent) {
      return { certificate: wingMatch, inheritedFrom: 'Wing' };
    }

    // Priority 3: Apartment Level Match
    if (societyMatch && hasSocContent) {
      return { certificate: societyMatch, inheritedFrom: 'Apartment' };
    }

    return { certificate: null, inheritedFrom: null };
  }

  // CASE 4: Entire Property Level (Individual properties)
  // STRICT RULE: Never display a Floor-level certificate inside Entire Property Level
  if (selectedLevel === 'Entire Property' || selectedLevel === 'Property') {
    const propMatch = (floorCertificates || []).find(
      (c) => c.certificateTypeId === selectedTypeId && (c.propertyDetailsId == null || c.propertyDetailsId === 0)
    ) || (societyCertificates || []).find(
      (c) => c.certificateTypeId === selectedTypeId
    );
    const hasPropContent = Boolean(
      propMatch && (propMatch.certificateNumber?.trim() || propMatch.hasDocument || propMatch.documentGuid || propMatch.status === 'Active')
    );
    if (propMatch && hasPropContent) {
      return { certificate: propMatch, inheritedFrom: 'Direct' };
    }
    return { certificate: null, inheritedFrom: null };
  }

  // CASE 5: Floor Level (Individual properties)
  if (selectedLevel === 'Floor') {
    // Priority 1: Direct Floor Match
    if (selectedFloorDetailsId != null) {
      const floorMatch = (floorCertificates || []).find(
        (c) => c.certificateTypeId === selectedTypeId && Number(c.propertyDetailsId) === Number(selectedFloorDetailsId)
      );
      const hasFloorContent = Boolean(
        floorMatch && (floorMatch.certificateNumber?.trim() || floorMatch.hasDocument || floorMatch.documentGuid)
      );
      if (floorMatch && hasFloorContent) {
        return { certificate: floorMatch, inheritedFrom: 'Direct' };
      }
    }

    // Priority 2: Entire Property Match
    const propMatch = (floorCertificates || []).find(
      (c) => c.certificateTypeId === selectedTypeId && (c.propertyDetailsId == null || c.propertyDetailsId === 0)
    ) || (societyCertificates || []).find(
      (c) => c.certificateTypeId === selectedTypeId
    );
    const hasPropContent = Boolean(
      propMatch && (propMatch.certificateNumber?.trim() || propMatch.hasDocument || propMatch.documentGuid || propMatch.status === 'Active')
    );
    if (propMatch && hasPropContent) {
      return { certificate: propMatch, inheritedFrom: 'Property' as unknown as 'Apartment' };
    }

    return { certificate: null, inheritedFrom: null };
  }

  return { certificate: null, inheritedFrom: null };
}
