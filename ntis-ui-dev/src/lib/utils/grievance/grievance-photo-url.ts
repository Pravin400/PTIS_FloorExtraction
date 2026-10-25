/**
 * Grievance Photo URL Resolver Utility (Client & Server safe)
 * Path: src/lib/utils/grievance/grievance-photo-url.ts
 *
 * Routes photo URLs through our internal Next.js streaming proxy route:
 * GET /api/grievance/photos/[id]/view (which uses apiClient internally).
 */

export function resolveGrievancePhotoUrl(url?: string | null, photoId?: number | string): string {
  if (photoId) {
    return `/api/grievance/photos/${photoId}/view`;
  }
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Extract ID from backend format e.g. "/api/grievance-photos/48/view" -> 48
  const match = url.match(/\/(\d+)\/view/);
  if (match) {
    return `/api/grievance/photos/${match[1]}/view`;
  }

  return url;
}
