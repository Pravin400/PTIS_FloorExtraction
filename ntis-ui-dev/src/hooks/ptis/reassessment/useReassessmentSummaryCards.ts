import { MappedFloorDetail, ReassessmentTaxRow } from '@/types/reassessment.types';
import {
  formatReassessmentCurrency,
  formatReassessmentTaxCurrency,
  sumReassessmentTaxAmounts,
} from '@/lib/utils/format';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function useReassessmentSummaryCards({
  oldFloorDetails,
  newFloorDetails,
  taxRows,
  t,
}: {
  oldFloorDetails: MappedFloorDetail[];
  newFloorDetails: MappedFloorDetail[];
  taxRows: ReassessmentTaxRow[];
  t: (key: string) => string;
}) {
  const builtUpAreaLabel = useAliasLabel('Builtup_Area', t('summaryCards.carpetAreaLabel'));

  const calculateTotalArea = (floors: MappedFloorDetail[]) =>
    floors.reduce((sum, f) => sum + ((f.builtUpAreaSqM ?? f.carpetAreaSqM) || 0), 0);

  const oldTotalArea = calculateTotalArea(oldFloorDetails);
  const newTotalArea = calculateTotalArea(newFloorDetails);
  const areaDiff = newTotalArea - oldTotalArea;

  const oldTotalRV = oldFloorDetails.reduce((sum, f) => sum + (f.rv || 0), 0);
  const newTotalRV = newFloorDetails.reduce((sum, f) => sum + (f.rv || 0), 0);
  const rvDiff = newTotalRV - oldTotalRV;

  const oldTaxRow = taxRows.find((r) => r.rowType === 'old');
  const newTaxRow = taxRows.find((r) => r.rowType === 'additional');
  const oldTotalTax = oldTaxRow ? sumReassessmentTaxAmounts(oldTaxRow.taxes) : 0;
  const newTotalTax = newTaxRow ? sumReassessmentTaxAmounts(newTaxRow.taxes) : 0;
  const taxDiff = newTotalTax - oldTotalTax;

  // Determine if use type changed
  const oldUses = [...new Set(oldFloorDetails.map((f) => f.use))].join(', ') || 'N/A';
  const newUses = [...new Set(newFloorDetails.map((f) => f.use))].join(', ') || 'N/A';
  const useChanged = oldUses !== newUses;

  const summaryCardsData = [
    {
      label: builtUpAreaLabel,
      oldValue: `${oldTotalArea.toFixed(2)}`,
      newValue: `${newTotalArea.toFixed(2)}`,
      difference: `${areaDiff >= 0 ? '+' : ''}${areaDiff.toFixed(2)}`,
      unit: t('summaryCards.units.sqM'),
      color: 'sky' as const,
    },
    {
      label: t('summaryCards.typeOfUseLabel'),
      oldValue: oldUses,
      newValue: newUses,
      difference: useChanged ? t('summaryCards.changedStatus') : t('summaryCards.sameStatus'),
      unit: t('summaryCards.units.type'),
      color: 'purple' as const,
    },
    {
      label: t('summaryCards.rateableValueLabel'),
      oldValue: formatReassessmentCurrency(oldTotalRV),
      newValue: formatReassessmentCurrency(newTotalRV),
      difference: `${rvDiff >= 0 ? '+' : '-'}${formatReassessmentCurrency(Math.abs(rvDiff))}`,
      unit: t('summaryCards.units.rupees'),
      color: 'amber' as const,
    },
    {
      label: t('summaryCards.totalTaxLabel'),
      oldValue: formatReassessmentTaxCurrency(oldTotalTax, newTotalTax),
      newValue: formatReassessmentTaxCurrency(newTotalTax, oldTotalTax),
      difference: `${taxDiff >= 0 ? '+' : '-'}${formatReassessmentCurrency(Math.abs(taxDiff))}`,
      unit: t('summaryCards.units.rupees'),
      color: 'emerald' as const,
    },
  ];

  return summaryCardsData;
}
