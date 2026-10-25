import { evaluatePropertyParameterMatch } from "@/lib/utils/propertyComparison.utils";

export function getFloorKey(propNo: string, partitionNo?: string | null): string {
  if (partitionNo) {
    return `${propNo} / ${partitionNo}`;
  }
  return propNo;
}

export interface ParameterComparisonField {
  newVal: string | number | undefined | null;
  candVal: string | number | undefined | null;
  type: 'text' | 'numeric' | 'category' | 'exact';
}

export function calculateMatchScore(
  newProp: {
    propNo: string;
    owner: string;
    address: string;
    builtUpArea: number;
    floors: string;
    tax: number;
    cts: string;
    rv: number;
    use: string;
    ward: string;
    zone: string;
    plotNo: string;
    constructionYear: string;
    mobile?: string;
    carpetArea?: number;
  },
  cand: {
    propNo: string;
    owner: string;
    address: string;
    area: number;
    floors: string;
    tax: number;
    cts?: string;
    rv?: number;
    use?: string;
    ward?: string;
    zone?: string;
    plotNo?: string;
    constructionYear?: string;
    mobile?: string;
    carpetArea?: number;
  }
): number {
  const fields: ParameterComparisonField[] = [
    { newVal: newProp.owner, candVal: cand.owner, type: 'text' },
    { newVal: newProp.builtUpArea, candVal: cand.area, type: 'numeric' },
    { newVal: newProp.carpetArea || 0, candVal: cand.carpetArea || 0, type: 'numeric' },
    { newVal: newProp.floors, candVal: cand.floors, type: 'text' },
    { newVal: newProp.rv || 0, candVal: cand.rv || 0, type: 'numeric' },
    { newVal: newProp.tax, candVal: cand.tax, type: 'numeric' },
    { newVal: newProp.cts, candVal: cand.cts, type: 'exact' },
    { newVal: newProp.use, candVal: cand.use, type: 'category' },
    {
      newVal: [newProp.zone, newProp.ward].filter(Boolean).join(' / '),
      candVal: [cand.zone, cand.ward].filter(Boolean).join(' / '),
      type: 'exact'
    },
    { newVal: newProp.plotNo, candVal: cand.plotNo, type: 'exact' },
    { newVal: newProp.constructionYear, candVal: cand.constructionYear, type: 'exact' },
    { newVal: newProp.mobile, candVal: cand.mobile, type: 'exact' },
    { newVal: newProp.address, candVal: cand.address, type: 'text' }
  ];

  let totalEvaluated = 0;
  let matchedCount = 0;

  for (const field of fields) {
    const s1 = field.newVal !== undefined && field.newVal !== null ? String(field.newVal).trim() : '';
    const s2 = field.candVal !== undefined && field.candVal !== null ? String(field.candVal).trim() : '';

    const isEmpty1 = !s1 || s1 === '0' || s1 === '0 sq. ft.' || s1 === '₹0' || s1.toUpperCase() === 'N/A';
    const isEmpty2 = !s2 || s2 === '0' || s2 === '0 sq. ft.' || s2 === '₹0' || s2.toUpperCase() === 'N/A';

    if (isEmpty1 && isEmpty2) {
      continue;
    }

    totalEvaluated++;
    const res = evaluatePropertyParameterMatch(field.newVal, field.candVal, field.type, 80);
    if (res.isMatch) {
      matchedCount++;
    }
  }

  if (totalEvaluated === 0) return 0;
  return Math.round((matchedCount / totalEvaluated) * 100);
}
