/**
 * Grievance Evidence Photo Utilities
 * Path: src/lib/utils/grievance/grievance-photo.utils.ts
 *
 * Provides client-safe URL builders for evidence photos.
 */

import { resolveGrievancePhotoUrl } from './grievance-photo-url';

/**
 * Returns the streaming proxy URL for a grievance evidence photo by its ID.
 */
export function getGrievancePhotoViewUrl(photoId: number | string): string {
  if (!photoId) return '';
  return `/api/grievance/photos/${photoId}/view`;
}

/**
 * Extracts a displayable streaming/resolved URL from any Grievance photo item or record.
 */
export function extractGrievancePhotoUrl(
  p?: { viewPhotoUrl?: string | null; id?: number | string | null } | null
): string {
  if (!p) return '';
  if (p.viewPhotoUrl) {
    return resolveGrievancePhotoUrl(p.viewPhotoUrl);
  }
  if (p.id) {
    return getGrievancePhotoViewUrl(p.id);
  }
  return '';
}

/**
 * Backward-compatible alias for extractGrievancePhotoUrl.
 */
export const extractPhotoUrl = extractGrievancePhotoUrl;
