import type { AssessmentUnit } from '@/types/property-tax/apartment';

const normalize = (value: string | null | undefined): string =>
  (value ?? '').trim().replace(/^wing\s*/i, '').trim().toLowerCase();

/**
 * What the PROP NO of a survey row is: the wing itself (the row of wing "A" shows "A") or the partition of a unit ("A1", "A2").
 * A row is the wing when its partition is the name of its wing; without a wing name, a row without a flat is the wing.
 */
export function partitionKindOf(unit: Pick<AssessmentUnit, 'partitionNo' | 'flatNo' | 'rawSurvey'>): 'wing' | 'partition' | null {
  const partition = normalize(unit.partitionNo);
  if (!partition) return null;
  const wing = normalize(unit.rawSurvey?.wing);
  if (wing) return wing === partition ? 'wing' : 'partition';
  return unit.flatNo ? 'partition' : 'wing';
}
