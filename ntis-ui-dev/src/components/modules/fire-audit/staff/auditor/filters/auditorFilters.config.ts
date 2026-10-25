/**
 * Filter configurations and preset options
 * Path: src/components/modules/fire-audit/staff/auditor/filters/auditorFilters.config.ts
 */

import {
  FileText,
  Building2,
  GitFork,
  Map,
  MapPin,
  Calendar as CalendarIcon,
  ShieldAlert,
} from "lucide-react";
import type { FilterFieldConfig, FilterOption } from "@/types/fire-audit/auditor.types";
import type { AuditorFilterLookupData } from "@/types/fire-audit/catalog.types";

/**
 * Single source of truth for date filter options.
 * Includes today, thisWeek, last7, last30, thisMonth presets.
 */
export function getDateFilterOptions(
  tFields: (key: string) => string
): FilterOption[] {
  return [
    { label: tFields("anyDate"), value: "" },
    { label: tFields("dateToday"), value: "today" },
    { label: tFields("dateThisWeek"), value: "thisWeek" },
    { label: tFields("dateLast7"), value: "last7" },
    { label: tFields("dateLast30"), value: "last30" },
    { label: tFields("dateThisMonth"), value: "thisMonth" },
  ];
}

/**
 * Re-export of getDateFilterOptions to prevent option duplication.
 */
export function getDateQuickPresets(
  tFields: (key: string) => string
): FilterOption[] {
  return getDateFilterOptions(tFields);
}

/**
 * Formats sector label dynamically from data using the sectorLabel translation template.
 */
export function formatSectorLabel(
  sectorValue: string,
  tFields: (key: string, values?: Record<string, string | number>) => string
): string {
  const num = sectorValue.replace(/\D+/g, "");
  if (num) {
    try {
      return tFields("sectorLabel", { number: num });
    } catch {
      return `Sector ${num}`;
    }
  }
  return sectorValue;
}

/**
 * Formats ward label dynamically from data using the wardLabel translation template.
 */
export function formatWardLabel(
  wardValue: string,
  tFields: (key: string, values?: Record<string, string | number>) => string
): string {
  const num = wardValue.replace(/\D+/g, "");
  if (num) {
    try {
      return tFields("wardLabel", { number: num });
    } catch {
      return `Ward ${num}`;
    }
  }
  return wardValue;
}

// Default jurisdiction seeds when backend lookup is pending or offline
const DEFAULT_NODE_SEEDS = [
  { code: "PAN", name: "Panvel" }, { code: "NPAN", name: "New Panvel" },
  { code: "KAL", name: "Kalamboli" }, { code: "KHA", name: "Kharghar" },
  { code: "TAL", name: "Taloja" }, { code: "KAM", name: "Kamothe" },
];

const DEFAULT_SECTOR_SEEDS = ["Sector 4", "Sector 8", "Sector 12", "Sector 15", "Sector 20", "Sector 45"];
const DEFAULT_WARD_SEEDS = ["Ward 01", "Ward 02", "Ward 03", "Ward 04", "Ward 05", "Ward 06"];

// NBC seed data occupancies matching 03_seed_data.sql
const DEFAULT_OCCUPANCY_NAMES = [
  "Business", "Institutional", "Mercantile", "Assembly", "Residential",
  "Educational", "Industrial", "Storage", "Hazardous",
] as const;

export function getFilterConfigs(
  tFields: (key: string, values?: Record<string, string | number>) => string,
  lookups?: AuditorFilterLookupData
): FilterFieldConfig[] {
  // 1. Application Types (Dynamic or standard statutory types)
  const appTypeOptions: FilterOption[] = [
    { label: tFields("allTypes"), value: "" },
    ...(lookups?.applicationTypes && lookups.applicationTypes.length > 0
      ? lookups.applicationTypes.map((item) => ({
          label: item.name,
          value: item.code || item.name,
        }))
      : [
          { label: tFields("newFsc"), value: "New FSC" },
          { label: tFields("newAudit"), value: "New Audit" },
          { label: tFields("renewal"), value: "Renewal" },
          { label: tFields("renewalAudit"), value: "Renewal Audit" },
          { label: tFields("periodicAudit"), value: "Periodic Audit" },
        ]),
  ];

  // 2. Building / Occupancy Types matching seed data
  const rawOccupancies =
    lookups?.occupancies && lookups.occupancies.length > 0
      ? lookups.occupancies.map((o) => o.name || o.code)
      : DEFAULT_OCCUPANCY_NAMES;

  const buildingTypeOptions: FilterOption[] = [
    { label: tFields("allOccupancy"), value: "" },
    ...rawOccupancies.map((name) => {
      const lowerKey = name.toLowerCase();
      let label = name;
      try {
        const translated = tFields(lowerKey);
        if (
          translated &&
          translated !== lowerKey &&
          !translated.startsWith("fireAudit.")
        ) {
          label = translated;
        }
      } catch {
        // keep name
      }
      return { label, value: name };
    }),
  ];


  // 3. Nodes from lookup data or defaults
  const nodes =
    lookups?.nodes && lookups.nodes.length > 0
      ? lookups.nodes
      : DEFAULT_NODE_SEEDS;

  const nodeOptions: FilterOption[] = [
    { label: tFields("allNodes"), value: "" },
    ...nodes.map((n) => ({
      label: n.name,
      value: n.name,
    })),
  ];

  // 4. Sectors dynamically formatted
  const sectors =
    lookups?.sectors && lookups.sectors.length > 0
      ? lookups.sectors
      : DEFAULT_SECTOR_SEEDS;

  const sectorOptions: FilterOption[] = [
    { label: tFields("allSectors"), value: "" },
    ...sectors.map((s) => ({
      label: formatSectorLabel(s, tFields),
      value: s,
    })),
  ];

  // 5. Wards dynamically formatted
  const wards =
    lookups?.wards && lookups.wards.length > 0
      ? lookups.wards
      : DEFAULT_WARD_SEEDS;

  const wardOptions: FilterOption[] = [
    { label: tFields("allWards"), value: "" },
    ...wards.map((w) => ({
      label: formatWardLabel(w, tFields),
      value: w,
    })),
  ];

  return [
    {
      key: "appType",
      label: tFields("appType"),
      icon: FileText,
      iconColor: "text-blue-500",
      iconBg: "bg-sky-50",
      options: appTypeOptions,
    },
    {
      key: "buildingType",
      label: tFields("occupancyType"),
      icon: Building2,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-50",
      options: buildingTypeOptions,
    },
    {
      key: "node",
      label: tFields("node"),
      icon: GitFork,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      options: nodeOptions,
    },
    {
      key: "sector",
      label: tFields("sector"),
      icon: Map,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
      options: sectorOptions,
    },
    {
      key: "wardNo",
      label: tFields("ward"),
      icon: MapPin,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      options: wardOptions,
    },
    {
      key: "dateFilter",
      label: tFields("appDate"),
      icon: CalendarIcon,
      iconColor: "text-sky-500",
      iconBg: "bg-sky-50",
      options: getDateFilterOptions(tFields),
    },
    {
      key: "riskCategory",
      label: tFields("riskCategory"),
      icon: ShieldAlert,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      options: [
        { label: tFields("allRisk"), value: "" },
        { label: tFields("riskHigh"), value: "High" },
        { label: tFields("riskMedium"), value: "Medium" },
        { label: tFields("riskLow"), value: "Low" },
      ],
    },
  ];
}


export const calendarClassNames = {
  root: "w-full select-none",
  months: "relative w-full",
  month: "w-full space-y-2",
  month_caption: "flex items-center justify-center h-8 relative w-full",
  caption_label: "text-xs font-bold text-slate-800",
  nav: "flex items-center justify-between absolute top-0 inset-x-0 h-8 z-10 pointer-events-none",
  button_previous:
    "pointer-events-auto h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer",
  button_next:
    "pointer-events-auto h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer",
  month_grid: "w-full border-collapse table-fixed",
  weekdays: "w-full",
  weekday: "text-slate-400 font-semibold text-[11px] text-center h-6 w-8 pb-1 select-none",
  weeks: "w-full",
  week: "w-full",
  day: "p-0.5 text-center h-8 w-8 relative text-xs",
  day_button:
    "h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-[#1A86E8] transition-colors cursor-pointer",
  selected: "!bg-[#1A86E8] !text-white font-bold rounded-xl shadow-xs hover:!bg-[#1570c0]",
  today: "font-bold text-[#1A86E8] bg-sky-50 border border-sky-200 rounded-xl",
  outside: "text-slate-300 opacity-40",
  disabled: "text-slate-300 opacity-30 cursor-not-allowed",
  hidden: "invisible",
};
