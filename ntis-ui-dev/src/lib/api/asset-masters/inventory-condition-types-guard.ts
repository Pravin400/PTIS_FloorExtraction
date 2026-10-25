import { InventoryConditionItem } from '@/types/asset-masters/inventory-model.types';
import { MasterDataRecord } from '@/types/asset-masters/master-data.types';

export function mapInventoryConditionToMasterRecord(condition: InventoryConditionItem): MasterDataRecord {
  return {
    id: condition.id.toString(),
    backendId: condition.id,
    name: condition.conditionName,
    description: condition.description || '',
    group: condition.inventoryItemCategoryId.toString(),
    status: condition.isActive ? 'Active' : 'Inactive',
    displayOrder: condition.displayOrder,
    conditionFactor: condition.conditionFactor,
  };
}
