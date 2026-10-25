'use server';

import type {
  DemandSimulationResult,
  LeaseRentDemandItem,
  LeaseRentPaymentDetail,
  LeaseRentPaymentHistoryItem,
  AssetCounterPaymentSearchItem,
  BillTransactionWithDetailsDto,
  LeaseRentReceiptDemandDto,
  LeaseRentReceiptDto,
} from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { assetCounterPaymentService } from '@/lib/api/asset/asset-counter-payment/assetCounterPayment.service';
import { assetCategoryService } from '@/lib/api/asset-masters/asset-category-crud.service';
import { assetTypeService } from '@/lib/api/asset-masters/asset-type-crud.service';
import { getZones } from '@/lib/api/zone.services';
import { getWards } from '@/lib/api/ward.services';

function mapDemandResponseToResult(responseRaw: Record<string, unknown>): DemandSimulationResult | null {
  const items = responseRaw.items as Record<string, unknown> | undefined;
  if (!items) return null;

  const summary = items.summary as Record<string, Record<string, number>> | undefined;
  const demandsList = (items.demands as Record<string, unknown>[]) || [];

  const mappedDemands: LeaseRentDemandItem[] = demandsList.map((d, index) => {
    const monthNum = Number(d.demandMonth ?? 1);
    const yearNum = Number(d.demandYear ?? d.financeYear ?? 2026);
    return {
      id: String(d.id ?? index),
      financialYear: String(d.financeYear ?? yearNum),
      dueDate: String(d.dueDate ?? `${yearNum}-${String(monthNum).padStart(2, '0')}-01`),
      rent: Number(d.monthlyRentAmount ?? 0),
      demandAmount: Number(d.monthlyRentAmount ?? 0),
      penalty: Number(d.penaltyAmount ?? 0),
      penaltyAmount: Number(d.penaltyAmount ?? 0),
      gst: Number(d.gstAmount ?? 0),
      gstAmount: Number(d.gstAmount ?? 0),
      total: Number(d.totalDemandAmount ?? 0),
      paidAmount: Number(d.paidAmount ?? 0),
      balanceAmount: Number(d.pendingAmount ?? 0),
      pendingAmount: Number(d.pendingAmount ?? 0),
      status: String(d.demandStatus ?? 'Pending'),
      month: `${yearNum}-${String(monthNum).padStart(2, '0')}`,
    } as unknown as LeaseRentDemandItem;
  });

  const pendingDemand = Number(summary?.arrears?.demand ?? 0);
  const pendingPaid = Number(summary?.arrears?.paid ?? 0);
  const pendingOutstanding = Number(summary?.arrears?.due ?? 0);

  const currentDemand = Number(summary?.currentDue?.demand ?? 0);
  const currentPaid = Number(summary?.currentDue?.paid ?? 0);
  const currentPending = Number(summary?.currentDue?.due ?? 0);

  const totalOutstanding = Number(summary?.total?.due ?? (pendingOutstanding + currentPending));

  return {
    totalOutstanding,
    totalOverdue: pendingOutstanding,
    totalCurrentDue: currentPending,
    currentDemand,
    currentPaid,
    currentPending,
    pendingDemand,
    pendingPaid,
    pendingOutstanding,
    demands: mappedDemands,
  };
}

export async function getLeaseRentDemandsAction(
  leaseId: number | string,
  _financeYear?: number | string,
  _paymentDate?: string
): Promise<{ success: boolean; data?: DemandSimulationResult; error?: string }> {
  if (!leaseId || leaseId === '0') {
    return { success: true, data: undefined };
  }

  try {
    const responseRaw = await assetCounterPaymentService.getDemandDetailsByAssetId(leaseId);

    if (!responseRaw) {
      return { success: true, data: undefined };
    }

    const simulationResult = mapDemandResponseToResult(responseRaw as Record<string, unknown>);
    return { success: true, data: simulationResult ?? undefined };
  } catch (error) {
    console.error('Error fetching lease rent demands in SSR Action:', error);
    return { success: false, error: 'Failed to fetch demands' };
  }
}

export async function getMakePaymentRecordAction(recordId: string): Promise<LeaseRentPaymentDetail | null> {
  if (!recordId || recordId === '0') return null;

  try {
    // 1. Fetch Lease Rent Details by ID
    const leaseDetailsRaw = await assetCounterPaymentService.getLeaseRentDetailsById(recordId);
    if (!leaseDetailsRaw) return null;

    const leaseDetails = leaseDetailsRaw as Record<string, unknown>;
    const assetId = Number(leaseDetails.assetId || recordId);

    // 2. Fetch Demand Details by Asset ID
    const demandDetailsRaw = await assetCounterPaymentService.getDemandDetailsByAssetId(assetId);
    const demandItemsContainer = (demandDetailsRaw as Record<string, unknown>)?.items as Record<string, unknown> | undefined;

    const summary = demandItemsContainer?.summary as Record<string, Record<string, number>> | undefined;
    const rawTransactionsList = (demandItemsContainer?.transactions as Record<string, unknown>[]) || [];

    const demandSummary = demandDetailsRaw ? mapDemandResponseToResult(demandDetailsRaw as Record<string, unknown>) : null;

    const pendingDemandSum = Number(summary?.arrears?.demand ?? summary?.total?.demand ?? 0);
    const pendingPaidSum = Number(summary?.arrears?.paid ?? summary?.total?.paid ?? 0);
    const pendingDueSum = Number(summary?.arrears?.due ?? summary?.total?.due ?? 0);

    const mappedRecord: LeaseRentPaymentDetail = {
      leaseRentRegistrationId: Number(leaseDetails.id ?? recordId),
      assetId: assetId,
      assetNo: String(leaseDetails.assetNo ?? ''),
      assetName: String(leaseDetails.assetName ?? ''),
      paymentFrequency: String(leaseDetails.paymentFrequency ?? ''),
      shopNo: String(leaseDetails.shopNo ?? ''),
      shopName: String(leaseDetails.shopName ?? ''),
      tenantName: String(leaseDetails.tenantName ?? ''),
      tenantMobile: String(leaseDetails.tenantMobile ?? ''),
      tenantEmail: String(leaseDetails.tenantEmail ?? ''),
      leaseType: String(leaseDetails.leaseType ?? ''),
      monthlyRent: Number(leaseDetails.monthlyRent ?? leaseDetails.rentAmount ?? 0),
      pendingDue: pendingDueSum,
      currentDemand: Number(summary?.currentDue?.demand ?? 0),
      currentPaid: Number(summary?.currentDue?.paid ?? 0),
      currentPenalty: 0,
      currentGst: 0,
      advanceBalance: Number(leaseDetails.advanceBalance ?? 0),
      pendingDemand: pendingDemandSum,
      pendingPaid: pendingPaidSum,
      pendingPenalty: 0,
      pendingGst: 0,
      penalty: 0,
      gst: 0,
      totalPayable: pendingDueSum,
      paymentStatus: null,
      agreementId: String(leaseDetails.agreementId ?? ''),
      leaseStartDate: leaseDetails.leaseStartDate ? String(leaseDetails.leaseStartDate) : null,
      leaseEndDate: leaseDetails.leaseEndDate ? String(leaseDetails.leaseEndDate) : null,
      assetPhotoGuid: leaseDetails.assetPhotoGuid ? String(leaseDetails.assetPhotoGuid) : null,
      demandSummary,
    };

    const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const paymentHistory: LeaseRentPaymentHistoryItem[] = rawTransactionsList.map((tx, idx) => {
      const lines = (tx.lines as Record<string, unknown>[]) || [];
      const paidMonths = lines
        .map((l) => {
          const m = Number(l.demandMonth);
          const y = l.demandYear;
          if (m >= 1 && m <= 12 && y) {
            return `${MONTH_SHORT_NAMES[m - 1]} ${y}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');

      const txnNo = String(tx.transactionNo ?? tx.transactionRefNo ?? tx.receiptNo ?? '-');

      return {
        id: String(tx.id ?? idx),
        transactionId: Number(tx.id ?? idx),
        receiptNo: String(tx.receiptNo ?? tx.receiptNumber ?? '-'),
        paymentDate: String(tx.paymentDate ?? tx.createdDate ?? ''),
        amountPaid: Number(tx.paidAmount ?? tx.netPayableAmount ?? 0),
        paidAmount: Number(tx.paidAmount ?? tx.netPayableAmount ?? 0),
        paymentMode: String(tx.paymentMode ?? 'Cash'),
        transactionRefNo: txnNo,
        transactionNo: txnNo,
        chequeStatus: String(tx.chequeStatus ?? tx.paymentStatus ?? 'Success'),
        status: String(tx.paymentStatus ?? 'Success'),
        paymentStatus: String(tx.paymentStatus ?? 'Success'),
        paidMonths: paidMonths || '-',
        uuid: String(tx.uuid ?? tx.receiptGuid ?? tx.id ?? ''),
      };
    });

    mappedRecord.paymentHistory = paymentHistory;

    // Attach raw transactions directly if present
    (mappedRecord as unknown as Record<string, unknown>).rawTransactions = rawTransactionsList;
    (mappedRecord as unknown as Record<string, unknown>).summary = summary;

    return mappedRecord;
  } catch (error) {
    console.error('Error fetching make payment record in SSR Action:', error);
    return null;
  }
}

export interface ProcessLeaseRentPaymentActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function processMakePaymentAction(
  recordId: string,
  payload: Record<string, unknown>
): Promise<ProcessLeaseRentPaymentActionResult> {
  try {
    const data = await assetCounterPaymentService.processPayment(recordId, payload);
    return {
      success: true,
      message: 'Payment processed successfully.',
      data,
    };
  } catch (error) {
    console.error('Error processing payment in Server Action:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process payment.',
    };
  }
}

export async function searchAssetAction(
  searchTerm: string,
  assetCategoryId?: number | string | null,
  assetTypeId?: number | string | null,
  zoneId?: number | string | null,
  wardId?: number | string | null,
  parentAssetId?: number | string | null,
  assetId?: number | string | null
): Promise<{ success: boolean; data: { items: AssetCounterPaymentSearchItem[] } }> {
  try {
    const results = await assetCounterPaymentService.search({
      searchText: searchTerm,
      assetCategoryId: assetCategoryId || undefined,
      assetTypeId: assetTypeId || undefined,
      zoneId: zoneId || undefined,
      wardId: wardId || undefined,
      parentAssetId: parentAssetId || undefined,
      assetId: assetId || undefined,
    });

    return { success: true, data: { items: results } };
  } catch (error) {
    console.error('Error executing searchAssetAction:', error);
    return { success: false, data: { items: [] } };
  }
}

export async function getLeaseRentTransactionReceiptAction(
  recordId: number | string,
  transactionId: number | string
): Promise<{ success: boolean; data: BillTransactionWithDetailsDto | null }> {
  try {
    const record = await getMakePaymentRecordAction(String(recordId));
    if (!record) return { success: false, data: null };

    const rawTx = (record as unknown as Record<string, unknown>).rawTransactions as Record<string, unknown>[] | undefined;
    if (!Array.isArray(rawTx)) return { success: false, data: null };

    const targetTx = rawTx.find((tx, idx) => {
      const candidates = [
        tx.id,
        tx.transactionId,
        tx.receiptNo,
        tx.receiptNumber,
        idx,
      ].filter((v) => v !== undefined && v !== null);
      return candidates.some((cand) => String(cand) === String(transactionId));
    });

    if (!targetTx) return { success: false, data: null };

    const rawLines = (targetTx.lines as Record<string, unknown>[]) || [];
    const details: LeaseRentReceiptDemandDto[] = rawLines.map((l) => ({
      demandMonth: Number(l.demandMonth ?? 0),
      demandYear: Number(l.demandYear ?? 0),
      monthlyRentAmount: Number(l.monthlyRentAmount ?? l.currentPaidAmount ?? 0),
      rentAmount: Number(l.monthlyRentAmount ?? l.currentPaidAmount ?? 0),
      penaltyAmount: Number(l.penaltyAmount ?? 0),
      gstAmount: Number(l.gstAmount ?? 0),
      totalDemandAmount: Number(l.totalDemandAmount ?? l.currentPaidAmount ?? 0),
      totalAmount: Number(l.totalDemandAmount ?? l.currentPaidAmount ?? 0),
      currentPaidAmount: Number(l.currentPaidAmount ?? 0),
      paidAmount: Number(l.currentPaidAmount ?? 0),
    }));

    const resultData: BillTransactionWithDetailsDto = {
      paidAmount: Number(targetTx.paidAmount ?? targetTx.netPayableAmount ?? 0),
      paymentMode: String(targetTx.paymentMode ?? 'Cash'),
      paymentDate: String(targetTx.paymentDate ?? ''),
      paymentStatus: String(targetTx.paymentStatus ?? 'Success'),
      ddPayeeName: targetTx.ddPayeeName ? String(targetTx.ddPayeeName) : undefined,
      details,
    };

    return { success: true, data: resultData };
  } catch (error) {
    console.error('Error in getLeaseRentTransactionReceiptAction:', error);
    return { success: false, data: null };
  }
}

export async function getPaymentHistoryRecordAction(recordId: string): Promise<LeaseRentPaymentDetail | null> {
  return getMakePaymentRecordAction(recordId);
}

export async function getReceiptDataAction(
  identifier: string
): Promise<LeaseRentReceiptDto | null> {
  if (!identifier) return null;
  try {
    // 1. Try fetching directly from GET /api/LeaseRentBill/receipt/uuid/{uuid}
    const receiptApiData = await assetCounterPaymentService.getReceiptByUuid(identifier);
    if (receiptApiData) {
      const rawDemands = (receiptApiData.paidDemands as Record<string, unknown>[]) ||
        (receiptApiData.demands as Record<string, unknown>[]) ||
        (receiptApiData.details as Record<string, unknown>[]) || [];
      const details: LeaseRentReceiptDemandDto[] = rawDemands.map((d) => ({
        period: String(d.period ?? d.periodName ?? (d.demandMonth && d.demandYear ? `${d.demandMonth}/${d.demandYear}` : '')),
        description: String(d.description ?? d.rentDescription ?? 'मासिक भाडे'),
        dueDate: d.dueDate ? String(d.dueDate) : undefined,
        dueAmount: Number(d.dueAmount ?? d.totalDemandAmount ?? d.monthlyRentAmount ?? d.rentAmount ?? 0),
        paidAmount: Number(d.paidAmount ?? d.currentPaidAmount ?? 0),
      }));

      return {
        receiptNo: String(receiptApiData.receiptNo ?? 'REC-' + identifier),
        receiptDate: String(receiptApiData.receiptDate || receiptApiData.paymentDate || new Date().toISOString()),
        paymentDate: String(receiptApiData.paymentDate || receiptApiData.receiptDate || new Date().toISOString()),
        uuid: String(receiptApiData.uuid ?? identifier),
        tenantName: String(receiptApiData.tenantName ?? 'Tenant'),
        tenantMobile: receiptApiData.tenantMobile ? String(receiptApiData.tenantMobile) : undefined,
        payerName: String(receiptApiData.tenantName ?? 'Tenant'),
        assetNo: String(receiptApiData.assetNo ?? '-'),
        assetName: receiptApiData.assetName ? String(receiptApiData.assetName) : undefined,
        agreementId: receiptApiData.agreementId ? String(receiptApiData.agreementId) : undefined,
        leaseStartDate: receiptApiData.leaseStartDate ? String(receiptApiData.leaseStartDate) : undefined,
        leaseEndDate: receiptApiData.leaseEndDate ? String(receiptApiData.leaseEndDate) : undefined,
        monthlyRent: Number(receiptApiData.monthlyRent ?? 0),
        securityDeposit: Number(receiptApiData.securityDeposit ?? 0),
        totalAmount: Number(receiptApiData.paidAmount ?? receiptApiData.amountPaid ?? receiptApiData.totalDemandAmount ?? 0),
        amountPaid: Number(receiptApiData.paidAmount ?? receiptApiData.amountPaid ?? 0),
        paidAmount: Number(receiptApiData.paidAmount ?? receiptApiData.amountPaid ?? 0),
        paymentMode: String(receiptApiData.paymentMode ?? 'CASH'),
        transactionRefNo: receiptApiData.chequeOrTransactionNo ? String(receiptApiData.chequeOrTransactionNo) : undefined,
        chequeDate: receiptApiData.chequeDate ? String(receiptApiData.chequeDate) : undefined,
        chequeOrTransactionNo: receiptApiData.chequeOrTransactionNo ? String(receiptApiData.chequeOrTransactionNo) : undefined,
        bankName: receiptApiData.bankName ? String(receiptApiData.bankName) : undefined,
        financeYear: receiptApiData.financeYear ? String(receiptApiData.financeYear) : undefined,
        remainingBalance: Number(receiptApiData.remainingBalance ?? 0),
        paymentStatus: receiptApiData.paymentStatus ? String(receiptApiData.paymentStatus) : undefined,
        paidDemands: details,
      };
    }

    // 2. Fallback to lease rent details lookup
    const record = await getMakePaymentRecordAction(identifier);
    if (!record) return null;

    const history = record.paymentHistory || [];
    const item = history.find(
      (h) =>
        String(h.receiptNo) === identifier ||
        String(h.id) === identifier ||
        String(h.transactionId) === identifier
    );

    if (!item) return null;

    const rawItem = item as unknown as Record<string, unknown>;
    const receiptDateStr = (rawItem.receiptDate as string) || item.paymentDate || new Date().toISOString();
    const paidVal = item.paidAmount ?? item.amountPaid ?? 0;

    return {
      receiptNo: item.receiptNo || 'REC-' + identifier,
      receiptDate: receiptDateStr,
      paymentDate: item.paymentDate || receiptDateStr,
      uuid: identifier,
      tenantName: record.tenantName || 'Tenant',
      tenantMobile: record.tenantMobile,
      payerName: record.tenantName || 'Tenant',
      assetNo: record.assetNo || '-',
      assetName: record.assetName,
      agreementId: record.agreementId,
      leaseStartDate: record.leaseStartDate || undefined,
      leaseEndDate: record.leaseEndDate || undefined,
      monthlyRent: record.monthlyRent,
      totalAmount: paidVal,
      amountPaid: paidVal,
      paidAmount: paidVal,
      paymentMode: item.paymentMode || 'CASH',
      transactionRefNo: item.transactionRefNo || (rawItem.transactionNo as string),
      chequeDate: rawItem.chequeDate as string | undefined,
      chequeOrTransactionNo: (rawItem.chequeNo as string) || (rawItem.ddNo as string) || (rawItem.upiReferenceId as string) || item.transactionRefNo,
      bankName: rawItem.bankName as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching receipt data in getReceiptDataAction:', error);
    return null;
  }
}



export async function fetchAssetCategoriesAction(): Promise<{ value: string; label: string }[]> {
  try {
    const result = await assetCategoryService.getAll({ IsActive: 'true', PageSize: -1 });
    return (result.items ?? []).map((cat) => ({
      value: String(cat.id),
      label: cat.categoryName ?? cat.categoryCode ?? String(cat.id),
    }));
  } catch (error) {
    console.error('Error fetching asset categories in Server Action:', error);
    return [];
  }
}

export async function fetchAssetTypesAction(assetCategoryId?: number): Promise<{ value: string; label: string }[]> {
  try {
    const result = await assetTypeService.getAll({
      CategoryId: assetCategoryId,
      IsActive: 'true',
      PageSize: -1,
    });
    return (result.items ?? []).map((type) => ({
      value: String(type.id),
      label: type.typeName ?? type.typeCode ?? String(type.id),
    }));
  } catch (error) {
    console.error('Error fetching asset types in Server Action:', error);
    return [];
  }
}

export async function fetchAssetMasterAction(params?: {
  zoneId?: number | string;
  wardId?: number | string;
  assetCategoryId?: number | string;
  assetTypeId?: number | string;
  parentAssetId?: number | string;
  isParent?: boolean;
}): Promise<{ options: { value: string; label: string }[] }> {
  try {
    if (params?.parentAssetId || params?.isParent === false) {
      if (!params?.parentAssetId) return { options: [] };
      const items = await assetCounterPaymentService.getSubAssetDetails({
        parentAssetId: params.parentAssetId,
        workflowStatus: 'approved',
        isActive: true,
        pageSize: -1,
      });
      const options = items.map((item) => ({
        value: String(item.id ?? item.leaseRentDetailsId ?? item.assetId),
        label: (item.shopName as string) || (item.assetName as string) || (item.shopNo as string) || (item.assetNo as string) || String(item.id),
      }));
      return { options };
    }

    if (!params?.zoneId || !params?.wardId) {
      return { options: [] };
    }
    const items = await assetCounterPaymentService.getParentAssetDetails({
      zoneId: params.zoneId,
      wardId: params.wardId,
      assetCategoryId: params.assetCategoryId,
      assetTypeId: params.assetTypeId,
    });
    const options = items.map((item) => ({
      value: String(item.id),
      label: (item.assetName as string) || (item.assetNo as string) || String(item.id),
    }));
    return { options };
  } catch (error) {
    console.error('Error in fetchAssetMasterAction:', error);
    return { options: [] };
  }
}

export async function fetchZonesAction(): Promise<{ value: string; label: string }[]> {
  try {
    const result = await getZones(1, -1);
    return (result.items ?? []).map((zone) => ({
      value: String(zone.id),
      label: zone.description ? `${zone.zoneNo} - ${zone.description}` : String(zone.zoneNo),
    }));
  } catch (error) {
    console.error('Error fetching zones in Server Action:', error);
    return [];
  }
}

export async function fetchWardsAction(zoneId?: number | string): Promise<{ value: string; label: string }[]> {
  if (!zoneId) return [];
  try {
    const numericZoneId = typeof zoneId === 'string' ? parseInt(zoneId, 10) : zoneId;
    const result = await getWards(1, -1, undefined, isNaN(numericZoneId) ? undefined : numericZoneId);
    return (result.items ?? []).map((ward) => ({
      value: String(ward.id),
      label: ward.wardNo + (ward.description ? ` (${ward.description})` : ''),
    }));
  } catch (error) {
    console.error('Error fetching wards in Server Action:', error);
    return [];
  }
}
