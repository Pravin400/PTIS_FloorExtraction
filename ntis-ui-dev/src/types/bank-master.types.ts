export interface BankMasterData {
  id: string;
  bankCode: string | null;
  bankName: string | null;
  branchName: string | null;
  ifscCode: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
}

export type BankMasterDto = BankMasterFormData;

export interface BankMasterFormData {
  bankCode: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
}
