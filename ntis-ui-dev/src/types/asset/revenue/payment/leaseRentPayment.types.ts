export type PaymentModeKey = 'CASH' | 'CHEQUE' | 'DD' | 'ONLINE' | 'UPI' | 'NEFT_RTGS' | 'Cash' | 'Cheque' | 'Online' | 'NEFT' | 'RTGS';

export type PaymentType = 'CURRENT' | 'PARTIAL' | 'ADVANCE' | 'FULL' | 'Full' | 'Part' | 'Advance';

export type OnlinePaymentStatus = 'Pending' | 'Success' | 'Failed';

export const ONLINE_PAYMENT_STATUSES: OnlinePaymentStatus[] = ['Pending', 'Success', 'Failed'];

export interface LeaseRentPaymentDetail {
  leaseRentRegistrationId: number;
  grievanceNo?: string;
  assetId: number;
  assetNo: string;
  assetName: string;
  paymentFrequency?: string;
  zone?: string;
  wardNo?: string;
  category?: string;
  shopNo?: string;
  shopName?: string;
  tenantName?: string;
  tenantMobile?: string;
  tenantEmail?: string;
  leaseType?: string;
  monthlyRent: number;
  pendingDue: number;
  currentDemand: number;
  currentPaid: number;
  currentPenalty: number;
  currentGst: number;
  advanceBalance: number;
  pendingDemand: number;
  pendingPaid: number;
  pendingPenalty: number;
  pendingGst: number;
  penalty: number;
  gst: number;
  totalPayable: number;
  paymentStatus?: string | null;
  agreementId?: string;
  assetPhotoGuid?: string | null;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  paymentHistory?: LeaseRentPaymentHistoryItem[];
  demandSummary?: DemandSimulationResult | null;
}

export interface LeaseRentDemandItem {
  id: number | string;
  financialYear: string;
  dueDate: string;
  rent?: number;
  demandAmount: number;
  paidAmount: number;
  balanceAmount: number;
  penalty?: number;
  penaltyAmount: number;
  gst?: number;
  gstAmount: number;
  total?: number;
  pendingAmount?: number;
  status: string;
  demandStatus?: string;
  month?: string;
  description?: string;
  rentDescription?: string;
  isOverdue?: boolean;
  gstRate?: number;
}

export interface DemandSimulationResult {
  totalOutstanding: number;
  totalOverdue: number;
  totalCurrentDue: number;
  currentDemand: number;
  currentPaid: number;
  currentPending: number;
  pendingDemand: number;
  pendingPaid: number;
  pendingOutstanding: number;
  demands: LeaseRentDemandItem[];
}

export interface LeaseRentPaymentHistoryItem {
  id: number | string;
  transactionId?: number | string;
  receiptNo: string;
  paymentDate: string;
  transactionDate?: string;
  amountPaid: number;
  paidAmount?: number;
  paymentMode: string;
  transactionRefNo?: string;
  transactionNo?: string;
  chequeStatus?: string;
  status: string;
  paymentStatus?: string;
  downloadUrl?: string;
  paidMonths?: string;
  uuid?: string;
}

export interface LeaseRentBillRequest {
  leaseRentRegistrationId: number;
  paymentMode: PaymentModeKey;
  paymentType: PaymentType;
  amount: number;
  chequeNo?: string;
  bankName?: string;
  transactionNo?: string;
}

export type ChequeStatus = 'Received' | 'Deposited' | 'Cleared' | 'Bounced';

export interface LeaseRentReceiptDemandDto {
  demandMonth?: number;
  demandYear?: number;
  periodName?: string;
  period?: string;
  monthlyRentAmount?: number;
  rentAmount?: number;
  penaltyAmount?: number;
  gstAmount?: number;
  totalDemandAmount?: number;
  totalAmount?: number;
  currentPaidAmount?: number;
  paidAmount?: number;
  description?: string;
  dueDate?: string;
  dueAmount?: number;
}

export interface BillTransactionWithDetailsDto {
  paidAmount: number;
  paymentMode: string;
  paymentDate: string;
  paymentStatus?: string;
  ddPayeeName?: string;
  details?: LeaseRentReceiptDemandDto[];
}

export interface LeaseRentReceiptDto {
  receiptNo: string;
  receiptDate: string;
  paymentDate?: string;
  tenantName: string;
  tenantMobile?: string;
  payerName?: string;
  assetNo: string;
  assetName?: string;
  agreementId?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  chequeDate?: string;
  ddPayeeName?: string;
  amountPaid: number;
  paidAmount?: number;
  totalAmount?: number;
  paymentMode: string;
  transactionRefNo?: string;
  uuid?: string;
  financeYear?: string;
  createdBy?: string;
  bankName?: string;
  paymentGatewayName?: string;
  onlineTransactionId?: string;
  chequeOrTransactionNo?: string;
  remark?: string;
  remainingBalance?: number;
  totalDemandAmount?: number;
  totalOutstandingBeforePayment?: number;
  paymentStatus?: string;
  paidDemands?: LeaseRentReceiptDemandDto[];
}

export interface AssetCounterPaymentSearchItem {
  leaseRentDetailsId: number;
  assetId: number;
  assetNo: string;
  assetName: string;
  parentAssetId?: number;
  parentAssetName?: string;
  shopNo?: string;
  shopName?: string;
  tenantName: string;
  tenantMobile?: string;
  tenantEmail?: string;
  leaseType?: string;
  rentAmount?: number;
  paymentFrequency?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
}

export interface AssetCounterPaymentSearchData {
  searchText: string;
  matchedBy?: string;
  matchType?: string;
  hasMoreResults?: boolean;
  results: AssetCounterPaymentSearchItem[];
}

export interface AssetCounterPaymentSearchApiResponse {
  success: boolean;
  message?: string;
  items?: AssetCounterPaymentSearchData | AssetCounterPaymentSearchItem[];
  totalCount?: number;
  errors?: unknown;
  correlationId?: string | null;
}
