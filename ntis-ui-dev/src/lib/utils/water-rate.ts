/** Derive display rates from the annual rate without adding persisted fields. */
export function calculateWaterRates(yearlyRate: number | string) {
  const annual = Number(yearlyRate);
  if (yearlyRate === "" || !Number.isFinite(annual) || annual < 0) {
    return null;
  }
  return { quarterlyRate: annual / 4, monthlyRate: annual / 12 };
}
