import { cache } from 'react';
import type { ModuleMaster } from '@/types/moduleMaster.types';
import { getModuleMastersSummary } from '@/lib/api/configuration-settings/module-master/module-master.services';

export type ModuleMasterMetadata = {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
};

export function buildModuleMasterMetadata(summary: ModuleMaster[]): ModuleMasterMetadata {
  const totalCount = summary.length;
  const activeCount = summary.reduce((count, item) => {
    return item.isActive ? count + 1 : count;
  }, 0);
  const inactiveCount = totalCount - activeCount;

  return { totalCount, activeCount, inactiveCount };
}

export const getCachedModuleMastersSummary = cache(async (): Promise<ModuleMaster[]> => {
  return getModuleMastersSummary();
});

export const getCachedModuleMasterMetadata = cache(async (): Promise<ModuleMasterMetadata> => {
  const summary = await getCachedModuleMastersSummary();
  return buildModuleMasterMetadata(summary);
});
