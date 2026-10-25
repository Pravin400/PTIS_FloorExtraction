import L from 'leaflet';

/**
 * Radar Blinking Beacon Generator for Grievance GIS Pins.
 * Standard: Clean Architecture / ntis-ui
 * Zoom-responsive dimensions with dynamic color resolution.
 */

export function getRadarBeaconHtml(
  status: string = 'Pending',
  isResolved: boolean = false,
  isEscalated: boolean = false,
  isSelected: boolean = false,
  zoom: number = 13,
  customColor?: string
): string {
  const s = (status || '').toLowerCase();

  // Status Theme Colors:
  // Default / Pending: Vibrant Red (#EF4444)
  let coreGradient = 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 35%, #dc2626 70%, #991b1b 100%)';
  let ringColor = 'rgba(239, 68, 68, 0.75)';
  let glowColor = 'rgba(239, 68, 68, 0.95)';

  if (customColor) {
    coreGradient = `radial-gradient(circle at 35% 35%, #ffffff 0%, ${customColor} 45%, ${customColor} 100%)`;
    ringColor = customColor;
    glowColor = customColor;
  } else if (isResolved || s.includes('resolved') || s.includes('closed')) {
    // Resolved: Vibrant Emerald Green (#10B981)
    coreGradient = 'radial-gradient(circle at 35% 35%, #34d399 0%, #10b981 35%, #059669 70%, #047857 100%)';
    ringColor = 'rgba(16, 185, 129, 0.75)';
    glowColor = 'rgba(16, 185, 129, 0.95)';
  } else if (s.includes('progress') || s.includes('assigned') || s.includes('review')) {
    // In-Progress: Vibrant Yellow (#EAB308)
    coreGradient = 'radial-gradient(circle at 35% 35%, #fef08a 0%, #facc15 35%, #eab308 70%, #ca8a04 100%)';
    ringColor = 'rgba(234, 179, 8, 0.75)';
    glowColor = 'rgba(234, 179, 8, 0.95)';
  } else if (isEscalated || s.includes('escalated')) {
    // Escalated: Rose Red
    coreGradient = 'radial-gradient(circle at 35% 35%, #fb7185 0%, #e11d48 35%, #be123c 70%, #9f1239 100%)';
    ringColor = 'rgba(225, 29, 72, 0.75)';
    glowColor = 'rgba(225, 29, 72, 1)';
  }

  // Zoom-dependent dimensions
  let coreSize = 20;
  let wrapperSize = 32;
  let ringSize = 20;
  let svgSize = 10;
  let ringBorderWidth = 1.2;

  if (zoom <= 12) {
    coreSize = isSelected ? 15 : 12;
    wrapperSize = isSelected ? 22 : 18;
    ringSize = 14;
    svgSize = isSelected ? 7 : 6;
    ringBorderWidth = 1;
  } else if (zoom <= 14) {
    coreSize = isSelected ? 18 : 15;
    wrapperSize = isSelected ? 28 : 22;
    ringSize = 16;
    svgSize = isSelected ? 9 : 7;
    ringBorderWidth = 1;
  } else if (zoom <= 16) {
    coreSize = isSelected ? 22 : 18;
    wrapperSize = isSelected ? 34 : 28;
    ringSize = 20;
    svgSize = isSelected ? 11 : 9;
    ringBorderWidth = 1.2;
  } else {
    coreSize = isSelected ? 26 : 22;
    wrapperSize = isSelected ? 42 : 36;
    ringSize = 24;
    svgSize = isSelected ? 13 : 11;
    ringBorderWidth = 1.5;
  }

  return `
    <div class="amc-red-beacon-wrapper ${isSelected ? 'is-selected' : ''}" style="
      position: relative;
      width: ${wrapperSize}px;
      height: ${wrapperSize}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div class="amc-radar-ring ring-1" style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${ringSize}px;
        height: ${ringSize}px;
        border-radius: 9999px;
        background: transparent;
        border: ${ringBorderWidth}px solid ${ringColor};
        transform: translate(-50%, -50%);
        animation: amcRadarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        pointer-events: none;
      "></div>
      <div class="amc-radar-ring ring-2" style="
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${ringSize}px;
        height: ${ringSize}px;
        border-radius: 9999px;
        background: transparent;
        border: ${ringBorderWidth}px solid ${ringColor};
        transform: translate(-50%, -50%);
        animation: amcRadarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.75s;
        pointer-events: none;
      "></div>
      <div class="amc-beacon-core" style="
        position: relative;
        z-index: 2;
        width: ${coreSize}px;
        height: ${coreSize}px;
        border-radius: 9999px;
        background: ${coreGradient};
        border: ${zoom <= 12 ? '1.5px' : '2px'} solid #ffffff;
        box-shadow: 0 0 8px ${glowColor}, 0 2px 4px rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="#ffffff" style="display: block;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `;
}

export const createRadarBeaconIcon = (
  status: string = 'Pending',
  isResolved: boolean = false,
  isEscalated: boolean = false,
  isSelected: boolean = false,
  zoom: number = 13,
  customColor?: string
): L.DivIcon => {
  let wrapperSize = 32;
  if (zoom <= 12) wrapperSize = isSelected ? 22 : 18;
  else if (zoom <= 14) wrapperSize = isSelected ? 28 : 22;
  else if (zoom <= 16) wrapperSize = isSelected ? 34 : 28;
  else wrapperSize = isSelected ? 42 : 36;

  return L.divIcon({
    html: getRadarBeaconHtml(status, isResolved, isEscalated, isSelected, zoom, customColor),
    className: 'custom-gis-beacon-pin',
    iconSize: [wrapperSize, wrapperSize],
    iconAnchor: [wrapperSize / 2, wrapperSize / 2],
    tooltipAnchor: [0, -wrapperSize / 2],
  });
};

export const getRedBlinkingBeaconHtml = (
  _trackingId?: string,
  status?: string,
  isResolved?: boolean,
  isEscalated?: boolean,
  isSelected?: boolean,
  zoom?: number
): string => getRadarBeaconHtml(status, isResolved, isEscalated, isSelected, zoom);
