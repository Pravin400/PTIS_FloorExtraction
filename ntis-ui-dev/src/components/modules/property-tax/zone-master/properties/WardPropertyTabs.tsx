"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabItem } from "@/components/common";
import { Map, Building2 } from "lucide-react";
import WardList from "../wards/WardList";
import PropertyList from "./PropertyList";
import { ZoneItem } from "@/types/zoneMaster.types";
import { WardItem } from "@/types/wardMaster.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";

interface PropertyCategoryMap {
  [key: number]: string;
}

interface PropertyTypeMap {
  [key: number]: string;
}

interface WardPropertyTabsProps {
  // Ward props
  wards: WardItem[];
  wardPageNumber: number;
  wardPageSize: number;
  wardTotalCount: number;
  wardTotalPages: number;
  wardSearchTerm?: string;
  selectedZoneId: number | null;
  zones: ZoneItem[];
  currentZone?: ZoneItem;

  // Property props
  properties: ZonePropertyItem[];
  propertyPageNumber: number;
  propertyPageSize: number;
  propertyTotalCount: number;
  propertyTotalPages: number;
  propertySearchTerm?: string;
  selectedPropertyWardId: number | null;
  allWardsForDropdown?: WardItem[]; // All wards in zone for dropdown (no pagination)
  categoryMap?: PropertyCategoryMap;
  propertyTypeMap?: PropertyTypeMap;

  // Active tab
  activeTab?: "wards" | "properties";

}

export default function WardPropertyTabs({
  // Ward props
  wards,
  wardPageNumber,
  wardPageSize,
  wardTotalCount,
  wardTotalPages,
  wardSearchTerm = "",
  selectedZoneId,
  zones,
  currentZone,

  // Property props
  properties,
  propertyPageNumber,
  propertyPageSize,
  propertyTotalCount,
  propertyTotalPages,
  propertySearchTerm = "",
  selectedPropertyWardId,
  allWardsForDropdown = [],
  categoryMap = {},
  propertyTypeMap = {},

  // Active tab
  activeTab = "wards",

}: WardPropertyTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("zoneMaster");
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  const handleTabChange = (value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("rightTab", String(value));

    // Reset property-specific params when switching to wards
    if (value === "wards") {
      params.delete("propWardId");
      params.delete("propPage");
      params.delete("propPageSize");
      params.delete("propQ");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const tabItems: TabItem[] = [
    {
      value: "wards",
      label: t("tabs.wards", { wards: wardsAlias }),
      icon: Map,
      content: (
        <WardList
          wards={wards}
          pageNumber={wardPageNumber}
          pageSize={wardPageSize}
          totalCount={wardTotalCount}
          totalPages={wardTotalPages}
          searchTerm={wardSearchTerm}
          selectedZoneId={selectedZoneId}
          zones={zones}
          currentZone={currentZone}
        />
      ),
    },
    {
      value: "properties",
      label: t("tabs.properties"),
      icon: Building2,
      content: (
        <PropertyList
          properties={properties}
          pageNumber={propertyPageNumber}
          pageSize={propertyPageSize}
          totalCount={propertyTotalCount}
          totalPages={propertyTotalPages}
          searchTerm={propertySearchTerm}
          selectedWardId={selectedPropertyWardId}
          wards={allWardsForDropdown}
          selectedZoneId={selectedZoneId}
          categoryMap={categoryMap}
          propertyTypeMap={propertyTypeMap}
        />
      ),
    },
  ];

  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      items={tabItems}
      variant="line"
      size="md"
      className="h-full flex flex-col"
      tabListClassName="px-4 pt-3 pb-2 border-b border-gray-100"
      tabPanelClassName="flex-1 overflow-hidden"
    />
  );
}
