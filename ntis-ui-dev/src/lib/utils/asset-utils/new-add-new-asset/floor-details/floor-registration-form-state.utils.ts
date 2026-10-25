 
export function blankFloorFormState() {
  return {
    isTaxable: true,
    _submissionType: '',
    floor: '',
    subFloor: '',
    conYear: '',
    asstYear: '',
    conType: '',
    useType: '',
    subUseType: '',
    isRenter: false,
    rooms: 0,
    openSpaces: 0,
    amenities: 0,
    carpetAreaSqFt: 0,
    builtUpAreaSqFt: 0,
    renterNameEnglish: '',
    renterNameLocal: '',
    agreementDate: '',
    agreementFromDate: '',
    agreementToDate: '',
    rentMonthly: '',
    rentYearly: '',
    taxLiability: '',
    rentType: '',
    duration: '',
    rentFreq: '',
    securityDeposit: '',
    depositType: '',
    mobileNo: '',
    emailId: '',
    aadhaar: '',
    pan: '',
    tenantAddress: '',
  };
}

// Note: matches the original inline reset performed after a successful "Add Floor" save, which
// (unlike blankFloorFormState / the Cancel-Edit reset) never re-set `_submissionType`, leaving it
// `undefined` until the user touches the "Separately Used Plot Area" selector again. Preserved
// as-is rather than "fixed" — this is a mechanical extraction, not a behavior change.
export function blankFloorFormStateAfterSave() {
  const { _submissionType, ...rest } = blankFloorFormState();
  return rest;
}
