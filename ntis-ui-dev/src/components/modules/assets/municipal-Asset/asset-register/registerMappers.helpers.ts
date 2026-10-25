import type { PropertyPhotoDto } from '@/types/asset/asset-register/media.types';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';

export function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN');
}

export function formatMoney(value: string) {
  if (!value || value === '-') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return numeric.toLocaleString('en-IN');
}

export function formatBoolean(value?: boolean | string | null) {
  if (value === true || value === 'true') return 'Yes';
  if (value === false || value === 'false') return 'No';
  return '-';
}

export function formatFieldValue(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? '-' : value.map((entry) => formatFieldValue(entry)).join(', ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '-';
    const flattened = entries
      .map(([key, entry]) => {
        const formatted = formatFieldValue(entry);
        return formatted === '-' ? null : `${key}: ${formatted}`;
      })
      .filter((entry): entry is string => Boolean(entry));
    return flattened.length > 0 ? flattened.join(', ') : '-';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '-';
  }
}

type GroupedAssetPhotos = {
  photoTypes?: Array<{
    photos?: Array<{
      photoId?: number;
      propertyPhotoId?: number;
      assetId?: number;
      propertyId?: number;
      photoTypeId?: number;
      photoTypeCode?: string;
      photoTypeName?: string;
      displayOrder?: number;
      remarks?: string;
      viewUrl?: string;
      documentGuid?: string;
    }>;
  }>;
};

export function mapGroupedAssetPhotosToPanelPhotos(data?: GroupedAssetPhotos | null): PropertyPhotoDto[] {
  const photoTypes = data?.photoTypes || [];
  return photoTypes.flatMap((type) =>
    (type.photos || []).flatMap((photo) => {
      const propertyPhotoId = photo.photoId ?? photo.propertyPhotoId;
      const propertyId = photo.assetId ?? photo.propertyId;
      const photoTypeId = photo.photoTypeId;
      const photoTypeCode = photo.photoTypeCode;
      const photoTypeName = photo.photoTypeName;

      if (
        propertyPhotoId == null ||
        propertyId == null ||
        photoTypeId == null ||
        !photoTypeCode ||
        !photoTypeName
      ) {
        return [];
      }

      return [{
        propertyPhotoId,
        propertyId,
        photoTypeId,
        photoTypeCode,
        photoTypeName,
        displayOrder: photo.displayOrder,
        remarks: photo.remarks,
        viewUrl: photo.documentGuid ? getViewDocumentUrl(photo.documentGuid) : photo.viewUrl,
        documentGuid: photo.documentGuid,
      }];
    })
  );
}
