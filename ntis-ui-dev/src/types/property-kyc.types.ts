export interface KycResponse {
  success: boolean;
  message: string;
  items: KycDetails | null;
  errors: string[] | null;
}

export interface KycDetails {
  propertyId: number | null;
  ownerTypeId: number | null;
  ownerType: string | null;
  ownerTitle: string | null;
  ownerName: string | null;
  ownerNameRegional?: string | null;
  ownerTitleEnglish: string | null;
  ownerNameEnglish: string | null;
  occupierTitle: string | null;
  occupierName: string | null;
  occupierNameRegional?: string | null;
  occupierTitleEnglish: string | null;
  occupierNameEnglish: string | null;
  address: string | null;
  addressRegional?: string | null;
  location: string | null;
  addressEnglish: string | null;
  locationEnglish: string | null;
  flatOrShopName: string | null;
  flatOrShopNameEnglish: string | null;
  flatOrShopNo: string | null;
  flatOrShopNoEnglish: string | null;
  mobileNo: string | null;
  emailId: string | null;
  /** @deprecated Use adharCardNo instead. Retained for backward compatibility. */
  aadharCardNo?: string | null;
  adharCardNo?: string | null;
  alternateMobileNo?: string | null;
  pinCode?: string | null;
}


export type KycFormData = Partial<
  Pick<
    KycDetails,
    | 'ownerTypeId'
    | 'ownerTitle'
    | 'ownerName'
    | 'ownerNameEnglish'
    | 'occupierName'
    | 'occupierNameEnglish'
    | 'flatOrShopName'
    | 'flatOrShopNameEnglish'
    | 'emailId'
    | 'address'
    | 'addressEnglish'
    | 'location'
    | 'pinCode'
  >
> & {
  mobileCountryCode?: string;
  alternateMobileCountryCode?: string;
};

export type {
  OwnerTypeApiItem,
  OwnerTypeApiResponse
} from './property-basic-details.types';
