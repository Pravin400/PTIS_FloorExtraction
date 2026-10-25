import { unstable_noStore as noStore } from "next/cache";
import ZoneMaster from "@/components/modules/property-tax/zone-master/ZoneMaster";
import { fetchZonesPagedAction, fetchWardsPagedAction, getZoneByIdAction, getAllWardsForLinkAction, getAllZonesForLinkAction, getWardByIdAction, getWardsPagedWithSearchAction, getAllPropertiesForWardAction, getAllActiveWingsAction, fetchAllFloorsAction, getAllWardsForZoneAction, fetchSocietyDetailsByPropertyAction, getNextPartitionNumberAction } from "./actions";
import { fetchPropertiesPagedAction, fetchPropertyCategoriesAction, fetchPropertyTypesAction, fetchPropertyCategoryListAction, fetchTaxZonesAction, getNextPropertyNumberAction } from "./property.actions";
import { ZoneItem, RightPanelTab } from "@/types/zoneMaster.types";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { PropertyType } from "@/types/property-type.types";
import { PropertyCategory } from "@/types/property-category.types";
import { TaxZone } from "@/types/taxzoning.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

export const dynamic = "force-dynamic"; 

interface PageProps {
  searchParams: Promise<{
    zonePage?: string;
    zonePageSize?: string;
    q?: string;
    wardPage?: string;
    wardPageSize?: string;
    wardQ?: string;
    zoneId?: string;
    addZone?: string;
    editZone?: string;
    editWard?: string;
    linkWard?: string;
    availablewardq?: string;
    viewwardq?: string;
    viewwardpage?: string;
    viewwardpagesize?: string;
    // Property tab params
    rightTab?: string;
    propWardId?: string;
    propPage?: string;
    propPageSize?: string;
    propQ?: string;
    // Create Property drawer
    createProperty?: string;
    // Create Partition drawer
    createPartition?: string;
    partitionPropertyId?: string;
    partitionPropertyNo?: string;
    // Delete Property drawer
    deleteProperty?: string;
  }>;
}

/** Pagination constraints */
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps pagination parameters.
 * Prevents malformed values from crashing the page.
 */
function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const clampPage = (value: string | undefined): number => {
    const parsed = parseInt(value ?? "", 10);
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, MIN_PAGE), MAX_PAGE)
      : MIN_PAGE;
  };

  const clampPageSize = (value: string | undefined): number => {
    const parsed = parseInt(value ?? "", 10);
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  };

  // Validate right tab
  const rightTab = raw.rightTab?.trim();
  const activeRightTab: RightPanelTab = (rightTab === "wards" || rightTab === "properties") ? rightTab : "wards";

  return {
    zonePageNumber: clampPage(raw.zonePage),
    zonePageSize: clampPageSize(raw.zonePageSize),
    zoneSearchTerm: raw.q?.trim() || undefined,
    wardPageNumber: clampPage(raw.wardPage),
    wardPageSize: clampPageSize(raw.wardPageSize),
    wardSearchTerm: raw.wardQ?.trim() || undefined,
    zoneId: raw.zoneId?.trim(),
    editZone: raw.editZone?.trim(),
    editWard: raw.editWard?.trim(),
    linkWard: raw.linkWard?.trim(),
    availableWardSearchTerm: raw.availablewardq?.trim() || undefined,
    viewWardSearchTerm: raw.viewwardq?.trim() || undefined,
    viewWardPage: clampPage(raw.viewwardpage),
    viewWardPageSize: clampPageSize(raw.viewwardpagesize),
    // Property tab params
    activeRightTab,
    propWardId: raw.propWardId?.trim(),
    propPageNumber: clampPage(raw.propPage),
    propPageSize: clampPageSize(raw.propPageSize),
    propSearchTerm: raw.propQ?.trim() || undefined,
    // Create Property drawer
    createProperty: raw.createProperty !== undefined,
    // Create Partition drawer
    createPartition: raw.createPartition !== undefined,
    // Delete Property drawer
    deleteProperty: raw.deleteProperty !== undefined,
    // Add Zone drawer
    addZone: raw.addZone !== undefined,
  };
}

export default async function ZoneMasterPage(props: PageProps) {
  noStore();

  const params = await props.searchParams;
  const sanitized = sanitizeParams(params);
  
  const zonePageNumber = sanitized.zonePageNumber;
  const zonePageSize = sanitized.zonePageSize;
  const zoneSearchTerm = sanitized.zoneSearchTerm;

  const wardPageNumber = sanitized.wardPageNumber;
  // const wardPageSize = sanitized.wardPageSize;
  // const wardSearchTerm = sanitized.wardSearchTerm;

  // Property tab params
  const activeRightTab = sanitized.activeRightTab;
  const propPageNumber = sanitized.propPageNumber;
  const propPageSize = sanitized.propPageSize;
  const propSearchTerm = sanitized.propSearchTerm;
  const wardPageSize = sanitized.wardPageSize;
  const wardSearchTerm = sanitized.wardSearchTerm;

const parsedZoneId = sanitized.zoneId ? Number(sanitized.zoneId) : NaN;
	let selectedZoneId: number | null =
		Number.isFinite(parsedZoneId) && parsedZoneId > 0 ? parsedZoneId : null;

  // Drawer detection
  const isAddZoneOpen = sanitized.addZone;
  const isLinkWardOpen = sanitized.linkWard !== undefined;
  const editZoneId = sanitized.editZone ? Number(sanitized.editZone) : null;
  const isEditZoneOpen = editZoneId !== null && editZoneId > 0;
  const editWardId = sanitized.editWard ? Number(sanitized.editWard) : null;
  const isEditWardOpen = editWardId !== null && editWardId > 0;
  const isCreatePropertyOpen = sanitized.createProperty;
  const isCreatePartitionOpen = sanitized.createPartition;
  const isDeletePropertyOpen = sanitized.deleteProperty;

  // Link Ward Search & Pagination params
  const availableWardSearchTerm = sanitized.availableWardSearchTerm;
  const viewWardSearchTerm = sanitized.viewWardSearchTerm;
  const viewWardPage = sanitized.viewWardPage;
  const viewWardPageSize = sanitized.viewWardPageSize;

  // Fetch zones
  const zonesResult = await fetchZonesPagedAction(
    zonePageNumber,
    zonePageSize,
    zoneSearchTerm
  );

  const zones: ZoneItem[] = zonesResult.items || [];
  const zoneTotalCount = zonesResult.totalCount || 0;
  const zoneTotalPages =
    zonesResult.totalPages || 
    Math.ceil(zoneTotalCount / zonePageSize);

// Fetch all zones for LinkWard drawer (reuse in SSR prefetch)
	let allZones: ZoneItem[] = zones;

  // Default selected zone to first zone if none selected
  if (selectedZoneId === null && zones.length > 0) {
    selectedZoneId = zones[0].id ?? null;
  }

  // Fetch selected zone if not in current page
  let selectedZone: ZoneItem | null = null;
  if (selectedZoneId !== null) {
    selectedZone = zones.find(z => z.id === selectedZoneId) || null;
    
    if (!selectedZone) {
      const zoneResult = await getZoneByIdAction(selectedZoneId);
      if (zoneResult.success && zoneResult.data) {
        selectedZone = zoneResult.data as ZoneItem;
      }
    }
  }

  // Fetch wards for selected zone
  let wards: WardItem[] = [];
  let wardTotalCount = 0;
  let wardTotalPages = 0;

  if (selectedZoneId !== null) {
    const wardsResult = await fetchWardsPagedAction(
      wardPageNumber,
      wardPageSize,
      wardSearchTerm,
      selectedZoneId
    );

    wards = wardsResult.items || [];
    wardTotalCount = wardsResult.totalCount || 0;
    wardTotalPages =
      wardsResult.totalPages ||
      Math.ceil(wardTotalCount / wardPageSize);
  }

  // Dashboard totals
  const [zoneStats, wardStats] = await Promise.all([
    fetchZonesPagedAction(1, 1),
    fetchWardsPagedAction(1, 1, undefined, undefined),
  ]);

  const dashboardTotalZones = zoneStats.totalCount || 0;
  const dashboardTotalWards = wardStats.totalCount || 0;

  // === PROPERTY TAB DATA ===
  // Parse selected property ward ID
  const parsedPropWardId = sanitized.propWardId ? Number(sanitized.propWardId) : NaN;
  let selectedPropWardId: number | null =
    Number.isFinite(parsedPropWardId) && parsedPropWardId > 0 ? parsedPropWardId : null;

  // Fetch ALL wards for selected zone (for property tab dropdown) - no pagination
  // This ensures the dropdown shows all wards, not just the paginated ones from Wards tab
  let allWardsForPropertyDropdown: WardItem[] = [];
  if (activeRightTab === "properties" && selectedZoneId !== null) {
    try {
      const allWardsResult = await getAllWardsForZoneAction(selectedZoneId);
      if (allWardsResult.success && allWardsResult.data) {
        allWardsForPropertyDropdown = allWardsResult.data;
      }
    } catch (_error) {
    }
  }

  // Validate that selectedPropWardId belongs to current zone's wards
  // If not (e.g., zone changed), reset to null so we can auto-select first ward
  if (selectedPropWardId !== null && allWardsForPropertyDropdown.length > 0) {
    const wardExistsInZone = allWardsForPropertyDropdown.some(w => w.id === selectedPropWardId);
    if (!wardExistsInZone) {
      selectedPropWardId = null;
    }
  }

  // If no ward selected for properties (or invalid), default to first ward in the zone
  if (selectedPropWardId === null && allWardsForPropertyDropdown.length > 0) {
    selectedPropWardId = allWardsForPropertyDropdown[0].id ?? null;
  }

  // Find selected ward for property tab
  let selectedPropWard: WardItem | null = null;
  if (selectedPropWardId !== null) {
    selectedPropWard = allWardsForPropertyDropdown.find(w => w.id === selectedPropWardId) || null;
  }

  // Fetch properties for selected ward (only when on properties tab)
  let properties: ZonePropertyItem[] = [];
  let propertyTotalCount = 0;
  let propertyTotalPages = 0;

  if (activeRightTab === "properties" && selectedPropWardId !== null) {
    try {
      const propertiesResult = await fetchPropertiesPagedAction(
        propPageNumber,
        propPageSize,
        selectedPropWardId,
        propSearchTerm
      );

      properties = propertiesResult.items || [];
      propertyTotalCount = propertiesResult.totalCount || 0;
      propertyTotalPages =
        propertiesResult.totalPages ||
        Math.ceil(propertyTotalCount / propPageSize);
    } catch (_error) {
      // Log error but don't fail the page
    }
  }

  // Fetch category map for property display (only when on properties tab)
  // Uses PropertyCategory (not PropertyTypeCategory)
  let categoryMap: Record<number, string> = {};
  let propertyTypeMap: Record<number, string> = {};

  if (activeRightTab === "properties") {
    try {
      const categoriesResult = await fetchPropertyCategoriesAction();
      if (categoriesResult.success && categoriesResult.data) {
        categoryMap = categoriesResult.data.reduce((acc, cat) => {
          acc[cat.id] = cat.propertyCategoryName;
          return acc;
        }, {} as Record<number, string>);
      }
    } catch (_error) {
    }

    // Fetch property types for BuildingPreviewModal dropdown
    try {
      const propertyTypesResult = await fetchPropertyTypesAction();
      if (propertyTypesResult.success && propertyTypesResult.data) {
        propertyTypeMap = propertyTypesResult.data.reduce((acc, pt) => {
          acc[pt.id] = pt.propertyDescription;
          return acc;
        }, {} as Record<number, string>);
      }
    } catch (_error) {
    }
  }

  // SSR data for Edit Zone drawer
  let initialEditZoneData: ZoneItem | null = null;

  if (isEditZoneOpen && editZoneId) {
    const zoneInCurrentPage = zones.find(z => z.id === editZoneId);
    if (zoneInCurrentPage) {
      initialEditZoneData = zoneInCurrentPage;
    } else {
      const zoneResult = await getZoneByIdAction(editZoneId);
      if (zoneResult.success && zoneResult.data) {
        initialEditZoneData = zoneResult.data as ZoneItem;
      }
    }
  }

  // SSR data for Edit Ward drawer
  let initialEditWardData: WardItem | null = null;

  if (isEditWardOpen && editWardId) {
    const wardInCurrentPage = wards.find(w => w.id === editWardId);
    if (wardInCurrentPage) {
      initialEditWardData = wardInCurrentPage;
    } else {
      const wardResult = await getWardByIdAction(editWardId);
      if (wardResult.success && wardResult.data) {
        initialEditWardData = wardResult.data as WardItem;
      }
    }
  }

  // SSR data for LinkWard drawer
  let ssrAllWards: WardItem[] = [];
  let ssrAllZones: ZoneItem[] = [];
  let ssrSelectedWards: WardItem[] = [];
  let ssrViewAllWards: WardItem[] = [];
  let ssrViewAllWardsTotalCount = 0;
  let ssrViewAllWardsTotalPages = 0;

  if (isLinkWardOpen) {
    const [allWardsResult, allZonesResult, viewAllWardsResult] = await Promise.all([
      getAllWardsForLinkAction(availableWardSearchTerm),
      getAllZonesForLinkAction(),
      getWardsPagedWithSearchAction(viewWardPage, viewWardPageSize, viewWardSearchTerm),
    ]);

    if (allWardsResult.success && allWardsResult.data) {
      ssrAllWards = allWardsResult.data;
    }

    if (allZonesResult.success && allZonesResult.data) {
      ssrAllZones = allZonesResult.data;
      allZones = allZonesResult.data;
    }

    if (viewAllWardsResult.success && viewAllWardsResult.data) {
      ssrViewAllWards = viewAllWardsResult.data;
      ssrViewAllWardsTotalCount = viewAllWardsResult.totalCount || viewAllWardsResult.data.length;
      ssrViewAllWardsTotalPages = viewAllWardsResult.totalPages || 0;
    }

    if (selectedZoneId !== null) {
      ssrSelectedWards = ssrAllWards.filter(w => w.zoneId === selectedZoneId);
    }
  } else if (isAddZoneOpen || isEditZoneOpen) {
    const allZonesResult = await getAllZonesForLinkAction();
    if (allZonesResult.success && allZonesResult.data) {
      ssrAllZones = allZonesResult.data;
      allZones = allZonesResult.data;
    }
  }

  // SSR data for Create Property drawer
  let ssrPropertyTypes: PropertyType[] = [];
  let ssrPropertyCategories: PropertyCategory[] = [];
  let ssrTaxZones: TaxZone[] = [];
  let ssrNextPropertyNumber: string = "1";

  if (isCreatePropertyOpen) {
    // Build array of promises to fetch in parallel
    const fetchPromises: Promise<unknown>[] = [
      fetchPropertyTypesAction(),
      fetchPropertyCategoryListAction(),
      fetchTaxZonesAction(),
    ];

    // Only fetch next property number if we have a selected ward
    if (selectedPropWardId !== null) {
      fetchPromises.push(getNextPropertyNumberAction(selectedPropWardId));
    }

    const results = await Promise.all(fetchPromises);

    const propertyTypesResult = results[0] as { success: boolean; data?: PropertyType[] };
    const propertyCategoriesResult = results[1] as { success: boolean; data?: PropertyCategory[] };
    const taxZonesResult = results[2] as { success: boolean; data?: TaxZone[] };
    const nextPropertyNumberResult = results[3] as { success: boolean; data?: string } | undefined;

    if (propertyTypesResult.success && propertyTypesResult.data) {
      ssrPropertyTypes = propertyTypesResult.data;
    }

    if (propertyCategoriesResult.success && propertyCategoriesResult.data) {
      ssrPropertyCategories = propertyCategoriesResult.data;
    }

    if (taxZonesResult.success && taxZonesResult.data) {
      ssrTaxZones = taxZonesResult.data;
    }

    if (nextPropertyNumberResult?.success && nextPropertyNumberResult.data !== undefined) {
      ssrNextPropertyNumber = nextPropertyNumberResult.data;
    }
  }

  // SSR data for Create Partition drawer
  let ssrPartitionProperties: ZonePropertyItem[] = [];
  let ssrPartitionWings: WingItem[] = [];
  let ssrPartitionFloors: Floor[] = [];
  let ssrPartitionSocietyDetails: SocietyDetailItem[] = [];
  let ssrNextPartitionNumber: number | null = null;

  if (isCreatePartitionOpen && selectedPropWardId !== null) {
    const [partitionPropertiesResult, partitionWingsResult, partitionFloorsResult] = await Promise.all([
      getAllPropertiesForWardAction(selectedPropWardId),
      getAllActiveWingsAction(),
      fetchAllFloorsAction(),
    ]);

    if (partitionPropertiesResult.success && partitionPropertiesResult.data) {
      ssrPartitionProperties = partitionPropertiesResult.data;
    }

    if (partitionWingsResult.success && partitionWingsResult.data) {
      ssrPartitionWings = partitionWingsResult.data;
    }

    if (partitionFloorsResult.success && partitionFloorsResult.data) {
      ssrPartitionFloors = partitionFloorsResult.data;
    }

    // Fetch society details and next partition number if a property is selected
    const partitionPropertyId = params.partitionPropertyId;
    const partitionPropertyNo = params.partitionPropertyNo;
    if (partitionPropertyId) {
      const propertyId = parseInt(String(partitionPropertyId), 10);
      if (!isNaN(propertyId) && propertyId > 0) {
        // Fetch society details
        const societyDetailsResult = await fetchSocietyDetailsByPropertyAction(propertyId);
        if (societyDetailsResult.success && societyDetailsResult.data) {
          ssrPartitionSocietyDetails = societyDetailsResult.data.items || [];
        }

        // Fetch next partition number using the propertyNo carried directly in the URL,
        // so this doesn't depend on ssrPartitionProperties having resolved first.
        if (partitionPropertyNo && selectedPropWardId) {
          const nextPartitionResult = await getNextPartitionNumberAction(
            selectedPropWardId,
            partitionPropertyNo
          );
          if (nextPartitionResult.success && nextPartitionResult.data !== undefined) {
            ssrNextPartitionNumber = nextPartitionResult.data;
          }
        }
      }
    }
  }

  // SSR data for Delete Property drawer
  let ssrDeleteProperties: ZonePropertyItem[] = [];

  if (isDeletePropertyOpen && selectedPropWardId !== null) {
    const deletePropertiesResult = await getAllPropertiesForWardAction(selectedPropWardId);

    if (deletePropertiesResult.success && deletePropertiesResult.data) {
      ssrDeleteProperties = deletePropertiesResult.data;
    }
  }

  return (
      <ZoneMaster
        zonePagination={{
          zones: isLinkWardOpen ? allZones : zones,
          pageNumber: zonePageNumber,
          pageSize: zonePageSize,
          totalCount: zoneTotalCount,
          totalPages: zoneTotalPages,
          searchTerm: zoneSearchTerm,
        }}
        wardPagination={{
          wards,
          pageNumber: wardPageNumber,
          pageSize: wardPageSize,
          totalCount: wardTotalCount,
          totalPages: wardTotalPages,
          searchTerm: wardSearchTerm,
        }}
        dashboardStats={{
          totalZones: dashboardTotalZones,
          totalWards: dashboardTotalWards,
        }}
        selection={{
          selectedZoneId,
          selectedZone,
        }}
        editData={{
          initialEditZoneData,
          initialEditWardData,
        }}
        ssrData={{
          allWards: ssrAllWards,
          allZones: ssrAllZones,
          selectedWards: ssrSelectedWards,
          viewAllWards: ssrViewAllWards,
          viewAllWardsTotalCount: ssrViewAllWardsTotalCount,
          viewAllWardsTotalPages: ssrViewAllWardsTotalPages,
        }}
        propertyPagination={{
          properties,
          pageNumber: propPageNumber,
          pageSize: propPageSize,
          totalCount: propertyTotalCount,
          totalPages: propertyTotalPages,
          searchTerm: propSearchTerm,
          selectedWardId: selectedPropWardId,
          selectedWard: selectedPropWard,
          allWardsForDropdown: allWardsForPropertyDropdown,
        }}
        propertyLookups={{
          categoryMap,
          propertyTypeMap,
        }}
        activeRightTab={activeRightTab}
        createPropertyData={{
          isOpen: isCreatePropertyOpen,
          propertyTypes: ssrPropertyTypes,
          propertyCategories: ssrPropertyCategories,
          taxZones: ssrTaxZones,
          nextPropertyNumber: ssrNextPropertyNumber,
        }}
        createPartitionData={{
          isOpen: isCreatePartitionOpen,
          properties: ssrPartitionProperties,
          wings: ssrPartitionWings,
          floors: ssrPartitionFloors,
          societyDetails: ssrPartitionSocietyDetails,
          nextPartitionNumber: ssrNextPartitionNumber,
        }}
        deletePropertyData={{
          isOpen: isDeletePropertyOpen,
          properties: ssrDeleteProperties,
        }}
      />
  );
}