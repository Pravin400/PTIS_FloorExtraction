import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardMapAssetType } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import L from 'leaflet';

export interface ExtendedAsset extends DashboardMapAssetType {
  latitude?: number;
  longitude?: number;
}

export const getAssetCoords = (asset: ExtendedAsset): { lat: number; lng: number } | null => {
  if (asset.coordinates?.lat && asset.coordinates?.lng) return asset.coordinates;
  if (asset.latitude && asset.longitude && asset.latitude !== 0 && asset.longitude !== 0) return { lat: asset.latitude, lng: asset.longitude };
  return null;
};

// Fix for default marker icons in Leaflet with webpack/next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const CATEGORY_ICONS: Record<string, string> = {
  land: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>`,
  'land & plots': `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`,
  buildings: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`,
  infrastructure: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z"/></svg>`,
  movable: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  vehicles: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
};

const COLOR_PALETTE = [
  { bg: '#3b82f6', border: '#2563eb', shadow: 'rgba(59, 130, 246, 0.4)' },
  { bg: '#14b8a6', border: '#0d9488', shadow: 'rgba(20, 184, 166, 0.4)' },
  { bg: '#f97316', border: '#ea580c', shadow: 'rgba(249, 115, 22, 0.4)' },
  { bg: '#8b5cf6', border: '#7c3aed', shadow: 'rgba(139, 92, 246, 0.4)' },
  { bg: '#ec4899', border: '#db2777', shadow: 'rgba(236, 72, 153, 0.4)' },
  { bg: '#10b981', border: '#059669', shadow: 'rgba(16, 185, 129, 0.4)' },
  { bg: '#6366f1', border: '#4f46e5', shadow: 'rgba(99, 102, 241, 0.4)' },
  { bg: '#f59e0b', border: '#d97706', shadow: 'rgba(245, 158, 11, 0.4)' },
];

export const getCategoryIcon = (category: string): string => {
  const norm = category.toLowerCase().trim();
  if (CATEGORY_ICONS[norm]) return CATEGORY_ICONS[norm];
  if (norm.includes('land') || norm.includes('plot')) return CATEGORY_ICONS.land;
  if (norm.includes('building') || norm.includes('structure')) return CATEGORY_ICONS.building;
  if (norm.includes('vehicle') || norm.includes('movable') || norm.includes('transport')) return CATEGORY_ICONS.movable;
  if (norm.includes('infrastructure') || norm.includes('utility')) return CATEGORY_ICONS.infrastructure;

  const letter = (category.trim().substring(0, 1) || 'A').toUpperCase();
  return `<span style="font-weight: 900; color: white; font-size: 12px; font-family: system-ui, sans-serif;">${letter}</span>`;
};

const categoryColorCache: Record<string, typeof COLOR_PALETTE[0]> = {};
export const getCategoryColor = (category: string, categories: string[]): typeof COLOR_PALETTE[0] => {
  const norm = category.toLowerCase().trim();
  if (categoryColorCache[norm]) return categoryColorCache[norm];
  let color: typeof COLOR_PALETTE[0];
  if (norm.includes('building') || norm.includes('structure')) color = COLOR_PALETTE[0];
  else if (norm.includes('land') || norm.includes('plot')) color = COLOR_PALETTE[1];
  else if (norm.includes('vehicle') || norm.includes('movable') || norm.includes('transport')) color = COLOR_PALETTE[2];
  else if (norm.includes('infrastructure') || norm.includes('utility')) color = COLOR_PALETTE[3];
  else {
    const index = categories.findIndex(c => c.toLowerCase().trim() === norm);
    color = COLOR_PALETTE[(index >= 0 ? index : categories.length) % COLOR_PALETTE.length];
  }
  categoryColorCache[norm] = color;
  return color;
};

export const createCategoryIcon = (category: string, categories: string[], isSelected: boolean = false) => {
  const style = getCategoryColor(category, categories);
  const icon = getCategoryIcon(category);
  const size = isSelected ? 44 : 36, iconSize = isSelected ? 20 : 16;
  return new L.DivIcon({
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div style="position: absolute; top: 0; left: 50%; width: ${size}px; height: ${size}px; background: linear-gradient(135deg, ${style.bg} 0%, ${style.border} 100%); border-radius: 50% 50% 50% 0; transform: translateX(-50%) rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px ${style.shadow}, 0 2px 4px rgba(0,0,0,0.2); ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}"></div>
        <div style="position: absolute; top: ${(size - iconSize) / 2 - 2}px; left: 50%; transform: translateX(-50%); width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center;">${icon}</div>
      </div>
      <style>@keyframes pulse { 0%, 100% { transform: translateX(-50%) rotate(-45deg) scale(1); } 50% { transform: translateX(-50%) rotate(-45deg) scale(1.1); } }</style>
    `,
    className: 'custom-category-marker', iconSize: [size, size + 10], iconAnchor: [size / 2, size + 5], popupAnchor: [0, -size],
  });
};

export const TILE_LAYERS = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' },
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  hybrid: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
};
export const LABELS_LAYER = { url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attribution: '' };

export interface MapViewProps {
  assets: ExtendedAsset[];
  selectedAsset?: ExtendedAsset | null;
  onAssetClick: (asset: DashboardMapAssetType | null) => void;
  activeFilters: string[];
  categories?: Array<{ id: string; name: string; count: number }>;
  hideUI?: boolean;
}

const DEFAULT_CENTER: [number, number] | null = null;
const DEFAULT_ZOOM = 12;

export function useMapView({ assets, selectedAsset, onAssetClick, activeFilters, categories = [] }: MapViewProps) {
  const [mapType, setMapType] = useState<'satellite' | 'street' | 'hybrid'>('satellite');
  const [isClient, setIsClient] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsClient(true); }, []);

  const categoryNames = useMemo(() => {
    if (categories.length > 0) return categories.map(c => c.id || c.name);
    return [...new Set(assets.map(a => a.category))];
  }, [assets, categories]);

  const filteredAssets = useMemo(() => {
    const assetsWithCoords = assets.filter(a => { const c = getAssetCoords(a); return c !== null && c.lat !== 0 && c.lng !== 0; });
    if (activeFilters.length === 0) return assetsWithCoords;
    return assetsWithCoords.filter(a => activeFilters.includes(a.category.toLowerCase()));
  }, [assets, activeFilters]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAssets.forEach(a => { const c = a.category.toLowerCase(); counts[c] = (counts[c] || 0) + 1; });
    return counts;
  }, [filteredAssets]);

  const handleMarkerClick = useCallback((asset: ExtendedAsset) => { onAssetClick(asset); }, [onAssetClick]);

  const mapCenter = useMemo(() => {
    const selectedCoords = selectedAsset ? getAssetCoords(selectedAsset) : null;
    if (selectedCoords) return [selectedCoords.lat, selectedCoords.lng] as [number, number];
    if (filteredAssets.length > 0) {
      const validAssets = filteredAssets.filter(a => getAssetCoords(a) !== null);
      if (validAssets.length > 0) {
        const avgLat = validAssets.reduce((sum, a) => sum + getAssetCoords(a)!.lat, 0) / validAssets.length;
        const avgLng = validAssets.reduce((sum, a) => sum + getAssetCoords(a)!.lng, 0) / validAssets.length;
        return [avgLat, avgLng] as [number, number];
      }
    }
    return DEFAULT_CENTER;
  }, [filteredAssets, selectedAsset]);

  return { mapType, setMapType, isClient, defaultCenter: DEFAULT_CENTER, defaultZoom: DEFAULT_ZOOM, categoryNames, filteredAssets, categoryCounts, handleMarkerClick, mapCenter };
}
