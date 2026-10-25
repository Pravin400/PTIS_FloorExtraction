"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/common";
import { BuildingFormProps, ApplicationLevel } from "@/types/building-permission.types";
import { useBuildingForm } from "@/hooks/useBuildingForm";
import { BuildingPermissionSection } from "./BuildingPermissionSection";
import { useLocale } from "next-intl";

import {
    buildWingOptions,
    buildUnitOptions,
    resolveEffectiveCertTypeId,
    resolveEffectiveLevel,
} from "./form/building-form-options.utils";
import { useTaxRecalculationListener } from "./form/useTaxRecalculationListener";
import { StandaloneBuildingView } from "./form/StandaloneBuildingView";
import { useBuildingFormSaveHandlers } from "./form/useBuildingFormSaveHandlers";
import { useBuildingFormFilters } from "./form/useBuildingFormFilters";

const BuildingForm: React.FC<BuildingFormProps> = ({
    initialBuildingPermission,
    initialFloorBuildingPermission,
    initialFloorCertificates,
    initialActiveScope,
    initialActiveFloorId,
    initialSelectedTypeId,
    propertyId,
    categoryId,
    categoryName,
    isSociety = true,
    societyDetailId,
    wingDetailId,
    floorData = [],
    constructionTypeData = [],
    useData = [],
    subFloorData = [],
    subTypeData = [],
    initialFloors = [],
    initialWings = [],
    initialUnits = [],
    initialCertificateTypes = [],
    initialCertificateGrid = null,
    propertyConstructionYear,
}) => {
    const locale = useLocale();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [showActiveFirst, setShowActiveFirst] = useState(false);

    useTaxRecalculationListener(societyDetailId);

    const {
        buildingPermission,
        hasChanges,
        isSaving,
        handleFileUpload,
        handleFileDelete,
        handleToggleEnabled,
        handleCopyFromPropertyCert,
        handleInputChange,
        handleDeleteCertificate,
        handleSave,
        selectedTypeId,
        setSelectedTypeId,
        activeScope,
        activeFloorId,
        selectFloorOrPropertyScope,
        floors,
        isFloorLoading,
        validationErrors,
        fieldErrors,
        propertyCertificatesState,
        t,
    } = useBuildingForm(
        initialBuildingPermission,
        initialFloorCertificates || null,
        propertyId,
        initialFloors,
        initialFloorBuildingPermission,
        initialActiveScope,
        initialActiveFloorId,
        initialSelectedTypeId
    );

    const wingOptions = useMemo(() => buildWingOptions(initialFloors), [initialFloors]);
    const unitOptions = useMemo(() => buildUnitOptions(initialFloors), [initialFloors]);

    const {
        isSectionSaving,
        handleToggleWithConfirm,
        handleDeleteRecord,
        handleSectionSave,
        handleSaveStandalone,
    } = useBuildingFormSaveHandlers({
        propertyId,
        locale,
        isSociety,
        societyDetailId,
        wingDetailId,
        initialFloors,
        initialWings,
        wingOptions,
        buildingPermission,
        handleToggleEnabled,
        handleInputChange,
        handleFileUpload,
        handleFileDelete,
        handleSave,
        searchParams,
        t,
    });

    const { activeSelectedTypeId, selectedCert, filteredCertificates, propertyWideCert } =
        useBuildingFormFilters({
            buildingPermission,
            selectedTypeId,
            showActiveFirst,
            searchTerm,
            activeScope,
            propertyCertificatesState,
        });

    const urlLevel = searchParams.get("level") as ApplicationLevel | null;
    const urlCertTypeId = searchParams.get("certificateTypeId") || searchParams.get("certTypeId");
    const urlCertTypeCode = searchParams.get("certificateTypeCode") || searchParams.get("certType");
    const hasUnitParam = Boolean(searchParams.get("partitionNo") || searchParams.get("unitNo"));

    const effectiveCertTypeId = resolveEffectiveCertTypeId(
        urlCertTypeId,
        urlCertTypeCode,
        initialCertificateTypes,
        activeSelectedTypeId
    );
    const effectiveLevel = resolveEffectiveLevel(urlLevel, hasUnitParam, activeScope);

    return (
        <Tabs
            defaultValue="building"
            className="flex-1 flex flex-col min-h-0 h-full lg:h-[calc(100vh-125px)] max-h-[calc(100vh-125px)] overflow-hidden"
        >
            <Tabs.TabPanel value="building" className="mt-0 p-0 flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                {isSociety ? (
                    <BuildingPermissionSection
                        propertyId={propertyId}
                        categoryId={categoryId}
                        categoryName={categoryName}
                        societyId={societyDetailId ?? null}
                        wingDetailId={wingDetailId ?? null}
                        wings={initialWings.length > 0 ? initialWings : wingOptions}
                        units={initialUnits.length > 0 ? initialUnits : unitOptions}
                        certificateTypes={initialCertificateTypes}
                        initialCertificateGrid={initialCertificateGrid}
                        initialLevel={effectiveLevel}
                        initialCertificateTypeId={effectiveCertTypeId}
                        initialData={isSociety ? null : selectedCert}
                        isSaving={isSaving || isSectionSaving}
                        propertyConstructionYear={propertyConstructionYear}
                        onDelete={(certTypeId) => handleDeleteCertificate(certTypeId)}
                        onDeleteRecord={handleDeleteRecord}
                        onSave={handleSectionSave}
                    />
                ) : (
                    <StandaloneBuildingView
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        showActiveFirst={showActiveFirst}
                        setShowActiveFirst={setShowActiveFirst}
                        filteredCertificates={filteredCertificates}
                        selectedTypeId={selectedTypeId}
                        setSelectedTypeId={setSelectedTypeId}
                        handleToggleWithConfirm={handleToggleWithConfirm}
                        validationErrors={validationErrors}
                        fieldErrors={fieldErrors}
                        selectedCert={selectedCert}
                        propertyWideCert={propertyWideCert}
                        activeSelectedTypeId={activeSelectedTypeId}
                        handleInputChange={handleInputChange}
                        handleFileUpload={handleFileUpload}
                        handleFileDelete={handleFileDelete}
                        handleCopyFromPropertyCert={handleCopyFromPropertyCert}
                        floorData={floorData}
                        constructionTypeData={constructionTypeData}
                        useData={useData}
                        subFloorData={subFloorData}
                        subTypeData={subTypeData}
                        initialFloors={initialFloors}
                        activeScope={activeScope}
                        activeFloorId={activeFloorId}
                        selectFloorOrPropertyScope={selectFloorOrPropertyScope}
                        floors={floors}
                        isFloorLoading={isFloorLoading}
                        isSaving={isSaving}
                        hasChanges={hasChanges}
                        handleDeleteCertificate={handleDeleteCertificate}
                        onSaveStandalone={handleSaveStandalone}
                        t={t}
                    />
                )}
            </Tabs.TabPanel>
        </Tabs>
    );
};

export default BuildingForm;