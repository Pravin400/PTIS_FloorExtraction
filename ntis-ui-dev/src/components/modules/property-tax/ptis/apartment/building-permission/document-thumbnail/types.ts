import type React from 'react';

export interface DocumentThumbnailProps {
  documentGuid?: string | null;
  fileName?: string | null;
  alt?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showFormatBadge?: boolean;
}

export interface CachedThumbnail {
  url: string;
  format: 'PDF' | 'IMG' | 'DOC';
}

// In-memory session cache so previously rendered document thumbnails load instantly
export const thumbnailCache = new Map<string, CachedThumbnail>();

// In-memory cache for GUIDs that returned 404 or failed to load, preventing repeated network requests
export const failedGuidCache = new Set<string>();

// In-flight deduplication map so simultaneous cards for the same document share a single network request
export const inFlightThumbnails = new Map<string, Promise<CachedThumbnail | null>>();
