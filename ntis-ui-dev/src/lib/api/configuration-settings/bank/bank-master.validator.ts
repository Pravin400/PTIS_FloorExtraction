import { BankMasterDto, BankMasterFormData } from '@/types/bank-master.types';
import { ApiError } from '@/lib/utils/api';
import { parseBoolean } from '@/lib/utils/type-guards';
import { toTitleCase } from '@/lib/utils/format';
import { DESCRIPTION_REGEX } from '@/lib/utils/validation-rules';
import * as CONST from './bank-master.constants';

export type BankMasterValidationCode =
  | 'bankCodeRequired'
  | 'bankNameRequired'
  | 'ifscRequired'
  | 'branchRequired'
  | 'addressRequired'
  | 'cityRequired'
  | 'stateRequired'
  | 'pincodeRequired'
  | 'ifscFormat'
  | 'pincodeFormat'
  | 'bankCodeLength'
  | 'bankNameLength'
  | 'branchNameLength'
  | 'addressLength'
  | 'addressFormat'
  | 'cityLength'
  | 'stateLength'
  | 'bankMismatch';

export type BankMasterErrors = Partial<Record<keyof BankMasterFormData, BankMasterValidationCode>>;

export function checkBankDetailsMatch(bankCode: string, bankName: string, ifscCode: string): boolean {
  const cleanCode = bankCode.trim().toUpperCase();
  const cleanName = bankName.trim().toUpperCase();
  const cleanIfsc = ifscCode.trim().toUpperCase();

  if (cleanIfsc.length < 4) return true;

  const ifscPrefix = cleanIfsc.substring(0, 4);
  const ifscThree = cleanIfsc.substring(0, 3);

  // Mappings for standard/common Indian banks
  const BANK_IFSC_MAPPING: Record<string, { codes: string[]; names: string[] }> = {
    'SBIN': { codes: ['SBI'], names: ['STATE BANK OF INDIA', 'SBI'] },
    'HDFC': { codes: ['HDFC'], names: ['HDFC'] },
    'ICIC': { codes: ['ICIC', 'ICICI'], names: ['ICICI'] },
    'BARB': { codes: ['BARB', 'BOB'], names: ['BANK OF BARODA', 'BOB'] },
    'AXIS': { codes: ['AXIS'], names: ['AXIS'] },
    'UTIB': { codes: ['AXIS', 'UTI'], names: ['AXIS', 'UTI'] },
    'PUNB': { codes: ['PUNB', 'PNB'], names: ['PUNJAB NATIONAL BANK', 'PNB'] },
    'UBIN': { codes: ['UBIN', 'UBI', 'UNI'], names: ['UNION BANK OF INDIA', 'UNION BANK'] },
    'CNRB': { codes: ['CNRB', 'CAN'], names: ['CANARA BANK', 'CANARA'] },
    'KKBK': { codes: ['KKBK', 'KOTAK'], names: ['KOTAK MAHINDRA BANK', 'KOTAK'] },
    'BKID': { codes: ['BKID', 'BOI'], names: ['BANK OF INDIA', 'BOI'] },
    'MAHB': { codes: ['MAHB', 'BOM'], names: ['BANK OF MAHARASHTRA', 'BOM'] },
    'IDIB': { codes: ['IDIB', 'IND'], names: ['INDIAN BANK'] },
    'IOBA': { codes: ['IOBA', 'IOB'], names: ['INDIAN OVERSEAS BANK', 'IOB'] },
    'UCBA': { codes: ['UCBA', 'UCO'], names: ['UCO BANK', 'UCO'] },
    'YESB': { codes: ['YESB', 'YES'], names: ['YES BANK', 'YES'] },
    'IBKL': { codes: ['IBKL', 'IDBI'], names: ['IDBI'] },
  };

  const known = BANK_IFSC_MAPPING[ifscPrefix];
  if (known) {
    const codeMatches = known.codes.some(c => cleanCode.includes(c));
    const nameMatches = known.names.some(n => cleanName.includes(n));
    return codeMatches && nameMatches;
  }

  // Fallback fuzzy check for unknown/cooperative banks and mock test data
  const codeContainsPrefix = cleanCode.includes(ifscThree);
  const nameContainsPrefix = cleanName.includes(ifscThree);
  const firstThreeCode = cleanCode.substring(0, Math.min(3, cleanCode.length));
  const codePrefixMatch = firstThreeCode.length >= 2 && ifscThree.includes(firstThreeCode);

  return codeContainsPrefix || nameContainsPrefix || codePrefixMatch;
}

export function validateBankMaster(data: BankMasterFormData): BankMasterErrors {
  const errors: BankMasterErrors = {};

  if (!data.bankCode) errors.bankCode = 'bankCodeRequired';
  else if (data.bankCode.length > CONST.BANK_CODE_MAX) errors.bankCode = 'bankCodeLength';

  if (!data.bankName) errors.bankName = 'bankNameRequired';
  else if (data.bankName.length > CONST.BANK_NAME_MAX) errors.bankName = 'bankNameLength';

  if (!data.ifscCode) errors.ifscCode = 'ifscRequired';
  else if (!new RegExp(`^[A-Z]{4}0[A-Z0-9]{${CONST.IFSC_CODE_MAX - 5}}$`).test(data.ifscCode))
    errors.ifscCode = 'ifscFormat';

  if (!data.branchName) errors.branchName = 'branchRequired';
  else if (data.branchName.length > CONST.BRANCH_NAME_MAX) errors.branchName = 'branchNameLength';

  if (!data.address) errors.address = 'addressRequired';
  else if (data.address.length > CONST.ADDRESS_MAX) errors.address = 'addressLength';
  else if (!DESCRIPTION_REGEX.test(data.address)) errors.address = 'addressFormat';

  if (!data.city) errors.city = 'cityRequired';
  else if (data.city.length > CONST.CITY_MAX) errors.city = 'cityLength';

  if (!data.state) errors.state = 'stateRequired';
  else if (data.state.length > CONST.STATE_MAX) errors.state = 'stateLength';

  if (!data.pincode) errors.pincode = 'pincodeRequired';
  else if (!new RegExp(`^[1-9]\\d{${CONST.PINCODE_MAX - 1}}$`).test(data.pincode))
    errors.pincode = 'pincodeFormat';

  if (data.bankCode && data.bankName && data.ifscCode && !errors.ifscCode) {
    if (!checkBankDetailsMatch(data.bankCode, data.bankName, data.ifscCode)) {
      errors.ifscCode = 'bankMismatch';
    }
  }

  return errors;
}

export function validateBankMasterDto(data: BankMasterDto): BankMasterValidationCode | null {
  const normalized = normalizeBankData(data);
  const errors = validateBankMaster(normalized);

  const priorityOrder: (keyof BankMasterFormData)[] = [
    'bankCode',
    'bankName',
    'ifscCode',
    'branchName',
    'address',
    'city',
    'state',
    'pincode',
  ];

  for (const field of priorityOrder) {
    if (errors[field]) return errors[field] as BankMasterValidationCode;
  }

  return null;
}

export function normalizeBankData(
  data: Partial<BankMasterDto | BankMasterFormData>
): BankMasterFormData {
  return {
    bankCode: (data.bankCode ?? '').trim().toUpperCase(),
    bankName: (data.bankName ?? '').trim(),
    branchName: (data.branchName ?? '').trim(),
    ifscCode: (data.ifscCode ?? '').trim().toUpperCase(),
    address: (data.address ?? '').trim(),
    city: (data.city ?? '').trim(),
    state: toTitleCase(data.state ?? ''),
    pincode: (data.pincode ?? '').trim(),
    isActive: parseBoolean(data.isActive ?? true),
  };
}

export function assertBankFormData(data: BankMasterFormData): void {
  const error = validateBankMasterDto(data);
  if (error) {
    throw new ApiError(400, `Validation failed: ${error}`, 'Bank form validation');
  }
}

export function assertBankDto(data: BankMasterDto): void {
  assertBankFormData(normalizeBankData(data));
}

export function checkBackendResponseErrors(
  responseData: Record<string, unknown> | null,
  _operation: string
): void {
  if (!responseData || typeof responseData !== 'object') return;

  const { message: rawMessage, error: rawError } = responseData as {
    message?: unknown;
    error?: unknown;
  };
  const messageValue = rawMessage ?? rawError;

  if (typeof messageValue === 'string' && messageValue) {
    const message = messageValue;
    const lowerMsg = message.toLowerCase();

    const isErrorMessage =
      lowerMsg.includes('error') ||
      lowerMsg.includes('failed') ||
      lowerMsg.includes('invalid') ||
      lowerMsg.includes('duplicate') ||
      lowerMsg.includes('already exists');

    const isSuccessMessage =
      lowerMsg.includes('success') || lowerMsg.includes('created') || lowerMsg.includes('updated');

    if (isErrorMessage && !isSuccessMessage) {
      const isDuplicate = lowerMsg.includes('already exists') || lowerMsg.includes('duplicate');
      throw new ApiError(
        isDuplicate ? 409 : 400,
        message,
        `checkBackendResponseErrors: ${_operation}`
      );
    }
  }
}

export const getValidationCount = (errorMsg?: string) => {
  if (!errorMsg) return 0;
  const errorMapping = {
    pincode: CONST.PINCODE_MAX,
    bankCode: CONST.BANK_CODE_MAX,
    bankName: CONST.BANK_NAME_MAX,
    branchName: CONST.BRANCH_NAME_MAX,
    address: CONST.ADDRESS_MAX,
    city: CONST.CITY_MAX,
    state: CONST.STATE_MAX,
    ifsc: CONST.IFSC_CODE_MAX,
  };
  const matchedKey = Object.keys(errorMapping).find((k) => errorMsg.includes(k));
  return matchedKey ? errorMapping[matchedKey as keyof typeof errorMapping] : 0;
};
