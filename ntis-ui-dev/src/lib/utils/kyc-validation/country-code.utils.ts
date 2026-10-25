export const extractCountryCode = (fullNumber?: string | null) => {
  if (!fullNumber) return { countryCode: '91', mobileNo: '' };
  
  let number = fullNumber;
  if (number.startsWith('+')) {
    number = number.substring(1);
  }
  
  if (number.length > 10) {
    const codeLen = number.length - 10;
    return {
      countryCode: number.substring(0, codeLen),
      mobileNo: number.substring(codeLen)
    };
  }
  
  return { countryCode: '91', mobileNo: number };
};
