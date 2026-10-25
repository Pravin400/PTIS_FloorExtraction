import { InventoryItemNameItem } from '@/types/asset-masters/inventory-model.types';
import { MasterDataRecord } from '@/types/asset-masters/master-data.types';

export function mapInventoryNameToMasterRecord(nameItem: InventoryItemNameItem): MasterDataRecord {
  return {
    id: nameItem.subTypeCode,
    backendId: nameItem.id,
    name: nameItem.subTypeName,
    description: nameItem.description || '',
    group: nameItem.inventoryItemCategoryId.toString(),
    status: nameItem.isActive ? 'Active' : 'Inactive',
    displayOrder: nameItem.displayOrder,
  };
}
