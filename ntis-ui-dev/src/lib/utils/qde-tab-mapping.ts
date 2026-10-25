export interface QdeTabMapping {
  mainTabId: string;
  qdePath: string;
}

export const MAIN_TO_QDE_MAP: Record<string, QdeTabMapping> = {
  propertydetails: { mainTabId: 'propertydetails', qdePath: 'Property' },
  kycdetails: { mainTabId: 'kycdetails', qdePath: 'Kyc' },
  societydetails: { mainTabId: 'societydetails', qdePath: 'Society' },
  wingdetails: { mainTabId: 'wingdetails', qdePath: 'Wing' },
  buildingpermission: { mainTabId: 'buildingpermission', qdePath: 'Building' },
  discountdetails: { mainTabId: 'discountdetails', qdePath: 'Discount' },
  olddetails: { mainTabId: 'olddetails', qdePath: 'OldDetails/old-taxation' },
};

export const QDE_TO_MAIN_MAP: Record<string, string> = {
  property: 'propertydetails',
  kyc: 'kycdetails',
  society: 'societydetails',
  wing: 'wingdetails',
  building: 'buildingpermission',
  discount: 'discountdetails',
  olddetails: 'olddetails',
};

export const RETURN_TAB_BY_QDE_HREF: Record<string, string> = {
  Property: 'propertydetails',
  Kyc: 'kycdetails',
  Society: 'societydetails',
  Wing: 'wingdetails',
  Building: 'buildingpermission',
  Discount: 'discountdetails',
  'OldDetails/old-taxation': 'olddetails',
};
