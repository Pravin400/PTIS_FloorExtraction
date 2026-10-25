import L from 'leaflet';
import type { SurveyorInspectionStatus } from '@/types/fire-audit';

/**
 * Status icons matching the exact icons in SurveyKpiCards:
 * - Assigned: ClipboardList
 * - Pending: Hourglass
 * - Overdue: AlertTriangle
 * - Due Today: Calendar
 * - Re-Inspection: RotateCw
 * - Completed: CheckCircle2
 */
export const STATUS_ICONS_SVG: Record<SurveyorInspectionStatus, string> = {
  assigned: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
  pending: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,
  overdue: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  due_today: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  re_inspection: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
  completed: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  in_progress: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

export const STATUS_GRADIENTS: Record<
  SurveyorInspectionStatus,
  { gradient: string; primary: string; shadow: string }
> = {
  assigned: {
    gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
    primary: '#2563EB',
    shadow: 'rgba(37, 99, 235, 0.45)',
  },
  pending: {
    gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
    primary: '#D97706',
    shadow: 'rgba(217, 119, 6, 0.45)',
  },
  overdue: {
    gradient: 'linear-gradient(135deg, #DC2626, #EF4444)',
    primary: '#DC2626',
    shadow: 'rgba(220, 38, 38, 0.55)',
  },
  due_today: {
    gradient: 'linear-gradient(135deg, #EA580C, #F97316)',
    primary: '#EA580C',
    shadow: 'rgba(234, 88, 12, 0.45)',
  },
  re_inspection: {
    gradient: 'linear-gradient(135deg, #9333EA, #A855F7)',
    primary: '#9333EA',
    shadow: 'rgba(147, 51, 234, 0.45)',
  },
  completed: {
    gradient: 'linear-gradient(135deg, #16A34A, #22C55E)',
    primary: '#16A34A',
    shadow: 'rgba(22, 163, 74, 0.45)',
  },
  in_progress: {
    gradient: 'linear-gradient(135deg, #D97706, #F59E0B)',
    primary: '#D97706',
    shadow: 'rgba(217, 119, 6, 0.45)',
  },
};

/**
 * Creates 3-layer crimson radar pulse marker for Overdue fire audit inspections
 * with the exact AlertTriangle icon from the Overdue KPI card.
 */
export function createOverdueMarkerIcon(isSelected = false, coLocatedCount?: number): L.DivIcon {
  const iconSvg = STATUS_ICONS_SVG.overdue;
  const selectScale = isSelected ? 'scale(1.22)' : 'scale(1)';

  return L.divIcon({
    className: 'surveyor-overdue-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${selectScale}; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
        <!-- Layer 1: Radar ping ripple -->
        <div style="position: absolute; width: 58px; height: 58px; border-radius: 50%; background: rgba(220, 38, 38, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; top: -11px; pointer-events: none;"></div>
        <!-- Layer 2: Soft red halo -->
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #DC2626; background: rgba(254, 226, 226, 0.85); top: -4px;"></div>
        <!-- Layer 3: Solid crimson pin center -->
        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #DC2626, #EF4444); border: 2.5px solid #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(220, 38, 38, 0.65), 0 2px 4px rgba(15, 23, 42, 0.15); color: #FFFFFF; position: relative; z-index: 2;">
          ${iconSvg}

          ${coLocatedCount && coLocatedCount > 1 ? `
            <div style="position: absolute; top: -6px; right: -6px; background: #0F172A; color: #FFFFFF; border: 1.5px solid #FFFFFF; border-radius: 9999px; font-size: 10px; font-weight: 800; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; padding: 0 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 10; line-height: 1;">+${coLocatedCount}</div>
          ` : ''}
        </div>
        <!-- Pointer Beak -->
        <div style="width: 8px; height: 8px; background: #DC2626; transform: rotate(45deg); margin-top: -4px; z-index: 1; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);"></div>
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 38],
  });
}

/**
 * Creates status-themed squircle pin with exact icon and gradient matching SurveyKpiCards.
 */
export function createSurveyorMarkerIcon(
  status: SurveyorInspectionStatus,
  isSelected = false,
  coLocatedCount?: number
): L.DivIcon {
  if (status === 'overdue') {
    return createOverdueMarkerIcon(isSelected, coLocatedCount);
  }

  const iconSvg = STATUS_ICONS_SVG[status] || STATUS_ICONS_SVG.assigned;
  const config = STATUS_GRADIENTS[status] || STATUS_GRADIENTS.assigned;
  const selectScale = isSelected ? 'scale(1.22)' : 'scale(1)';
  const selectBorder = isSelected
    ? '3px solid #FFFFFF'
    : '2.5px solid #FFFFFF';
  const extraShadow = isSelected
    ? `box-shadow: 0 0 0 3px ${config.primary}, 0 8px 24px ${config.shadow};`
    : `box-shadow: 0 4px 14px ${config.shadow}, 0 1px 3px rgba(15, 23, 42, 0.2);`;

  return L.divIcon({
    className: 'surveyor-status-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${selectScale}; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
        ${isSelected ? `
          <!-- Animated Halo Radar Pulse -->
          <div style="position: absolute; width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${config.primary}; background: ${config.primary}22; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -12px; pointer-events: none;"></div>
        ` : ''}

        <div style="width: 36px; height: 36px; background: ${config.gradient}; border: ${selectBorder}; border-radius: 12px; display: flex; align-items: center; justify-content: center; ${extraShadow} color: #FFFFFF; position: relative; z-index: 2;">
          ${iconSvg}

          ${coLocatedCount && coLocatedCount > 1 ? `
            <div style="position: absolute; top: -6px; right: -6px; background: #0F172A; color: #FFFFFF; border: 1.5px solid #FFFFFF; border-radius: 9999px; font-size: 10px; font-weight: 800; min-width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; padding: 0 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 10; line-height: 1;">+${coLocatedCount}</div>
          ` : ''}
        </div>
        <!-- Pointer beak triangle pointing directly to coordinate -->
        <div style="width: 8px; height: 8px; background: ${config.primary}; transform: rotate(45deg); margin-top: -4px; z-index: 1; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);"></div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
  });
}
