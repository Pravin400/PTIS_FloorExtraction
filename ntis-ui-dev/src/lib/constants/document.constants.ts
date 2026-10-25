export const DOCUMENT_TYPE = {
  Certificate: 'Certificate',
  Permit: 'Permit',
  Invoice: 'Invoice',
  Contract: 'Contract',
  Report: 'Report',
  Proof: 'Proof',
  Application: 'Application',
  Approval: 'Approval',
  Photo: 'Photo',
  UlbDocument: 'UlbDocument',
} as const;

export const BINDING_PURPOSE = {
  MainDocument: 'MainDocument',
  SupportingDocument: 'SupportingDocument',
  ProofDocument: 'ProofDocument',
  ApprovalDocument: 'ApprovalDocument',
  ApplicationDocument: 'ApplicationDocument',
  Photo: 'Photo',
} as const;

export const REFERENCE_TABLE = {
  PropertyCertificate: 'PropertyCertificates',
  PropertyDiscount: 'PropertySocialDetails',
  PropertyPhoto: 'PropertyPhoto',
  SocietyPhoto: 'SocietyPhoto',
  WingPhoto: 'WingPhoto',
  PropertyOwner: 'PropertyOwners',
  BuildingPermission: 'BuildingPermissions',
  RenterMast: 'RenterMast',
  UlbDocument: 'ULBDocument',
} as const;

export const DEPARTMENT_ID = {
  PTIS: 1,
} as const;

export const MODULE_ID = {
  PropertyCertificate: 1,
  PropertyPhoto: 1,
  SocietyPhoto: 1,
  WingPhoto: 1,
  PropertyDiscount: 1,
  PropertySocialDetails: 1,
  RenterMast: 1,
  UlbDocument: 1,
} as const;

/** PTIS.ULBDocumentType.DocumentTypeCode values used by the Tax Zoning "Certified Documents" section. */
export const TAX_ZONING_DOCUMENT_TYPE_CODE = {
  LIST: 'TAX_ZONING_DOCUMENT_LIST',
  MAP: 'TAX_ZONING_DOCUMENT_MAP',
} as const;
