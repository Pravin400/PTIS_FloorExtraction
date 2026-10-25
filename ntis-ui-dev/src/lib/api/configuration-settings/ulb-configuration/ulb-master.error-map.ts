/** Maps ULB Master API validation codes to i18n keys under `ulb_configuration.validation`. */
export const ULB_API_ERROR_MAP: Record<string, string> = {
  WebsiteUrl_Invalid_Format: 'validation.websiteFormat',
  EmailId_Invalid_Format: 'validation.emailFormat',
  MobileNo_Invalid_Format: 'validation.phoneFormat',
  AlternateMobileNo_Invalid_Format: 'validation.alternatePhoneFormat',
  PinCode_Invalid_Format: 'validation.pincodeFormat',
  PmEmailId_Invalid_Format: 'validation.pmEmailFormat',
  PmMobileNo_Invalid_Format: 'validation.pmPhoneFormat',
  UlbCode_Already_Exists: 'validation.ulbCodeExists',
  UlbName_Already_Exists: 'validation.ulbNameExists',
  LicenceKey_Invalid_Format: 'validation.licenseKeyFormat',
  LicenceKey_Already_Exists: 'validation.licenseKeyExists',
};
