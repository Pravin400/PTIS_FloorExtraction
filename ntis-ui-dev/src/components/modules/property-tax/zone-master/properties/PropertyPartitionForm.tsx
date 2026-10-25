"use client";

import { useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Grid3x3, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, SearchSelect, Tabs, ValidationMessage } from "@/components/common";
import { Column } from "@/components/common/MasterTable";
import { PropertyPartitionFormProps } from "@/types/zone-master/properties/partition-form.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { BuildingPreviewModal } from "./BuildingPreviewModal";
import { getWingColumns, WingSummary } from "./wingColumns";
import {
  PropertyInfoSection,
  NonApartmentPartitionSection,
  AmenitySelection,
  WingSummaryTable,
  AddWingForm,
  WingDetailConfigSection,
} from "./components";
import {
  usePartitionFormState,
  usePartitionFormOptions,
  usePartitionFormHandlers,
  usePartitionFormValidation,
  useWingManagement,
  useBuildingPreview,
  usePartitionSubmit,
  useBuildingList,
  useSocietyWingDetails,
  useWingDetailsMastList,
} from "@/hooks/zoneMaster";

export default function PropertyPartitionForm({
  open,
  onClose,
  onSuccess,
  selectedWard,
  categoryMap,
  ssrProperties = [],
  ssrWings = [],
  ssrFloors = [],
  selectedPropertyId = null,
  ssrSocietyDetails = [],
  ssrNextPartitionNumber = null,
}: PropertyPartitionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("zoneMaster");
  const tCommon = useTranslations("common");
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const partitionAlias = useAliasLabel("Partition", t("defaults.partition"));
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));
  const wingsAlias = useAliasLabel("Wings", t("defaults.wings"));
  const propertyNoAlias = useAliasLabel(
    "Property_No",
    useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo")))
  );

  // Normalize selectedWard to prevent undefined
  const ward = selectedWard ?? null;
  // Fetch building list using wardId from selectedWard
  const {
    buildingList,
    loadingBuildingList,
  } = useBuildingList({
    wardId: ward?.id,
  });

  // Use custom hooks for state management
  const {
    form,
    setForm,
    loading,
    setLoading,
    errors,
    setErrors,
    allProperties,
    setAllProperties,
    wings,
    floors,
    societyDetails,
    setSocietyDetails,
    wingDetailsMast,
    setWingDetailsMast,
    showPreview,
    setShowPreview,
    previewData,
    setPreviewData,
    loadingPreview,
    setLoadingPreview,
    selectedProperty,
    selectedWingDetailId,
    INITIAL,
  } = usePartitionFormState({
    selectedPropertyId,
    ssrNextPartitionNumber,
    ssrProperties,
    ssrWings,
    ssrFloors,
    ssrSocietyDetails,
  });

  // Fetch society wing details using main propertyId
  const {
    wingDetails,
    refetchWingDetails,
  } = useSocietyWingDetails({
    propertyId: form.mainPropertyId,
  });

  // Fetch WingDetailsMast (the actual per-wing list) for this property's
  // single SocietyDetailsMast record, if one exists.
  const { refetchWingDetailsMast } = useWingDetailsMastList({
    societyDetailsMastId: societyDetails[0]?.id,
    setWingDetailsMast,
  });

  // Use hooks for options
  const {
    propertyOptions,
    wingOptions,
    generationTypeOptions,
    fromFloorOptions,
    toFloorOptions,
  } = usePartitionFormOptions({
    allProperties,
    wingDetailsMast,
    wings,
    floors,
    form,
    categoryMap,
    buildingList,
  });

  // Use hooks for handlers
  const {
    handlePropertySelect,
    handleFromFloorChange,
    handleToFloorChange,
  } = usePartitionFormHandlers({
    form,
    setForm,
    errors,
    setErrors,
    floors,
    allProperties,
  });

  // Use hooks for validation
  const { validate, calculateMaxAmenity } = usePartitionFormValidation({
    selectedProperty,
    allProperties,
    floors,
  });

  // Use hooks for wing management
  const {
    showWingConfig,
    setShowWingConfig,
    showAddWingForm,
    setShowAddWingForm,
    newWingName,
    setNewWingName,
    addingWing,
    editingWingDetailId,
    setEditingWingDetailId,
    newWingId,
    setNewWingId,
    newWingNo,
    setNewWingNo,
    getWingNoById,
    wingSummaries,
    handleSaveWing: handleSaveWingCore,
    openAddWingForm,
  } = useWingManagement({
    societyDetails,
    setSocietyDetails,
    wings,
    wingDetailsMast,
    setWingDetailsMast,
    selectedPropertyId,
    onWingSaveSuccess: async () => {
      await Promise.all([refetchWingDetails(), refetchWingDetailsMast()]);
    },
  });

  // Enhance wing summaries with amenity counts and property counts from API.
  // wingDetails (from useSocietyWingDetails/society-wing-details API) is
  // matched here by wingNo since that API is unaffected by this migration.
  const enhancedWingSummaries = useMemo(() => {
    const realWingRows = wingSummaries.map(summary => {
      const wingDetail = wingDetails.find(detail => detail.wingNo === summary.wingNo);
      return {
        ...summary,
        aminityCount: wingDetail?.aminityCount ?? 0,
        propertyCount: wingDetail?.propertyCount,
      };
    });

    if (!selectedProperty) return realWingRows;

    // "Main Society" (property-level, no wing) row - always shown, no actions.
    const mainSocietyAmenityCount = allProperties.filter((p) => {
      return (
        p.propertyNo === selectedProperty.propertyNo &&
        p.partitionNo?.startsWith("AM") &&
        !p.partitionNo?.includes("-")
      );
    }).length;

    const mainSocietyRow: WingSummary = {
      wingName: societyDetails[0]?.societyName?.trim() || t("partitionForm.amenity.mainSociety"),
      count: 0,
      wingMasterId: -1,
      wingNo: undefined,
      wingDetailId: -1,
      propertyCount: 0,
      aminityCount: mainSocietyAmenityCount,
      isMainSociety: true,
    };

    return [mainSocietyRow, ...realWingRows];
  }, [wingSummaries, wingDetails, selectedProperty, allProperties, societyDetails, t]);

  // Use hooks for building preview
  const { handlePreviewBuilding } = useBuildingPreview({
    form,
    selectedWard: ward,
    selectedProperty,
    wings,
    floors,
    setLoadingPreview,
    setShowPreview,
    setPreviewData,
    setErrors,
    validate,
    t,
  });

  // Use hooks for submit
  const { handleSubmit: handleSubmitCore } = usePartitionSubmit({
    form,
    setForm,
    selectedWard: ward,
    selectedProperty,
    wings,
    wingDetails,
    wingDetailsMast,
    setWingDetailsMast,
    societyDetails,
    setSocietyDetails,
    selectedPropertyId,
    floors,
    validate,
    setLoading,
    onSuccess,
    onClose,
    showAddWingForm,
    newWingId,
    newWingName,
    handleSaveWing: handleSaveWingCore,
    refetchWingDetails,
    setAllProperties,
  });

  // Resolve category name: prefer buildingList (has name directly) over ssrProperties + categoryMap lookup
  const categoryName = useMemo(() => {
    if (!form.mainPropertyId) return null;
    const buildingItem = buildingList.find(b => b.propertyId === form.mainPropertyId);
    if (buildingItem?.catPropertyCategoryName) return buildingItem.catPropertyCategoryName;
    if (!selectedProperty?.categoryId || !categoryMap) return null;
    return categoryMap.get(selectedProperty.categoryId) || null;
  }, [form.mainPropertyId, buildingList, selectedProperty, categoryMap]);

  // Check if selected property category is Apartment or Multi Commercial Apartment
  const isApartmentCategory = useMemo(() => {
    return categoryName === "Apartment" || categoryName === "Multi Commercial Apartment";
  }, [categoryName]);

  // Update partitionType based on category when property is selected
  // For non-apartment properties, use "partition" type to enable correct validation
  useEffect(() => {
    if (form.mainPropertyId && categoryName !== null) {
      const expectedType = isApartmentCategory ? "wing" : "partition";
      if (form.partitionType !== expectedType && form.partitionType !== "amenity") {
        setForm(prev => ({ ...prev, partitionType: expectedType }));
      }
    }
  }, [form.mainPropertyId, categoryName, isApartmentCategory, form.partitionType, setForm]);

  // Define columns for the wing summary table
  const wingColumns = useMemo(() => getWingColumns({
    t,
    wingAlias,
    onEditWing: (row) => {
      setEditingWingDetailId(row.wingDetailId);
      setNewWingId(row.wingMasterId);
      setNewWingNo(row.wingNo || getWingNoById(row.wingMasterId));
      setNewWingName(row.wingName);
      setShowAddWingForm(true);
    },
    onUpdateStructure: (row) => {
      setForm(prev => ({
        ...prev,
        wingLetter: row.wingNo || row.wingName
      }));
      setShowWingConfig(true);
      toast.info(`Selected ${wingAlias} ${row.wingName} (${row.wingNo}) for updates`);
    }
  }), [t, wingAlias, setEditingWingDetailId, setNewWingId, setNewWingNo, getWingNoById, setNewWingName, setShowAddWingForm, setForm, setShowWingConfig]);

  // Helper to reset wing configuration fields
  const resetWingConfigFields = () => {
    setForm((prev) => ({
      ...prev,
      wingLetter: "",
      fromFloor: "",
      toFloor: "",
      noOfFlatOnOneFloor: "",
      flatStart: "",
      incrementedBy: "",
      prefix: "",
      generationType: "",
    }));
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    setForm(INITIAL);
    setErrors({});
    setSocietyDetails([]);
    setWingDetailsMast([]);
    setShowWingConfig(false);
    setShowAddWingForm(false);
    setNewWingId(null);
    setNewWingNo("");
    setNewWingName("");
    setEditingWingDetailId(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("partitionPropertyId");
    params.delete("partitionPropertyNo");
    router.push(`${pathname}?${params.toString()}`);

    onClose();
  };

  // Wrapper for submit to pass errors and setErrors
  const handleSubmit = async () => {
    await handleSubmitCore(errors, setErrors);
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      width="md"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Grid3x3 className="w-5 h-5 text-[#1A86E8]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {t("partitionForm.title", { partition: partitionAlias, wing: wingAlias })}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("partitionForm.subtitle", { partition: partitionAlias, wings: wingsAlias })}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton onClick={handleClose} disabled={loading || addingWing} />
          <SaveButton
            onClick={handleSubmit}
            isLoading={loading || addingWing}
            disabled={
              (showAddWingForm && (!newWingId || !newWingName)) ||
              // Disable when WingSummaryTable is showing (wing tab, no add form, no config)
              (isApartmentCategory && form.partitionType === "wing" && !showAddWingForm && !showWingConfig) ||
              // Disable when WingDetailConfigSection is showing
              showWingConfig
            }
            label={
              showAddWingForm
                ? (editingWingDetailId ? t("partitionForm.wing.editWing", { wing: wingAlias }) : t("partitionForm.wing.addWing", { wing: wingAlias }))
                : form.partitionType === "amenity" 
                ? t("partitionForm.amenity.createAmenity") 
                : form.partitionType === "partition"
                ? t("partitionForm.createPartition", { partition: partitionAlias })
                : undefined
            }
          />
        </>
      }
    >
      <div className="p-4 space-y-5">
        {/* Warning if no ward selected */}
        {!selectedWard?.id && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-lg">
            <div className="w-5 h-5 mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{t("partitionForm.noWardSelected", { ward: wardAlias })}</p>
              <p className="text-xs text-red-700 mt-1">{t("partitionForm.selectWardFirst", { ward: wardAlias })}</p>
            </div>
          </div>
        )}

        {/* Property Information Section */}
        <PropertyInfoSection
          selectedWard={ward}
          selectedProperty={selectedProperty}
          isApartmentCategory={isApartmentCategory}
          categoryName={categoryName}
          t={t}
        />

        {/* Main Property Selection */}
        <div>
          <SearchSelect
            label={t("partitionForm.mainPropertyNo", { propertyNo: propertyNoAlias })}
            value={form.mainPropertyId ? String(form.mainPropertyId) : ""}
            onChange={(_name, value) => {
              // Call handlePropertySelect with dummy event as first argument
              handlePropertySelect({} as React.ChangeEvent<HTMLSelectElement>, value);
            }}
            options={propertyOptions}
            placeholder={loadingBuildingList ? tCommon("actions.loading") : t("partitionForm.placeholders.selectMainProperty")}
            disabled={loading || loadingBuildingList}
            required
          />
          <ValidationMessage
            message={errors.mainPropertyId}
            visible={!!errors.mainPropertyId}
            type="error"
          />
          {/* No properties available info */}
          {!loadingBuildingList && propertyOptions.length === 0 && (
            <div className="flex items-start gap-3 p-4 mt-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{t("partitionForm.helpText.noMainPropertiesFound", { partitions: partitionAlias })}</p>
              </div>
            </div>
          )}
        </div>

        {/* Partition Type Tabs - Only show for Apartment categories */}
        {form.mainPropertyId && isApartmentCategory && (
          <Tabs
            className="items-center"
            variant="pills"
            value={form.partitionType}
            onChange={(val) => {
              setForm((prev) => ({
                ...prev,
                partitionType: val as "wing" | "partition" | "amenity",
                wingLetter: "",
                fromFloor: "",
                toFloor: "",
                noOfFlatOnOneFloor: "",
                flatStart: "",
                incrementedBy: "",
                prefix: "",
                generationType: "",
              }));
              setErrors({});
              setShowWingConfig(false);
            }}
          >
            <Tabs.TabList className="justify-center gap-4 w-max">
              <Tabs.Tab value="wing" icon={Building2}>
                {t("partitionForm.tabs.wing", { wing: wingAlias })}
              </Tabs.Tab>
              <Tabs.Tab value="amenity" icon={Building2}>
                {t("partitionForm.tabs.amenity")}
              </Tabs.Tab>
            </Tabs.TabList>
          </Tabs>
        )}

        {/* Wing Summary Table */}
        {form.mainPropertyId && isApartmentCategory && form.partitionType === "wing" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {!showAddWingForm && !showWingConfig && (
              <WingSummaryTable
                wingSummaries={enhancedWingSummaries}
                wingColumns={wingColumns as unknown as Column<WingSummary>[]}
                onAddWingClick={openAddWingForm}
                t={t}
              />
            )}

            {showAddWingForm && (
              <AddWingForm
                newWingNo={newWingNo}
                newWingName={newWingName}
                setNewWingName={setNewWingName}
                errors={errors}
                setErrors={setErrors}
                addingWing={addingWing}
                editingWingDetailId={editingWingDetailId}
                onCancel={() => {
                  setShowAddWingForm(false);
                  setEditingWingDetailId(null);
                  setNewWingId(null);
                  setNewWingNo("");
                  setNewWingName("");
                }}
                t={t}
                tCommon={tCommon}
              />
            )}
          </div>
        )}

        {/* Conditional UI based on category and partition type */}
        {form.mainPropertyId && (
          <>
            {isApartmentCategory ? (
              form.partitionType === "wing" ? (
                <>
                  {showWingConfig && (
                    <WingDetailConfigSection
                      form={form}
                      setForm={setForm}
                      errors={errors}
                      setErrors={setErrors}
                      wingOptions={wingOptions}
                      fromFloorOptions={fromFloorOptions}
                      toFloorOptions={toFloorOptions}
                      generationTypeOptions={generationTypeOptions}
                      handleFromFloorChange={handleFromFloorChange}
                      handleToFloorChange={handleToFloorChange}
                      handlePreviewBuilding={handlePreviewBuilding}
                      loading={loadingPreview}
                      onCancel={() => {
                        setShowWingConfig(false);
                        resetWingConfigFields();
                      }}
                      t={t}
                      tCommon={tCommon}
                    />
                  )}
                </>
              ) : (
                <AmenitySelection
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  setErrors={setErrors}
                  wingDetails={wingDetails}
                  societyDetails={societyDetails}
                  calculateMaxAmenity={calculateMaxAmenity}
                  t={t}
                />
              )
            ) : (
              <NonApartmentPartitionSection
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
                t={t}
              />
            )}
          </>
        )}
      </div>

      {/* Building Preview Modal */}
      <BuildingPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        buildingData={previewData}
        loading={loadingPreview}
        wingLetter={form.wingLetter}
        propertyNo={selectedProperty?.propertyNo}
        incrementedBy={form.incrementedBy}
        taxZoneId={selectedProperty?.taxZoneId}
        wardId={selectedWard?.id}
        propertyTypeId={selectedProperty?.propertyTypeId ?? undefined}
        categoryId={selectedProperty?.categoryId ?? undefined}
        wingDetailId={selectedWingDetailId}
        onGenerateSuccess={async () => {
          setShowPreview(false);
          setShowWingConfig(false);
          resetWingConfigFields();
          await Promise.all([refetchWingDetails(), refetchWingDetailsMast()]);
          onSuccess?.();
        }}
      />
    </Drawer>
  );
} 
