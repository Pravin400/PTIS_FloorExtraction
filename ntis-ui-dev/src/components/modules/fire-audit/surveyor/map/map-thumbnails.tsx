import React from 'react';
import type { SurveyorMapLayerType } from '@/lib/constants/fire-audit';

/* 1. Standard Street Map Preview Vector Thumbnail */
export function StandardThumbnail() {
  return (
    <svg viewBox="0 0 64 48" className="w-full h-full object-cover" aria-hidden="true">
      <rect width="64" height="48" fill="#EBF2E8" />
      <path d="M0,0 C12,8 18,22 24,34 C28,42 34,48 40,48 L0,48 Z" fill="#93C5FD" />
      <path d="M10,0 C18,12 26,26 36,36 C44,44 54,48 64,48" stroke="#FFA726" strokeWidth="2.5" fill="none" />
      <path d="M0,20 C18,22 36,18 64,24" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
      <path d="M30,0 C32,16 38,32 50,48" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <circle cx="36" cy="24" r="2.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
      <rect x="42" y="6" width="16" height="12" rx="2" fill="#BBF7D0" opacity="0.8" />
    </svg>
  );
}

/* 2. Satellite Aerial Imagery Vector Thumbnail */
export function SatelliteThumbnail() {
  return (
    <svg viewBox="0 0 64 48" className="w-full h-full object-cover" aria-hidden="true">
      <rect width="64" height="48" fill="#243329" />
      <path d="M0,0 C14,10 20,24 24,36 C28,42 32,48 38,48 L0,48 Z" fill="#13232C" />
      <rect x="26" y="4" width="34" height="38" fill="#313E34" opacity="0.9" />
      <path d="M26,12 H60 M26,20 H60 M26,28 H60 M26,36 H60" stroke="#4B584E" strokeWidth="0.8" strokeDasharray="2,2" />
      <path d="M34,4 V42 M44,4 V42 M54,4 V42" stroke="#4B584E" strokeWidth="0.8" strokeDasharray="2,2" />
      <path d="M12,0 C18,14 26,26 36,36 C42,42 52,48 64,48" stroke="#6B7280" strokeWidth="1.2" fill="none" opacity="0.7" />
      <circle cx="44" cy="20" r="2.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  );
}

/* 3. Topographic Terrain Relief Vector Thumbnail */
export function TerrainThumbnail() {
  return (
    <svg viewBox="0 0 64 48" className="w-full h-full object-cover" aria-hidden="true">
      <rect width="64" height="48" fill="#D2E8B9" />
      <path d="M0,0 C16,8 24,20 28,32 C32,40 38,48 44,48 L0,48 Z" fill="#93C5FD" />
      <path d="M14,4 C24,8 34,4 48,10 C56,14 64,10 64,12" stroke="#B1D192" strokeWidth="1.5" fill="none" />
      <path d="M18,16 C30,22 42,16 54,20 C60,22 64,20 64,22" stroke="#A3C781" strokeWidth="1.8" fill="none" />
      <path d="M24,28 C34,34 46,28 60,34" stroke="#94BA6F" strokeWidth="2" fill="none" />
      <path d="M28,40 C38,44 48,38 64,44" stroke="#84AA5E" strokeWidth="2.2" fill="none" />
      <polygon points="46,18 49,24 43,24" fill="#65A30D" />
      <polygon points="56,28 59,34 53,34" fill="#4D7C0F" />
      <circle cx="34" cy="30" r="2.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  );
}

export const MAP_THUMBNAILS: Record<SurveyorMapLayerType, React.ComponentType> = {
  default: StandardThumbnail,
  satellite: SatelliteThumbnail,
  terrain: TerrainThumbnail,
};
