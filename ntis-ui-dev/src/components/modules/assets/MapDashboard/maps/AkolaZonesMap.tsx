
import {
  akolaZonesData,
  zoneColors,
} from "../data/geo-boundaries/akola/data/zones-data";
import { akolaZoneBoundaries } from "../data/geo-boundaries/akola/data/boundaries-data";
import type { AkolaZonesMapProps } from '@/types/assets/map-dashboard.types';

export default function AkolaZonesMap({ selectedZone }: AkolaZonesMapProps) {
  const getZoneColor = (zoneId: string) => {
    const zone = akolaZonesData[zoneId];
    if (!zone) return "#e2e8f0";

    const colorKey = zone.color as keyof typeof zoneColors;
    const colorTheme = zoneColors[colorKey] || zoneColors.zone1;

    const isSelected = selectedZone?.id === zoneId;
    return isSelected ? colorTheme.selected : colorTheme.default;
  };

  const centerPositions: Record<string, { x: number; y: number }> = {
    zone1: { x: 600, y: 300 },
    zone2: { x: 430, y: 125 },
    zone3: { x: 550, y: 475 },
    zone4: { x: 260, y: 350 },
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <style>{`
        .zone-path {
          transition: fill 0.15s ease, opacity 0.15s ease;
        }
        .zone-path:hover {
          opacity: 0.85;
        }
      `}</style>
      <svg
        viewBox="0 -70 800 780"
        className="w-full h-auto bg-white"
        style={{ maxHeight: "77vh", minHeight: "550px" }}
      >
        {/* Zone Paths */}
        {Object.entries(akolaZoneBoundaries).map(([zoneId, path]) => {
          const zone = akolaZonesData[zoneId];
          if (!zone) return null;

          const isSelected = selectedZone?.id === zoneId;

          return (
            <path
              key={zoneId}
              d={path}
              fill={getZoneColor(zoneId)}
              fillOpacity={isSelected ? 0.85 : 0.6}
              stroke="#000000"
              strokeWidth={isSelected ? 3 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="zone-path cursor-pointer"
            >
              <title>{zone.name} - {zone.description}</title>
            </path>
          );
        })}

        {/* Zone Labels */}
        {Object.entries(akolaZonesData).map(([zoneId, zone]) => {
          const position = centerPositions[zoneId] || { x: 400, y: 300 };

          return (
            <text
              key={`label-${zoneId}`}
              x={position.x}
              y={position.y}
              textAnchor="middle"
              className="text-sm font-medium pointer-events-none"
              fill='#1e293b'
            >
              {zone.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}