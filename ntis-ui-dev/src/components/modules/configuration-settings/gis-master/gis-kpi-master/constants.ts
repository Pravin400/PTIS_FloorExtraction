import React from "react";
import * as LucideIcons from "lucide-react";
import {
  Building,
  Landmark,
  Route,
  Building2,
  Warehouse,
  Home,
  Boxes,
  PieChart,
  Layers,
  Trees,
  Droplets,
  Flame,
  Truck,
  Coins,
  MapPin,
  ShieldCheck,
  Activity,
  FileText,
  BookOpen,
  User,
  Users,
  Store,
  GraduationCap,
  Briefcase,
  Wrench,
  Lightbulb,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

export const KPI_CODE_MAX = 50;
export const TITLE_MAX = 100;
export const ICON_MAX = 50;
export const COLOR_MAX = 20;

export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const PRESET_COLORS = [
  "#2563EB", // Blue
  "#059669", // Emerald
  "#0F766E", // Teal
  "#D97706", // Amber
  "#DC2626", // Red
  "#7C3AED", // Purple
  "#0891B2", // Cyan
  "#4F46E5", // Indigo
  "#475569", // Slate
];

export interface KpiIconDefinition {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const LUCIDE_KPI_ICONS: KpiIconDefinition[] = [
  { value: "building", label: "Building (Commercial / Properties)", icon: Building },
  { value: "building-2", label: "Building 2 (Commercial / High-Rise)", icon: Building2 },
  { value: "landmark", label: "Landmark (Municipal / Heritage)", icon: Landmark },
  { value: "book-open", label: "Book Open (Education / Registers)", icon: BookOpen },
  { value: "user", label: "User (Citizen / Taxpayer)", icon: User },
  { value: "users", label: "Users (Public / Community)", icon: Users },
  { value: "home", label: "Home (Residential / Housing)", icon: Home },
  { value: "warehouse", label: "Warehouse (Storage / Industrial)", icon: Warehouse },
  { value: "road", label: "Road (Infrastructure / Transport)", icon: Route },
  { value: "boxes", label: "Boxes (Assets / Inventory)", icon: Boxes },
  { value: "pie-chart", label: "Pie Chart (Analytics / Revenue)", icon: PieChart },
  { value: "layers", label: "Layers (GIS Map Layers)", icon: Layers },
  { value: "trees", label: "Trees (Parks / Environment)", icon: Trees },
  { value: "water", label: "Water (Water Supply / Drainage)", icon: Droplets },
  { value: "fire", label: "Fire (Emergency / Safety)", icon: Flame },
  { value: "truck", label: "Truck (Fleet / Sanitation)", icon: Truck },
  { value: "coins", label: "Coins (Property Tax / Finance)", icon: Coins },
  { value: "indian-rupee", label: "Indian Rupee (Revenue / Taxes)", icon: IndianRupee },
  { value: "map-pin", label: "Map Pin (Geocoded Locations)", icon: MapPin },
  { value: "shield-check", label: "Shield (Encroachment / Verified)", icon: ShieldCheck },
  { value: "activity", label: "Activity (Performance Metrics)", icon: Activity },
  { value: "file-text", label: "Document (Permits / Records)", icon: FileText },
  { value: "store", label: "Store (Trade License / Commercial)", icon: Store },
  { value: "graduation-cap", label: "Graduation Cap (Schools / Education)", icon: GraduationCap },
  { value: "briefcase", label: "Briefcase (Offices / Administration)", icon: Briefcase },
  { value: "wrench", label: "Wrench (Engineering / Works)", icon: Wrench },
  { value: "lightbulb", label: "Lightbulb (Street Lights / Electrical)", icon: Lightbulb },
];

/**
 * Common semantic aliases mapping FontAwesome / domain terms to Lucide icon names.
 */
const SEMANTIC_ALIASES: Record<string, string> = {
  road: "Route",
  route: "Route",
  city: "Building2",
  cubes: "Boxes",
  water: "Droplets",
  droplets: "Droplets",
  droplet: "Droplets",
  tree: "Trees",
  trees: "Trees",
  fire: "Flame",
  flame: "Flame",
  money: "Coins",
  coins: "Coins",
  document: "FileText",
  "file-text": "FileText",
  "chart-pie": "PieChart",
  "pie-chart": "PieChart",
  "layer-group": "Layers",
  layers: "Layers",
  "location-dot": "MapPin",
  "map-pin": "MapPin",
  "indian-rupee-sign": "IndianRupee",
  "indian-rupee": "IndianRupee",
  rupee: "IndianRupee",
  "building-columns": "Landmark",
  "shield-halved": "ShieldCheck",
  "shield-check": "ShieldCheck",
  shield: "ShieldCheck",
  "file-invoice": "FileText",
  heartbeat: "Activity",
  pulse: "Activity",
  house: "Home",
  home: "Home",
  user: "User",
  "book-open": "BookOpen",
};

/**
 * Pre-indexed lowercase map of all Lucide icons for instant O(1) fallback resolution.
 */
const NORMALIZED_LUCIDE_MAP = new Map<string, LucideIcon>();
for (const [key, comp] of Object.entries(LucideIcons)) {
  if (comp && (typeof comp === "object" || typeof comp === "function")) {
    const stripped = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    NORMALIZED_LUCIDE_MAP.set(stripped, comp as unknown as LucideIcon);
  }
}

/**
 * Resolves an icon name string to an actual LucideIcon component.
 * Supports:
 * - Kebab-case ("book-open" -> BookOpen, "building-2" -> Building2, "user" -> User)
 * - PascalCase ("BookOpen", "Building2", "User")
 * - FontAwesome legacy prefixes ("fa-building" -> Building, "fa-landmark" -> Landmark)
 * - Semantic domain aliases ("road" -> Route, "city" -> Building2, "water" -> Droplets)
 */
export function resolveLucideIcon(iconName?: string | null): LucideIcon {
  if (!iconName || typeof iconName !== "string") return Activity;
  const raw = iconName.trim();
  if (!raw) return Activity;

  // 1. Strip legacy prefix: fa-, fas-, far-, fab-, lucide-
  const withoutPrefix = raw.replace(/^(fa[srb]?|lucide)[-_ ]/i, "").trim();

  // 2. Check semantic aliases
  const aliasTarget =
    SEMANTIC_ALIASES[withoutPrefix.toLowerCase()] ||
    SEMANTIC_ALIASES[raw.toLowerCase()];
  if (aliasTarget) {
    const aliasComp = (LucideIcons as Record<string, unknown>)[aliasTarget];
    if (aliasComp) return aliasComp as unknown as LucideIcon;
  }

  // 3. Convert to PascalCase: "book-open" -> "BookOpen", "building-2" -> "Building2", "user" -> "User"
  const pascalName = withoutPrefix
    .replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/Icon$/i, "");

  const direct = (LucideIcons as Record<string, unknown>)[pascalName];
  if (direct && (typeof direct === "object" || typeof direct === "function")) {
    return direct as unknown as LucideIcon;
  }

  // 4. Case/separator-insensitive index (e.g. "bookopen", "building2", "user")
  const normalizedKey = withoutPrefix.toLowerCase().replace(/[^a-z0-9]/g, "");
  const indexed = NORMALIZED_LUCIDE_MAP.get(normalizedKey);
  if (indexed) {
    return indexed;
  }

  return Activity;
}

export interface DynamicLucideIconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  name?: string | null;
  className?: string;
  size?: number | string;
}

export function DynamicLucideIcon({ name, ...props }: DynamicLucideIconProps): React.ReactElement {
  const IconComponent = resolveLucideIcon(name);
  return React.createElement(IconComponent, props);
}


