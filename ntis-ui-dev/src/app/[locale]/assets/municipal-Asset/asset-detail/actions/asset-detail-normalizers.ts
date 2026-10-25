import type {
  AssetChildAssetItem,
  AssetDocumentListItem,
  AssetFieldDefinitionItem,
  AssetFloorDetailItem,
} from "@/types/municipal-asset/detail-tabs.types";

export function unwrapApiPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const body = data as Record<string, unknown>;
  return body.items ?? body.Items ?? body.data ?? body.Data ?? body.result ?? body.Result ?? data;
}

export function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const payload = unwrapApiPayload(data);
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const body = payload as Record<string, unknown>;
  const candidates = [body.items, body.Items, body.data, body.Data, body.results, body.Results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function pickFirstNumber(source: Record<string, unknown>, keys: string[]): number | string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function pickFirstString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

export function normalizeAssetFieldDefinition(raw: unknown): AssetFieldDefinitionItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = item.id ?? item.Id;
  const fieldName = pickFirstString(item, ["fieldName", "FieldName", "fieldCode", "FieldCode"]);
  if ((typeof id !== "number" && typeof id !== "string") || !fieldName) return null;

  return {
    id,
    fieldName,
    fieldLabel: pickFirstString(item, ["fieldLabel", "FieldLabel"]),
    fieldType: pickFirstString(item, ["fieldType", "FieldType"]),
    fieldGroup: pickFirstString(item, ["fieldGroup", "FieldGroup"]),
    displayOrder: pickFirstNumber(item, ["displayOrder", "DisplayOrder"]),
  };
}

export function normalizeAssetFloorDetail(raw: unknown, index?: number): AssetFloorDetailItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = item.id ?? item.Id ?? item.floorId ?? (index !== undefined ? `floor-${index}` : undefined);
  if (typeof id !== "number" && typeof id !== "string") return null;

  const namesObj = (item.names ?? item.Names ?? {}) as Record<string, unknown>;

  return {
    ...(item as Record<string, unknown>),
    id,
    assetId: pickFirstNumber(item, ["assetId", "AssetId"]),
    floorId: pickFirstNumber(item, ["floorId", "FloorId"]),
    floorName: pickFirstString(item, ["floorName", "FloorName"]) ?? pickFirstString(namesObj, ["floorName", "FloorName"]),
    subFloorName: pickFirstString(item, ["subFloorName", "SubFloorName"]) ?? pickFirstString(namesObj, ["subFloorName", "SubFloorName"]),
    constructionYear: pickFirstString(item, ["constructionYear", "ConstructionYear"]),
    assessmentYear: pickFirstString(item, ["assessmentYear", "AssessmentYear"]),
    constructionTypeName: pickFirstString(item, ["constructionTypeName", "ConstructionTypeName"]) ?? pickFirstString(namesObj, ["constructionTypeName", "ConstructionTypeName"]),
    typeOfUseName: pickFirstString(item, ["typeOfUseName", "TypeOfUseName"]) ?? pickFirstString(namesObj, ["typeOfUseName", "TypeOfUseName"]),
    subTypeOfUseName: pickFirstString(item, ["subTypeOfUseName", "SubTypeOfUseName"]) ?? pickFirstString(namesObj, ["subTypeOfUseName", "SubTypeOfUseName"]),
    carpetAreaSqMeter: pickFirstNumber(item, ["carpetAreaSqMeter", "CarpetAreaSqMeter"]),
    carpetAreaSqFeet: pickFirstNumber(item, ["carpetAreaSqFeet", "CarpetAreaSqFeet"]),
    builtUpAreaSqMeter: pickFirstNumber(item, ["builtUpAreaSqMeter", "BuiltUpAreaSqMeter"]),
    builtUpAreaSqFeet: pickFirstNumber(item, ["builtUpAreaSqFeet", "BuiltUpAreaSqFeet"]),
    noOfRooms: pickFirstNumber(item, ["noOfRooms", "NoOfRooms"]),
    subAssetCount: pickFirstNumber(item, ["subAssetCount", "SubAssetCount"]),
    baseValue: pickFirstNumber(item, ["baseValue", "BaseValue"]),
    capitalValue: pickFirstNumber(item, ["capitalValue", "CapitalValue"]),
    marketValue: pickFirstNumber(item, ["marketValue", "MarketValue"]),
    cvBaseRate: pickFirstNumber(item, ["cvBaseRate", "CVBaseRate", "sdrrRate", "SdrrRate", "baseRate", "BaseRate"]),
    cvFloorFactor: pickFirstNumber(item, ["cvFloorFactor", "CVFloorFactor", "floorFactor", "FloorFactor"]),
    cvAgeFactor: pickFirstNumber(item, ["cvAgeFactor", "CVAgeFactor", "ageFactor", "AgeFactor"]),
    cvNatureFactor: pickFirstNumber(item, ["cvNatureFactor", "CVNatureFactor", "natureFactor", "NatureFactor", "itsFactor", "ItsFactor"]),
    cvUseFactor: pickFirstNumber(item, ["cvUseFactor", "CVUseFactor", "useFactor", "UseFactor"]),
    isRented: Boolean(item.isRented ?? item.IsRented ?? false),
  };
}

export function normalizeAssetDocument(raw: unknown): AssetDocumentListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = item.assetDocumentId ?? item.AssetDocumentId ?? item.documentId ?? item.DocumentId ?? item.id;
  if (typeof id !== "number" && typeof id !== "string") return null;

  const fileName =
    pickFirstString(item, ["fileName", "FileName", "originalFileName", "OriginalFileName", "documentFileName", "DocumentFileName"]) ||
    `document-${id}`;
  const name =
    pickFirstString(item, ["documentName", "DocumentName", "name", "Name", "title", "Title", "documentTitle", "DocumentTitle", "documentTypeName", "DocumentTypeName"]) ||
    fileName;

  return {
    id,
    assetId: (item.assetId ?? item.AssetId) as number | string | null | undefined,
    documentGuid: pickFirstString(item, ['documentGuid', 'DocumentGuid']),
    name,
    fileName,
    contentType: pickFirstString(item, ["contentType", "ContentType", "mimeType", "MimeType"]),
    uploadedDate: pickFirstString(item, ["uploadedDate", "UploadedDate", "createdDate", "CreatedDate", "createdOn", "CreatedOn"]),
    fileSize: (item.fileSize ?? item.FileSize ?? item.size ?? item.Size) as number | string | null | undefined,
    status: pickFirstString(item, ["status", "Status", "documentStatus", "DocumentStatus"]),
  };
}

export function unwrapAssetDocumentList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const body = data as Record<string, unknown>;
  const candidates = [body.items, body.Items, body.data, body.Data, body.documents, body.Documents, body.result, body.Result];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeChildAssetItem(entry: unknown, index?: number): AssetChildAssetItem | null {
  if (!entry || typeof entry !== "object") return null;
  const item = entry as Record<string, unknown>;
  const id = item.id ?? item.Id ?? item.assetId ?? item.AssetId ?? item.assetNo ?? (index !== undefined ? `child-${index}` : undefined);
  if (typeof id !== "number" && typeof id !== "string") return null;

  const rentersRaw = item.renterDetails ?? item.RenterDetails;
  const renters = Array.isArray(rentersRaw) ? rentersRaw : [];
  const renter = (renters[0] ?? {}) as Record<string, unknown>;

  return {
    id,
    authorityId: pickFirstNumber(item, ["authorityId", "AuthorityId"]),
    organizationId: pickFirstNumber(item, ["organizationId", "OrganizationId"]),
    departmentId: pickFirstNumber(item, ["departmentId", "DepartmentId"]),
    assetId: pickFirstNumber(item, ["assetId", "AssetId"]),
    inventoryBatchId: pickFirstNumber(item, ["inventoryBatchId", "InventoryBatchId"]),
    assetNo: pickFirstString(item, ["assetNo", "AssetNo"]),
    assetName: pickFirstString(item, ["assetName", "AssetName"]),
    assetCategoryId: pickFirstNumber(item, ["assetCategoryId", "AssetCategoryId"]),
    assetTypeId: pickFirstNumber(item, ["assetTypeId", "AssetTypeId"]),
    assetTypeName: pickFirstString(item, ["type", "Type", "assetTypeName", "AssetTypeName"]),
    assetCategoryName: pickFirstString(item, ["category", "Category", "assetCategoryName", "AssetCategoryName"]),
    parentAssetId: pickFirstNumber(item, ["parentAssetId", "ParentAssetId"]),
    parentAssetName: pickFirstString(item, ["parentAssetName", "ParentAssetName"]),
    hierarchyLevel: pickFirstNumber(item, ["hierarchyLevel", "HierarchyLevel"]),
    hierarchyPath: pickFirstString(item, ["hierarchyPath", "HierarchyPath"]),
    address: pickFirstString(item, ["address", "Address"]),
    wardId: pickFirstNumber(item, ["wardId", "WardId"]),
    zoneId: pickFirstNumber(item, ["zoneId", "ZoneId"]),
    subZoneId: pickFirstNumber(item, ["subZoneId", "SubZoneId"]),
    moujaId: pickFirstNumber(item, ["moujaId", "MoujaId"]),
    latitude: pickFirstNumber(item, ["latitude", "Latitude"]),
    longitude: pickFirstNumber(item, ["longitude", "Longitude"]),
    csn: pickFirstString(item, ["csn", "CSN"]),
    typeOfUseId: pickFirstNumber(item, ["typeOfUseId", "TypeOfUseId"]),
    subTypeOfUseId: pickFirstNumber(item, ["subTypeOfUseId", "SubTypeOfUseId"]),
    complexName: null,
    shopUnitName: null,
    unitNo: null,
    totalAreaSqFt: pickFirstNumber(renter, ["totalAreaSqFt", "TotalAreaSqFt"]),
    landAreaSqMeter: pickFirstNumber(item, ["landAreaSqMeter", "LandAreaSqMeter"]),
    calculatedCapitalValue: null,
    purchaseValue: pickFirstNumber(item, ["purchaseValue", "PurchaseValue"]),
    purchaseDate: pickFirstString(item, ["purchaseDate", "PurchaseDate"]),
    marketValue: pickFirstNumber(item, ["marketValue", "MarketValue"]),
    marketValueDate: pickFirstString(item, ["marketValueDate", "MarketValueDate"]),
    capitalValue: pickFirstNumber(item, ["capitalValue", "CapitalValue"]),
    lastCVCalculationDate: pickFirstString(item, ["lastCVCalculationDate", "LastCVCalculationDate"]),
    currentBookValue: pickFirstNumber(item, ["currentBookValue", "CurrentBookValue"]),
    depreciationRate: pickFirstNumber(item, ["depreciationRate", "DepreciationRate"]),
    ownershipType: pickFirstString(item, ["ownershipType", "OwnershipType"]),
    isRevenueGenerating:
      typeof item.isRevenueGenerating === "boolean"
        ? item.isRevenueGenerating
        : typeof item.IsRevenueGenerating === "boolean"
          ? item.IsRevenueGenerating
          : null,
    operationalControl: pickFirstString(item, ["operationalControl", "OperationalControl"]),
    assetCondition: pickFirstString(item, ["assetCondition", "AssetCondition"]),
    createdDate: pickFirstString(item, ["createdDate", "CreatedDate"]),
    subUnitsDetailsId: pickFirstNumber(item, ["subUnitsDetailsId", "SubUnitsDetailsId"]),
    floorDetailsId: pickFirstNumber(item, ["floorDetailsId", "FloorDetailsId"]),
    updatedDate: pickFirstString(item, ["updatedDate", "UpdatedDate"]),
    authorityName: pickFirstString(item, ["authorityName", "AuthorityName"]),
    organizationName: pickFirstString(item, ["organizationName", "OrganizationName"]),
    departmentName: pickFirstString(item, ["departmentName", "DepartmentName"]),
    moujaName: pickFirstString(item, ["moujaName", "MoujaName"]),
    typeOfUseName: pickFirstString(item, ["typeOfUse", "TypeOfUse", "typeOfUseName", "TypeOfUseName"]),
    subTypeOfUseName: pickFirstString(item, ["subTypeOfUse", "SubTypeOfUse", "subTypeOfUseName", "SubTypeOfUseName"]),
    floorName: pickFirstString(item, ["floorName", "FloorName"]),
    fieldValues: Array.isArray(item.fieldValues) ? item.fieldValues : Array.isArray(item.FieldValues) ? item.FieldValues : null,
    hasLift: typeof item.hasLift === "boolean" ? item.hasLift : typeof item.HasLift === "boolean" ? item.HasLift : null,
    wardName: pickFirstString(item, ["wardName", "WardName"]),
    zoneName: pickFirstString(item, ["zoneName", "ZoneName"]),
    builtUpAreaSqMeter: pickFirstNumber(item, ["builtUpAreaSqMeter", "BuiltUpAreaSqMeter"]),
    builtUpAreaSqFeet: pickFirstNumber(item, ["builtUpAreaSqFeet", "BuiltUpAreaSqFeet"]),
    carpetAreaSqMeter: pickFirstNumber(item, ["carpetAreaSqMeter", "CarpetAreaSqMeter"]),
    carpetAreaSqFeet: pickFirstNumber(item, ["carpetAreaSqFeet", "CarpetAreaSqFeet"]),
    status: pickFirstString(item, ["status", "Status"]),
    occupancyStatus: pickFirstString(item, ["occupancyStatus", "OccupancyStatus"]),
    isActive: typeof item.isActive === "boolean" ? item.isActive : typeof item.IsActive === "boolean" ? item.IsActive : null,
    renterName: pickFirstString(renter, ["renterName", "RenterName"]),
    gstNo: pickFirstString(renter, ["gstNo", "GstNo"]),
    aadhaarCardNo: pickFirstString(renter, ["aadhaarCardNo", "AadhaarCardNo"]),
    panCardNo: pickFirstString(renter, ["panCardNo", "PanCardNo"]),
    mobileNo: pickFirstString(renter, ["mobileNo", "MobileNo"]),
    emailId: pickFirstString(renter, ["emailId", "EmailId"]),
    leaseRentType: pickFirstString(renter, ["leaseRentType", "LeaseRentType"]),
    fromDate: pickFirstString(renter, ["fromDate", "FromDate"]),
    toDate: pickFirstString(renter, ["toDate", "ToDate"]),
    duration: pickFirstNumber(renter, ["duration", "Duration"]),
    rentFrequency: pickFirstString(renter, ["rentFrequency", "RentFrequency"]),
    rentAmount: pickFirstNumber(renter, ["rentAmount", "RentAmount"]),
    securityDeposit: pickFirstNumber(renter, ["securityDeposit", "SecurityDeposit"]),
    depositType: pickFirstString(renter, ["depositType", "DepositType"]),
    agreementId: pickFirstString(renter, ["agreementId", "AgreementId"]),
    incrementFrequency: pickFirstString(renter, ["incrementFrequency", "IncrementFrequency"]),
    incrementType: pickFirstString(renter, ["incrementType", "IncrementType"]),
    incrementValue: pickFirstNumber(renter, ["incrementValue", "IncrementValue"]),
    incrementMethod: pickFirstString(renter, ["incrementMethod", "IncrementMethod"]),
    increment: pickFirstNumber(renter, ["increment", "Increment"]),
    incrementStatus:
      typeof renter.incrementStatus === "boolean"
        ? renter.incrementStatus
        : typeof renter.IncrementStatus === "boolean"
          ? renter.IncrementStatus
          : null,
    rentMonthly: pickFirstNumber(renter, ["rentMonthly", "RentMonthly"]),
    renterDetails: Array.isArray(rentersRaw)
      ? (rentersRaw as Record<string, unknown>[]).map((r, idx) => ({
        id: (r.id ?? r.Id ?? `renter-${idx}`) as string | number,
        renterName: pickFirstString(r, ["renterName", "RenterName"]),
        gstNo: pickFirstString(r, ["gstNo", "GstNo"]),
        aadhaarCardNo: pickFirstString(r, ["aadhaarCardNo", "AadhaarCardNo"]),
        panCardNo: pickFirstString(r, ["panCardNo", "PanCardNo"]),
        mobileNo: pickFirstString(r, ["mobileNo", "MobileNo"]),
        emailId: pickFirstString(r, ["emailId", "EmailId"]),
        leaseRentType: pickFirstString(r, ["leaseRentType", "LeaseRentType"]),
        fromDate: pickFirstString(r, ["fromDate", "FromDate"]),
        toDate: pickFirstString(r, ["toDate", "ToDate"]),
        duration: pickFirstNumber(r, ["duration", "Duration"]),
        rentFrequency: pickFirstString(r, ["rentFrequency", "RentFrequency"]),
        rentAmount: pickFirstNumber(r, ["rentAmount", "RentAmount"]),
        securityDeposit: pickFirstNumber(r, ["securityDeposit", "SecurityDeposit"]),
        depositType: pickFirstString(r, ["depositType", "DepositType"]),
        agreementId: pickFirstString(r, ["agreementId", "AgreementId"]),
        totalAreaSqFt: pickFirstNumber(r, ["totalAreaSqFt", "TotalAreaSqFt"]),
        incrementFrequency: pickFirstString(r, ["incrementFrequency", "IncrementFrequency"]),
        incrementType: pickFirstString(r, ["incrementType", "IncrementType"]),
        incrementValue: pickFirstNumber(r, ["incrementValue", "IncrementValue"]),
        incrementMethod: pickFirstString(r, ["incrementMethod", "IncrementMethod"]),
        increment: pickFirstNumber(r, ["increment", "Increment"]),
        incrementStatus: typeof r.incrementStatus === "boolean" ? r.incrementStatus : typeof r.IncrementStatus === "boolean" ? r.IncrementStatus : null,
        rentMonthly: pickFirstNumber(r, ["rentMonthly", "RentMonthly"]),
      }))
      : null,
    roomWiseSubmissions: (() => {
      const raw = item.roomWiseSubmissions ?? item.RoomWiseSubmissions;
      if (!Array.isArray(raw)) return null;
      return (raw as Record<string, unknown>[]).map((r, idx) => ({
        id: (r.id ?? r.Id ?? `room-${idx}`) as string | number,
        roomNo: pickFirstString(r, ["roomNo", "RoomNo"]),
        roomType: pickFirstString(r, ["roomType", "RoomType"]),
        shape: pickFirstString(r, ["shape", "Shape"]),
        submissionType: pickFirstString(r, ["submissionType", "SubmissionType"]),
        lengthMtr: pickFirstNumber(r, ["lengthMtr", "LengthMtr"]),
        widthMtr: pickFirstNumber(r, ["widthMtr", "WidthMtr"]),
        heightMtr: pickFirstNumber(r, ["heightMtr", "HeightMtr"]),
        noOfRooms: pickFirstNumber(r, ["noOfRooms", "NoOfRooms"]),
        outerYesNo: typeof r.outerYesNo === "boolean" ? r.outerYesNo : typeof r.OuterYesNo === "boolean" ? r.OuterYesNo : null,
        minusYesNo: typeof r.minusYesNo === "boolean" ? r.minusYesNo : typeof r.MinusYesNo === "boolean" ? r.MinusYesNo : null,
      }));
    })(),
    floorDetails: (() => {
      const raw = item.floorDetails ?? item.FloorDetails;
      if (!Array.isArray(raw)) return null;
      return (raw as Record<string, unknown>[]).map((f, idx) => {
        const fNamesObj = (f.names ?? f.Names ?? {}) as Record<string, unknown>;
        return {
          ...(f as Record<string, unknown>),
          id: (f.id ?? f.Id ?? f.floorId ?? `floor-${idx}`) as string | number,
          floorName: pickFirstString(f, ["floorName", "FloorName"]) ?? pickFirstString(fNamesObj, ["floorName", "FloorName"]),
          subFloorName: pickFirstString(f, ["subFloorName", "SubFloorName"]) ?? pickFirstString(fNamesObj, ["subFloorName", "SubFloorName"]),
          constructionYear: pickFirstString(f, ["constructionYear", "ConstructionYear"]),
          constructionTypeName: pickFirstString(f, ["constructionTypeName", "ConstructionTypeName"]) ?? pickFirstString(fNamesObj, ["constructionTypeName", "ConstructionTypeName"]),
          typeOfUseName: pickFirstString(f, ["typeOfUseName", "TypeOfUseName"]) ?? pickFirstString(fNamesObj, ["typeOfUseName", "TypeOfUseName"]),
          subTypeOfUseName: pickFirstString(f, ["subTypeOfUseName", "SubTypeOfUseName"]) ?? pickFirstString(fNamesObj, ["subTypeOfUseName", "SubTypeOfUseName"]),
          carpetAreaSqMeter: pickFirstNumber(f, ["carpetAreaSqMeter", "CarpetAreaSqMeter"]),
          carpetAreaSqFeet: pickFirstNumber(f, ["carpetAreaSqFeet", "CarpetAreaSqFeet"]),
          builtUpAreaSqMeter: pickFirstNumber(f, ["builtUpAreaSqMeter", "BuiltUpAreaSqMeter"]),
          builtUpAreaSqFeet: pickFirstNumber(f, ["builtUpAreaSqFeet", "BuiltUpAreaSqFeet"]),
          noOfRooms: pickFirstNumber(f, ["noOfRooms", "NoOfRooms"]),
          subAssetCount: pickFirstNumber(f, ["subAssetCount", "SubAssetCount"]),
          capitalValue: pickFirstNumber(f, ["capitalValue", "CapitalValue"]),
          marketValue: pickFirstNumber(f, ["marketValue", "MarketValue"]),
        };
      });
    })(),
  };
}
