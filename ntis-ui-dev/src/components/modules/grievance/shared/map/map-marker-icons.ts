import L from 'leaflet';

export const CATEGORY_ICONS_SVG: Record<string, string> = {
  water: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  garden: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B"><path d="M12 2C8.69 2 6 4.69 6 8c0 1.95.94 3.69 2.41 4.79C7.43 13.56 7 14.73 7 16h4v6h2v-6h4c0-1.27-.43-2.44-1.41-3.21C17.06 11.69 18 9.95 18 8c0-3.31-2.69-6-6-6z"/></svg>`,
  civic: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B"><path d="M12 1L2 6v2h20V6L12 1zm-7 8v9h2.5V9H5zm4.5 0v9H12V9H9.5zm4.5 0v9h2.5V9H14zm4.5 0v9H21V9h-2.5zM2 20v2h20v-2H2z"/></svg>`,
  sanitation: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2-9h8v9H8v-9z"/></svg>`,
  roads: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,
};

export function createCategoryMarkerIcon(type: string): L.DivIcon {
  const iconSvg = CATEGORY_ICONS_SVG[type] || CATEGORY_ICONS_SVG.civic;
  return L.divIcon({
    className: 'custom-civic-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: #FFFFFF;
        border: 1.5px solid #E2E8F0;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function createActiveRedMarkerIcon(type: string): L.DivIcon {
  const iconSvg = CATEGORY_ICONS_SVG[type] || CATEGORY_ICONS_SVG.civic;
  return L.divIcon({
    className: 'custom-active-red-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="
          position: absolute;
          width: 52px; height: 52px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.35);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 2px solid #EF4444;
          background: rgba(254, 226, 226, 0.7);
        "></div>
        <div style="
          width: 36px; height: 36px;
          background: #DC2626;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 18px rgba(220, 38, 38, 0.6);
          position: relative;
          z-index: 2;
        ">
          <div style="filter: brightness(0) invert(1); display: flex; align-items: center; justify-content: center;">
            ${iconSvg}
          </div>
        </div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
}

export function createAmravatiCenterPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-center-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          width: 32px; height: 38px;
          background: #EAB308;
          border-radius: 16px 16px 16px 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.45);
          position: relative;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#1E293B">
              <path d="M18.1 4H5.9L2 20h20l-3.9-16zM9 18H7l1.5-6h2L9 18zm4 0h-2l.8-3h2l-.8 3zm2.5-6h-2l.8-3h2l-.8 3z"/>
            </svg>
          </div>
        </div>
        <div style="
          margin-top: 6px;
          font-size: 15px;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 4px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.8);
          user-select: none;
        ">
          Amravati
        </div>
      </div>
    `,
    iconSize: [80, 70],
    iconAnchor: [40, 20],
  });
}

export function createAreaLabelIcon(text: string, subtext?: string, icon?: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-area-label',
    html: `
      <div style="
        font-size: 12px;
        font-weight: 600;
        color: #64748B;
        white-space: nowrap;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 4px;
        text-shadow: 0 1px 3px rgba(255,255,255,0.95);
      ">
        ${icon ? `<span style="font-size: 13px;">${icon}</span>` : ''}
        <div>
          <div>${text}</div>
          ${subtext ? `<div style="font-size: 10px; color: #94A3B8;">${subtext}</div>` : ''}
        </div>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12],
  });
}
