/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Computes form field validation errors for SubUnitDetailedConfigurator.
 */
export function computeSubUnitValidationErrors(formData: any, t: (key: string) => string): Record<string, string> {
  const e: Record<string, string> = {};
  if (formData.mobileNo && formData.mobileNo.length !== 10) e.mobileNo = t('subunit.validation.mobileLength');
  if (formData.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) e.emailId = t('subunit.validation.emailInvalid');
  if (formData.renterName) {
    if (formData.renterName.startsWith(' ')) e.renterName = t('subunit.validation.renterSpace');
    else if (!/^[A-Za-z][A-Za-z\s]*$/.test(formData.renterName)) e.renterName = t('subunit.validation.renterInvalid');
  }
  if (formData.aadhaar && !/^[0-9]{12}$/.test(formData.aadhaar)) e.aadhaar = t('subunit.validation.aadhaarLength');
  if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) e.pan = t('subunit.validation.panInvalid');
  if (formData.gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo.toUpperCase())) e.gstNo = t('subunit.validation.gstInvalid');

  const alphaNumRegex = /^[A-Za-z0-9\s/-]+$/;
  if (formData.propertyNo && !alphaNumRegex.test(formData.propertyNo)) e.propertyNo = t('subunit.validation.propertyNoInvalid');
  if (formData.partitionNo && !alphaNumRegex.test(formData.partitionNo)) e.partitionNo = t('subunit.validation.partitionNoInvalid');
  if (formData.surveyNo && !alphaNumRegex.test(formData.surveyNo)) e.surveyNo = t('subunit.validation.csnInvalid');

  if (formData.leaseStart && formData.leaseEnd) {
    const start = new Date(formData.leaseStart);
    const end = new Date(formData.leaseEnd);
    if (start >= end) e.leaseEnd = t('subunit.validation.leaseEndAfterStart');
  }

  return e;
}
