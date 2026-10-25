 
import {
  ApiFloorMasterItem,
  ApiMasterTableItem,
} from '@/types/asset/municipal-Asset/asset-detail-api.types';

export function isApiFloorMasterItemShape(value: unknown): value is ApiFloorMasterItem {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'floorId' in obj || 'FloorId' in obj || 'id' in obj || 'Id' in obj || 'floorName' in obj || 'FloorName' in obj;
}

export function isApiSubUnitItemShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'unitNo' in obj || 'UnitNo' in obj || 'shopUnitName' in obj || 'ShopUnitName' in obj || 'id' in obj || 'Id' in obj;
}

export function isApiMasterTableItemShape(value: unknown): value is ApiMasterTableItem {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'description' in obj || 'Description' in obj || 'id' in obj || 'Id' in obj || 'name' in obj || 'Name' in obj || 'typeOfUseName' in obj;
}
