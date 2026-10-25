import type { ApartmentTaxDetailsItem } from '@/types/property-tax/apartment';
import type { TaxDetailsData, TaxPolicy, TaxAmountItem } from '@/types/ptisMain-taxdetails.types';

export function convertApartmentTaxDetailsToTaxDetailsData(
  item?: ApartmentTaxDetailsItem | null
): TaxDetailsData | undefined {
  if (!item) return undefined;

  const policies: TaxPolicy[] = [];

  if (item.currentTaxes && item.currentTaxes.length > 0) {
    const groupMap = new Map<string, TaxAmountItem[]>();
    item.currentTaxes.forEach((group) => {
      (group.taxHeads || []).forEach((head) => {
        const code = head.policyCode?.trim() || group.taxType || 'NETTAX';
        if (!groupMap.has(code)) groupMap.set(code, []);
        groupMap.get(code)!.push({
          taxName: head.taxName,
          taxAmount: head.taxAmount,
        });
      });
    });

    groupMap.forEach((taxAmounts, policyCode) => {
      const taxTotal = taxAmounts.reduce((sum, t) => sum + (t.taxAmount || 0), 0);
      policies.push({
        policyCode,
        taxAmounts,
        taxTotal,
      });
    });
  }

  if (item.arrears && item.arrears.length > 0) {
    const arrearsAmounts: TaxAmountItem[] = item.arrears.map((head) => ({
      taxName: head.taxName,
      taxAmount: head.taxAmount,
    }));
    const arrearsTotal = arrearsAmounts.reduce((sum, t) => sum + (t.taxAmount || 0), 0);
    policies.push({
      policyCode: 'ARREARS',
      taxAmounts: arrearsAmounts,
      taxTotal: arrearsTotal,
    });
  }

  return {
    propertyId: item.propertyNo ? Number(item.propertyNo) || 0 : 0,
    policies,
  };
}
