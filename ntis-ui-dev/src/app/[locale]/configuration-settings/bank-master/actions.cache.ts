import { cache } from 'react';
import type { BankMasterData } from '@/types/bank-master.types';
import { getBanksSummary } from '@/lib/api/configuration-settings/bank/bank-master.services';
import { toTitleCase } from '@/lib/utils/format';

export type BankMasterMetadata = {
  activeCount: number;
  uniqueStates: string[];
};

export function buildBankMasterMetadata(summary: BankMasterData[]): BankMasterMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCount = summary.reduce((count, bank: any) => {
    // Check both camelCase and PascalCase
    const val = bank.isActive ?? bank.IsActive;

    const isActive =
      val !== null &&
      val !== undefined &&
      (String(val).toLowerCase() === 'active' ||
        String(val) === '1' ||
        String(val).toLowerCase() === 'true' ||
        val === true);

    return isActive ? count + 1 : count;
  }, 0);

  const uniqueStates = Array.from(
    new Set(
      summary
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((bank: any) => {
          const rawState = bank.state ?? bank.State;
          return typeof rawState === 'string' ? toTitleCase(rawState) : '';
        })
        .filter((state): state is string => Boolean(state) && state !== '—')
    )
  ).sort((a, b) => a.localeCompare(b));

  return { activeCount, uniqueStates };
}

export const getCachedBankMasterMetadata = cache(async (): Promise<BankMasterMetadata> => {
  const summary = await getBanksSummary();
  return buildBankMasterMetadata(summary);
});
