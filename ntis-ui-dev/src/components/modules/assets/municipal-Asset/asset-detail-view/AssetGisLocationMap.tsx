'use client';


import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import type { AssetGisLocationMapProps } from '@/types/asset/municipal-Asset/asset-detail.types';





export default function AssetGisLocationMap({ lat, lng, zoom }: AssetGisLocationMapProps) {
  const position: [number, number] = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      className="w-full h-full z-0"
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={false}
      dragging={false}
    >
      {/* Blank for now */}
    </MapContainer>
  );
}
