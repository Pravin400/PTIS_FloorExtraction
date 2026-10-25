  "use client";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useBuildingList } from "@/hooks/zoneMaster/useBuildingList";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton } from "@/components/common";
import { useTranslations } from "next-intl";
import { PropertyInfoSection, PropertySelectionSection } from "./components";
import { PropertyAmenitySection } from "./components/PropertyAmenitySection";
import { DirectPropertyDeleteSection } from "./components/DirectPropertyDeleteSection";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

import { SelectedPropertyHeaderInfo } from "./components/PropertySelectionSection";
import { BuildingListItem } from "@/types/zone-master/properties/building-list.types";
import { DirectPropertyDeleteRow } from "@/types/zoneMaster.types";

const isNonZeroPartition = (p: string | null | undefined) =>
  !!p && p !== "" && p !== "0";

interface DeletePropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wardId?: number | null;
  selectedWard?: WardItem | null;
  ssrProperties?: ZonePropertyItem[];
  categoryMap?: Record<number, string>;
}

export default function DeletePropertyDrawer({
  isOpen,
  onClose,
  wardId = null,
  selectedWard = null,
  ssrProperties = [],
  categoryMap = {},
}: DeletePropertyDrawerProps) {
  const t = useTranslations("zoneMaster.deleteProperty");
  const tZone = useTranslations("zoneMaster");
  const wardAlias = useAliasLabel("Ward", tZone("defaults.ward"));
  const partitionAlias = useAliasLabel("Partition", tZone("defaults.partition"));
  const propertyNoAlias = useAliasLabel(
    "Property_No",
    useAliasLabel("Property No.", useAliasLabel("Property No", tZone("defaults.propertyNo")))
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [prevWardId, setPrevWardId] = useState<number | null>(null);

  const effectiveWardId = wardId ?? selectedWard?.id ?? null;

  // Reset on ward change
  if (effectiveWardId !== prevWardId) {
    setPrevWardId(effectiveWardId);
    setSelectedPropertyId("");
  }

  const ward = selectedWard ?? null;

  const { buildingList, loadingBuildingList, refetchBuildingList } = useBuildingList({
    wardId: effectiveWardId,
  });

  const selectedProperty = useMemo<
    | (BuildingListItem & { id?: number })
    | (ZonePropertyItem & { propertyId?: number; catPropertyCategoryName?: string })
    | null
  >(
    () =>
      buildingList.find((b) => String(b.propertyId) === selectedPropertyId) ??
      ssrProperties.find((b) => String(b.id) === selectedPropertyId) ??
      null,
    [buildingList, ssrProperties, selectedPropertyId]
  );

  const categoryName = useMemo(() => {
    if (!selectedProperty) return null;
    if ("catPropertyCategoryName" in selectedProperty) {
      return selectedProperty.catPropertyCategoryName ?? null;
    }
    if ("categoryId" in selectedProperty && selectedProperty.categoryId) {
      return categoryMap[selectedProperty.categoryId] ?? null;
    }
    return null;
  }, [selectedProperty, categoryMap]);

  // Dropdown: only show main properties (partitionNo null / "" / "0")
  const propertyOptions = useMemo(() => {
    if (buildingList.length > 0) {
      return buildingList
        .filter((item) => !item.partitionNo || item.partitionNo === "" || item.partitionNo === "0")
        .map((item) => ({
          value: String(item.propertyId),
          label: item.catPropertyCategoryName
            ? `${item.propertyNo} - ${item.catPropertyCategoryName}`
            : item.propertyNo,
        }));
    }
    return ssrProperties
      .filter((item) => !item.partitionNo || item.partitionNo === "0")
      .map((item) => {
        const catName = item.categoryId ? categoryMap[item.categoryId] : null;
        return {
          value: String(item.id),
          label: catName ? `${item.propertyNo} - ${catName}` : item.propertyNo,
        };
      });
  }, [buildingList, ssrProperties, categoryMap]);

  // Sub-properties: same propertyNo as the selected main, with a non-zero partitionNo.
  // Checks buildingList first; falls back to ssrProperties (which includes all ward properties).
  const subPropertyRows = useMemo<DirectPropertyDeleteRow[]>(() => {
    if (!selectedProperty) return [];
    const matchingPropertyNo = selectedProperty.propertyNo;

    const fromBuildingList = buildingList
      .filter(
        (item) =>
          item.propertyNo === matchingPropertyNo &&
          isNonZeroPartition(item.partitionNo)
      )
      .map((item) => ({
        propertyId: String(item.propertyId),
        wardNo: item.wardNo || "-",
        propertyNo: item.propertyNo || "-",
        partitionNo: item.partitionNo || "-",
        categoryName: item.catPropertyCategoryName || "-",
      }));

    if (fromBuildingList.length > 0) return fromBuildingList;

    return ssrProperties
      .filter(
        (item) =>
          item.propertyNo === matchingPropertyNo &&
          isNonZeroPartition(item.partitionNo)
      )
      .map((item) => {
        const catName = item.categoryId ? categoryMap[item.categoryId] : null;
        return {
          propertyId: String(item.id),
          wardNo: ward?.wardNo || "-",
          propertyNo: item.propertyNo || "-",
          partitionNo: item.partitionNo || "-",
          categoryName: catName || "-",
        };
      });
  }, [buildingList, ssrProperties, selectedProperty, categoryMap, ward]);

  const handleClose = () => {
    setSelectedPropertyId("");
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      width="md"
      title={
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-md text-white shrink-0">
            <Trash2 size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-red-900">{t("pageTitle")}</h1>
            <p className="text-xs text-slate-500">{t("pageSubtitle", { ward: wardAlias })}</p>
          </div>
        </div>
      }
      footer={<CancelButton onClick={handleClose} />}
    >
      <div className="p-5 space-y-5">
        {/* Property info */}
        <PropertyInfoSection
          selectedWard={ward}
          selectedProperty={selectedProperty as unknown as ZonePropertyItem}
          isApartmentCategory={false}
          categoryName={categoryName}
          t={tZone}
        />

        {/* Main Property No dropdown */}
        <PropertySelectionSection
          selectedProperty={selectedProperty as unknown as SelectedPropertyHeaderInfo}
          propertyOptions={propertyOptions}
          onPropertyChange={(_e, value) => setSelectedPropertyId(value)}
          t={tZone}
          isApartmentCategory={false}
          label={tZone("partitionForm.mainPropertyNo", { propertyNo: propertyNoAlias })}
          placeholder={
            loadingBuildingList && propertyOptions.length === 0
              ? tZone("propertyList.loading")
              : propertyOptions.length === 0 && ward?.id
              ? tZone("partitionForm.helpText.noMainPropertiesFound", { partitions: partitionAlias })
              : tZone("partitionForm.placeholders.selectMainProperty")
          }
          disabled={loadingBuildingList && propertyOptions.length === 0}
          value={selectedPropertyId}
          hidePropertyInfo
        />

        {/* Wing selection → toggle → table → delete */}
        {selectedPropertyId && selectedProperty && (
          <PropertyAmenitySection
            propertyId={selectedPropertyId}
            directDeleteFallback={
              <DirectPropertyDeleteSection
                propertyId={selectedPropertyId}
                wardNo={
                  "wardNo" in selectedProperty
                    ? selectedProperty.wardNo
                    : ward?.wardNo
                }
                propertyNo={selectedProperty.propertyNo}
                partitionNo={selectedProperty.partitionNo}
                categoryName={categoryName}
                subRows={subPropertyRows}
                onSubRowDeleted={refetchBuildingList}
                onDeleted={() => setSelectedPropertyId("")}
                t={tZone}
              />
            }
          />
        )}
      </div>
    </Drawer>
  );
}
