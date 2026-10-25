import { LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MENU_ICON_MAP, NAME_TO_ICON_MAP } from '@/config/icon-mapping.config';

/** Helper to get icon from screen/module name */
export function getIconFromName(name: string): string {
  const lowerName = name.toLowerCase().trim();
  
  // Exact match first
  if (NAME_TO_ICON_MAP[lowerName]) {
    return NAME_TO_ICON_MAP[lowerName];
  }
  
  // Partial match - check if name contains any key
  for (const [key, icon] of Object.entries(NAME_TO_ICON_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  return 'LayoutGrid';
}

/** Helper to resolve icon by name, supporting case-insensitivity and name-based fallback */
export function resolveIcon(iconName?: string, menuName?: string): LucideIcon {
  // Try explicit icon name first
  if (iconName) {
    // Direct match
    if (MENU_ICON_MAP[iconName]) return MENU_ICON_MAP[iconName];
    
    // Case-insensitive match
    const lowerName = iconName.toLowerCase();
    const found = Object.keys(MENU_ICON_MAP).find(k => k.toLowerCase() === lowerName);
    if (found) return MENU_ICON_MAP[found];
  }
  
  // Fallback: derive icon from menu name
  if (menuName) {
    const derivedIconName = getIconFromName(menuName);
    if (MENU_ICON_MAP[derivedIconName]) {
      return MENU_ICON_MAP[derivedIconName];
    }
  }
  
  return LayoutGrid;
}
