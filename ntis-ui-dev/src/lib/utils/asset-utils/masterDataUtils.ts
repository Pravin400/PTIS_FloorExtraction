 
import { MASTER_IDS } from '@/types/asset-masters/master-data.types';
import type { MasterDataType, MasterDataRecord } from '@/types/asset-masters/master-data.types';

/**
 * Calculates the next sequential code for a master record based on existing records.
 * Ensures uniqueness across the entire system by scanning all master types.
 * 
 * @param allMasters List of all available master data types and their records.
 * @param prefix The prefix to use for the code (defaults to 'MD').
 * @returns A formatted string code like 'MD-001'.
 */
export function getNextCode(allMasters: MasterDataType[], prefix: string = 'MD'): string {
  // Combine all records from all types to ensure the suggested code is unique across the entire system
  const allRecords = Array.isArray(allMasters) ? allMasters.flatMap(m => m.records || []) : [];
  if (allRecords.length === 0) return `${prefix}-001`;

  const numbers = allRecords
    .map((record) => {
      // Matches codes ending with a hyphen followed by numbers (e.g., MD-001)
      const match = record.id.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

  return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
}

export type OptimisticUpdate = {
  action: 'create' | 'update' | 'delete';
  masterId: string;
  record?: MasterDataRecord;
  recordId: string | number;
};

export function applyOptimisticMasterUpdate(state: MasterDataType[], update: OptimisticUpdate): MasterDataType[] {
  // 1. Apply update to the target master
  const updatedState = state.map((m) => {
    if (m.id !== update.masterId) return m;
    let records = [...(m.records || [])];
    if (update.action === 'delete') {
      records = records.filter((r) => String(r.backendId || r.id) !== String(update.recordId));
    } else if (update.action === 'update' && update.record) {
      records = records.map((r) => String(r.backendId || r.id) === String(update.recordId) ? { ...r, ...update.record! } : r);
    } else if (update.action === 'create' && update.record) {
      records = [update.record, ...records];
    }
    return { ...m, records };
  });

  // 2. Sync logic for asset-category dependencies
  if (update.masterId === MASTER_IDS.CATEGORY) {
    return updatedState.map((m) => {
      if (m.id !== MASTER_IDS.TYPE) return m;
      let groups = [...(m.groups || [])];
      if (update.action === 'delete') {
        groups = groups.filter((g) => String(g.backendId || g.id) !== String(update.recordId));
      } else if (update.action === 'update' && update.record) {
        groups = groups.map((g) => 
          String(g.backendId || g.id) === String(update.recordId) 
            ? { 
                ...g, 
                name: update.record!.name, 
                backendId: update.record!.backendId || g.backendId,
                description: update.record!.description,
                status: update.record!.status,
                isMovable: update.record!.isMovable,
                hasFloorDetails: update.record!.hasFloorDetails,
                hasInventory: update.record!.hasInventory,
                isInventoryMandatory: update.record!.isInventoryMandatory,
                hasLegalCompliance: update.record!.hasLegalCompliance,
                valuationType: update.record!.valuationType
              } 
            : g
        );
      } else if (update.action === 'create' && update.record) {
        const newGroup = {
          id: String(update.record.backendId || update.recordId),
          name: update.record.name,
          count: 0,
          backendId: update.record.backendId || update.recordId,
          description: update.record.description,
          status: update.record.status,
          isMovable: update.record.isMovable,
          hasFloorDetails: update.record.hasFloorDetails,
          hasInventory: update.record.hasInventory,
          isInventoryMandatory: update.record.isInventoryMandatory,
          hasLegalCompliance: update.record.hasLegalCompliance,
          valuationType: update.record.valuationType
        };
        groups = [...groups, newGroup];
      }
      return { ...m, groups };
    });
  }

  return updatedState;
}
