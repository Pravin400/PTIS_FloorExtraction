import 'server-only';
import { apiClient } from '@/services/api.service';

export async function resolvePropertyId(
  propertyNo: string,
  wardId?: number,
): Promise<number | null> {
  const trimmedPropertyNo = propertyNo.trim();
  if (!trimmedPropertyNo) return null;

  const readItems = (data: unknown): Array<Record<string, unknown>> => {
    if (!data || typeof data !== 'object') return [];
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as Array<Record<string, unknown>>;
    if (Array.isArray(record.Items)) return record.Items as Array<Record<string, unknown>>;
    if (Array.isArray(record.data)) return record.data as Array<Record<string, unknown>>;
    if (Array.isArray(record.Data)) return record.Data as Array<Record<string, unknown>>;
    return [];
  };

  const readText = (item: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
      const value = item[key];
      if (value !== undefined && value !== null) return String(value).trim();
    }
    return '';
  };

  const readPropertyId = (item: Record<string, unknown>): number | null => {
    const raw = item.propertyId ?? item.PropertyId ?? item.id ?? item.Id ?? null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  };

  const findMatchingPropertyId = (items: Array<Record<string, unknown>>): number | null => {
    const exactMatch = items.find((item) => {
      const itemPropertyNo = readText(item, 'propertyNo', 'PropertyNo');
      return itemPropertyNo === trimmedPropertyNo;
    });
    return readPropertyId(exactMatch ?? items[0] ?? {});
  };

  const attempts: string[] = [];

  const searchParams = new URLSearchParams();
  searchParams.set('PropertyNoFrom', trimmedPropertyNo);
  searchParams.set('PropertyNoTo', trimmedPropertyNo);
  searchParams.set('PropertyNo', trimmedPropertyNo);
  if (wardId && wardId > 0) searchParams.set('WardId', String(wardId));
  searchParams.set('PageSize', '5');
  attempts.push(`/Property/search?${searchParams.toString()}`);

  const propertyParams = new URLSearchParams();
  propertyParams.set('PropertyNo', trimmedPropertyNo);
  if (wardId && wardId > 0) propertyParams.set('WardId', String(wardId));
  propertyParams.set('PageSize', wardId && wardId > 0 ? '-1' : '5');
  propertyParams.set('PageNumber', '1');
  attempts.push(`/Property?${propertyParams.toString()}`);

  if (wardId && wardId > 0) {
    const wardParams = new URLSearchParams();
    wardParams.set('WardId', String(wardId));
    wardParams.set('PageSize', '-1');
    wardParams.set('PageNumber', '1');
    attempts.push(`/Property?${wardParams.toString()}`);
  }

  for (const endpoint of attempts) {
    try {
      const response = await apiClient.get<unknown>(endpoint);
      if (!response.success || !response.data) continue;
      const propertyId = findMatchingPropertyId(readItems(response.data));
      if (propertyId) return propertyId;
    } catch {
      // Try the next known property lookup shape.
    }
  }

  return null;
}

export interface PropertySummaryItem {
  propertyId: number;
  propertyNo: string;
  partitionNo: string | null;
  ownerName: string;
}

/**
 * Find all properties matching a property number (to list multiple partitions).
 */
export async function resolveProperties(
  propertyNo: string,
  wardId?: number,
): Promise<PropertySummaryItem[]> {
  const trimmedPropertyNo = propertyNo.trim();
  if (!trimmedPropertyNo) return [];

  const readItems = (data: unknown): Array<Record<string, unknown>> => {
    if (!data || typeof data !== 'object') return [];
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as Array<Record<string, unknown>>;
    if (Array.isArray(record.Items)) return record.Items as Array<Record<string, unknown>>;
    if (Array.isArray(record.data)) return record.data as Array<Record<string, unknown>>;
    if (Array.isArray(record.Data)) return record.Data as Array<Record<string, unknown>>;
    return [];
  };

  const readText = (item: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
      const value = item[key];
      if (value !== undefined && value !== null) return String(value).trim();
    }
    return '';
  };

  const readPropertyId = (item: Record<string, unknown>): number | null => {
    const raw = item.propertyId ?? item.PropertyId ?? item.id ?? item.Id ?? null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  };

  const attempts: string[] = [];

  const searchParams = new URLSearchParams();
  searchParams.set('PropertyNoFrom', trimmedPropertyNo);
  searchParams.set('PropertyNoTo', trimmedPropertyNo);
  searchParams.set('PropertyNo', trimmedPropertyNo);
  if (wardId && wardId > 0) searchParams.set('WardId', String(wardId));
  searchParams.set('PageSize', '20'); // Get up to 20 partitions
  attempts.push(`/Property/search?${searchParams.toString()}`);

  const propertyParams = new URLSearchParams();
  propertyParams.set('PropertyNo', trimmedPropertyNo);
  if (wardId && wardId > 0) propertyParams.set('WardId', String(wardId));
  propertyParams.set('PageSize', '-1');
  propertyParams.set('PageNumber', '1');
  attempts.push(`/Property?${propertyParams.toString()}`);

  for (const endpoint of attempts) {
    try {
      const response = await apiClient.get<unknown>(endpoint);
      if (!response.success || !response.data) continue;
      const rawItems = readItems(response.data);
      
      const matchingRaw = rawItems.filter((item) => {
        const itemPropertyNo = readText(item, 'propertyNo', 'PropertyNo');
        return itemPropertyNo === trimmedPropertyNo;
      });

      if (matchingRaw.length > 0) {
        const mapped = matchingRaw.map((item) => {
          const propertyId = readPropertyId(item);
          const partitionNo = readText(item, 'partitionNo', 'PartitionNo') || null;
          const ownerName = readText(item, 'propertyHolderName', 'PropertyHolderName', 'ownerName', 'OwnerName') || 'N/A';
          return {
            propertyId: propertyId ?? 0,
            propertyNo: trimmedPropertyNo,
            partitionNo,
            ownerName,
          };
        }).filter(item => item.propertyId > 0);

        if (mapped.length > 0) {
          return mapped;
        }
      }
    } catch {
      // Try next shape
    }
  }

  return [];
}

