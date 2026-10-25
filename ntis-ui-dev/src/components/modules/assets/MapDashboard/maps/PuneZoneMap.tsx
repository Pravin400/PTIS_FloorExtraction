import {
  puneWards,
  puneCorporationBoundary,
  zoneColors,
} from "../data/geo-boundaries/pune/data/boundaries-data";

import type { PuneZoneMapProps } from '@/types/assets/map-dashboard.types';

export default function PuneZoneMap({ selectedWard }: PuneZoneMapProps) {
  return (
    <svg
      viewBox={`${puneCorporationBoundary.viewBox.x} ${puneCorporationBoundary.viewBox.y} ${puneCorporationBoundary.viewBox.width} ${puneCorporationBoundary.viewBox.height}`}
      className="w-full h-full bg-white"
      style={{ maxHeight: "100%", minHeight: "400px" }}
    >
      <style>{`
        .ward-path {
          transition: fill 0.15s ease, opacity 0.15s ease;
        }
        .ward-path:hover {
          opacity: 0.85;
        }
      `}</style>
      
      {/* PMC Outer Boundary */}
      {puneCorporationBoundary.outerBoundary &&
        puneCorporationBoundary.outerBoundary !== "M 0,0" && (
          <path
            d={puneCorporationBoundary.outerBoundary}
            fill="#10b981"
            fillOpacity="0.1"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

      {/* Ward Boundaries */}
      {puneWards.map((ward) => {
        const isSelected = selectedWard === ward.id;

        // Assign colors by ward name for specific wards
        let wardColor;
        if (ward.name === "Central Pune") {
          wardColor = "#5cedce"; // Turquoise/cyan
        } else if (ward.name === "North Pune") {
          wardColor = "#ec4899"; // Pink/magenta
        } else {
          wardColor = zoneColors[ward.zone] || "#10b981";
        }
        const zoneColor = wardColor;

        return (
          <g key={ward.id}>
            {/* Ward Path */}
            <path
              d={ward.boundary}
              fill={zoneColor}
              fillOpacity={isSelected ? 0.85 : 0.6}
              stroke="#000000"
              strokeWidth={isSelected ? 3 : 1.5}
              strokeLinejoin="round"
              className="ward-path cursor-pointer"
            >
              <title>{ward.name}</title>
            </path>

            {/* Ward Label */}
            {ward.boundary && ward.boundary !== "" && (() => {
              const centroid = getWardCentroid(ward.boundary);
              return (
                <text
                  x={ward.id === "ward-4" ? centroid.x + 150 : centroid.x}
                  y={ward.id === "ward-4" ? centroid.y - 120 : centroid.y}
                  fontSize={isSelected ? 16 : 14}
                  fontWeight={isSelected ? "700" : "600"}
                  fill="#0f172a"
                  textAnchor={ward.id === "ward-4" ? "start" : "middle"}
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    textShadow: "0 0 3px white, 0 0 3px white",
                    transition: "all 0.2s ease",
                  }}
                >
                  {ward.name}
                </text>
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}

// Helper function to calculate approximate centroid of an SVG path
function getWardCentroid(pathData: string): {
  x: number;
  y: number;
} {
  const numbers = pathData.match(/-?\d+\.?\d*/g);

  if (!numbers || numbers.length < 2) {
    return { x: 400, y: 300 }; // Default center
  }

  const coords: number[] = numbers.map((n) => parseFloat(n));

  // Separate x and y coordinates (assuming they alternate)
  const xCoords: number[] = [];
  const yCoords: number[] = [];

  for (let i = 0; i < coords.length; i += 2) {
    xCoords.push(coords[i]);
    if (i + 1 < coords.length) {
      yCoords.push(coords[i + 1]);
    }
  }

  // Calculate average
  const avgX =
    xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
  const avgY =
    yCoords.reduce((a, b) => a + b, 0) / yCoords.length;

  return { x: avgX, y: avgY };
}