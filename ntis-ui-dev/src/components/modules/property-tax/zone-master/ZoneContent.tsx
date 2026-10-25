"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Layers, Map as MapIcon } from "lucide-react";
import TableHeader from "@/components/common/TableHeader";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import ZoneList from "./zones/ZoneList";
import WardPropertyTabs from "./properties/WardPropertyTabs";
import ZoneForm from "./zones/ZoneForm";
import LinkWard from "./wards/LinkWard";
import CreateNewWard from "./wards/CreateNewWard";
import WardForm from "./wards/WardForm";
import CreatePropertyDrawer from "./properties/CreatePropertyDrawer";
import PropertyPartitionForm from "./properties/PropertyPartitionForm";
import DeletePropertyDrawer from "./properties/DeletePropertyDrawer";
import { DashboardCard } from "@/components/common/DashboardCard";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { useZoneContentState } from "@/hooks/zoneMaster/useZoneContentState";
import {
  ZonePaginationData,
  WardPaginationData,
  DashboardStats,
  SSRData,
  EditData,
  SelectionState,
  PropertyPaginationData,
  PropertyLookupMaps,
  RightPanelTab,
  CreatePropertyData,
  CreatePartitionData,
  DeletePropertyData,
} from "@/types/zoneMaster.types";

interface Props {
  zonePagination: ZonePaginationData;
  wardPagination: WardPaginationData;
  dashboardStats: DashboardStats;
  selection: SelectionState;
  editData?: EditData;
  ssrData?: SSRData;
  propertyPagination?: PropertyPaginationData;
  propertyLookups?: PropertyLookupMaps;
  activeRightTab?: RightPanelTab;
  createPropertyData?: CreatePropertyData;
  createPartitionData?: CreatePartitionData;
  deletePropertyData?: DeletePropertyData;
}

export default function ZoneContent({
  zonePagination,
  wardPagination,
  dashboardStats,
  selection,
  editData = {},
  ssrData = {},
  propertyPagination,
  propertyLookups,
  activeRightTab = "wards",
  createPropertyData,
  createPartitionData,
  deletePropertyData,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("zoneMaster");

  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const zonesAlias = useAliasLabel("Zones", t("defaults.zones"));
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  // Destructure for cleaner access
  const { zones, pageNumber: zonePageNumber, pageSize: zonePageSize, totalCount: zoneTotalCount, totalPages: zoneTotalPages, searchTerm: zoneSearchTerm } = zonePagination;
  const { wards, pageNumber: wardPageNumber, pageSize: wardPageSize, totalCount: wardTotalCount, totalPages: wardTotalPages, searchTerm: wardSearchTerm } = wardPagination;
  const { totalZones: dashboardTotalZones, totalWards: dashboardTotalWards } = dashboardStats;
  const { selectedZoneId, selectedZone } = selection;
  const { initialEditZoneData, initialEditWardData } = editData;
  const {
    allWards: ssrAllWards = [],
    allZones: ssrAllZones = [],
    selectedWards: ssrSelectedWards = [],
    viewAllWards: ssrViewAllWards = [],
    viewAllWardsTotalCount: ssrViewAllWardsTotalCount = 0,
    viewAllWardsTotalPages: ssrViewAllWardsTotalPages = 0,
  } = ssrData;

  // Property data with defaults
  const {
    properties = [],
    pageNumber: propertyPageNumber = 1,
    pageSize: propertyPageSize = 10,
    totalCount: propertyTotalCount = 0,
    totalPages: propertyTotalPages = 0,
    searchTerm: propertySearchTerm = "",
    selectedWardId: selectedPropertyWardId = null,
    allWardsForDropdown = [],
  } = propertyPagination || {};

  const { categoryMap = {}, propertyTypeMap = {} } = propertyLookups || {};

  // Extract selected property ID from URL for SSR
  const partitionPropertyId = searchParams.get("partitionPropertyId");
  const selectedPartitionPropertyId = partitionPropertyId ? parseInt(partitionPropertyId, 10) : null;

  // Use passed selectedZone, or fallback to finding in zones array
  const currentZone = selectedZone || zones.find(z => z.id === selectedZoneId);

  const {
    isDrawerClosing,
    isAddZoneOpen,
    isAddWardOpen,
    isCreateWardOpen,
    isEditWardOpen,
    isEditZoneOpen,
    editWardId,
    editZoneId,
    handleCloseDrawer,
    handleZoneSelect,
    refreshAfterUpdate,
  } = useZoneContentState();

  return (
    <>
      <div className="space-y-2 mb-0">
        <TableHeader
          title={t("title", { zone: zoneAlias })}
          subtitle={t("description", { zones: zonesAlias, ward: wardAlias })}
          icon={Layers}
          rightContent={
            <div className="flex items-center gap-3">
              <DashboardCard
                label={t("totalZones", { zones: zonesAlias })}
                value={dashboardTotalZones}
                icon={<Layers className="w-5 h-5 text-[#1A86E8]" />}
                className="min-w-[140px]"
              />
              <DashboardCard
                label={t("totalWards", { wards: wardsAlias })}
                value={dashboardTotalWards}
                icon={<MapIcon className="w-5 h-5 text-[#1A86E8]" />}
                className="min-w-[140px]"
              />
            </div>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border-2 border-[#1A86E8]/20 flex flex-col">
          <ZoneList
            zones={zones}
            pageNumber={zonePageNumber}
            pageSize={zonePageSize}
            totalCount={zoneTotalCount}
            totalPages={zoneTotalPages}
            searchTerm={zoneSearchTerm}
            selectedZoneId={selectedZoneId}
            onZoneSelect={handleZoneSelect}
          />
        </div>

        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border-2 border-[#1A86E8]/20 flex flex-col">
          <ConfirmProvider>
          <WardPropertyTabs
            // Ward props
            wards={wards}
            wardPageNumber={wardPageNumber}
            wardPageSize={wardPageSize}
            wardTotalCount={wardTotalCount}
            wardTotalPages={wardTotalPages}
            wardSearchTerm={wardSearchTerm}
            selectedZoneId={selectedZoneId}
            zones={zones}
            currentZone={currentZone}
            // Property props
            properties={properties}
            propertyPageNumber={propertyPageNumber}
            propertyPageSize={propertyPageSize}
            propertyTotalCount={propertyTotalCount}
            propertyTotalPages={propertyTotalPages}
            propertySearchTerm={propertySearchTerm}
            selectedPropertyWardId={selectedPropertyWardId}
            allWardsForDropdown={allWardsForDropdown}
            categoryMap={categoryMap}
            propertyTypeMap={propertyTypeMap}
            // Active tab
            activeTab={activeRightTab}
          />
          </ConfirmProvider>
        </div>
      </div>

      {/* =========================
          🔥 DRAWERS (PROPER CONTROL)
         ========================= */}

      <ZoneForm
        mode="add"
        open={isAddZoneOpen}
        onClose={handleCloseDrawer}
        onSuccess={refreshAfterUpdate}
        existingZones={ssrAllZones.length > 0 ? ssrAllZones : zones}
      />

      <LinkWard
        open={isAddWardOpen && !isDrawerClosing}
        onClose={handleCloseDrawer}
        onSuccess={refreshAfterUpdate}
        zones={zones}
        selectedZoneId={selectedZoneId}
        ssrAllWards={ssrAllWards}
        ssrAllZones={ssrAllZones}
        ssrSelectedWards={ssrSelectedWards}
        ssrViewAllWards={ssrViewAllWards}
        ssrViewAllWardsTotalCount={ssrViewAllWardsTotalCount}
        ssrViewAllWardsTotalPages={ssrViewAllWardsTotalPages}
      />

      <CreateNewWard
        open={isCreateWardOpen}
        onClose={handleCloseDrawer}
        onSuccess={refreshAfterUpdate}
        currentZone={currentZone}
        existingWards={wards}
      />

      {isEditWardOpen && editWardId && (
        <WardForm
          mode="edit"
          open={isEditWardOpen}
          wardId={editWardId}
          wards={wards}
          onClose={handleCloseDrawer}
          onSuccess={refreshAfterUpdate}
          initialData={initialEditWardData}
        />
      )}

      {isEditZoneOpen && editZoneId && (
        <ZoneForm
          mode="edit"
          open={isEditZoneOpen}
          zoneId={editZoneId}
          zones={zones}
          existingZones={ssrAllZones.length > 0 ? ssrAllZones : zones}
          onClose={handleCloseDrawer}
          onUpdate={refreshAfterUpdate}
          initialData={initialEditZoneData}
        />
      )}

      {/* Create Property Drawer */}
      {createPropertyData?.isOpen && (
        <CreatePropertyDrawer
          isOpen={createPropertyData.isOpen}
          selectedWard={allWardsForDropdown.find(w => w.id === selectedPropertyWardId) || null}
          propertyTypes={createPropertyData.propertyTypes}
          propertyCategories={createPropertyData.propertyCategories}
          taxZones={createPropertyData.taxZones}
          nextPropertyNumber={createPropertyData.nextPropertyNumber}
          onClose={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("createProperty");
            router.push(`${pathname}?${params.toString()}`);
          }}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Delete Property Drawer */}
      {deletePropertyData?.isOpen && (
        <DeletePropertyDrawer
          isOpen={deletePropertyData.isOpen}
          onClose={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("deleteProperty");
            router.push(`${pathname}?${params.toString()}`);
          }}
          wardId={selectedPropertyWardId}
          selectedWard={allWardsForDropdown.find(w => w.id === selectedPropertyWardId) || null}
          ssrProperties={deletePropertyData.properties}
          categoryMap={categoryMap}
        />
      )}

      {/* Create Partition Drawer */}
      {createPartitionData?.isOpen && (
        <PropertyPartitionForm
          open={createPartitionData.isOpen}
          selectedWard={allWardsForDropdown.find(w => w.id === selectedPropertyWardId) || null}
          categoryMap={new Map(Object.entries(categoryMap).map(([k, v]) => [Number(k), v]))}
          ssrProperties={createPartitionData.properties}
          ssrWings={createPartitionData.wings}
          ssrFloors={createPartitionData.floors}
          selectedPropertyId={selectedPartitionPropertyId}
          ssrSocietyDetails={createPartitionData.societyDetails}
          ssrNextPartitionNumber={createPartitionData.nextPartitionNumber}
          onClose={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("createPartition");
            params.delete("partitionPropertyId");
            params.delete("partitionPropertyNo");
            router.push(`${pathname}?${params.toString()}`);
          }}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

    </>
  );
}