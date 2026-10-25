"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { BuildingDetailPaneProps } from "./detail-pane/building-detail-pane.types";
import { mapTypeNameToKey } from "@/lib/utils/building-helpers";
import { useBuildingDetailPaneState } from "./detail-pane/useBuildingDetailPaneState";
import { BuildingDetailPaneScopeBanner } from "./detail-pane/BuildingDetailPaneScopeBanner";
import { BuildingDetailPaneFloorsTable } from "./detail-pane/BuildingDetailPaneFloorsTable";
import { BuildingDetailPaneInputs } from "./detail-pane/BuildingDetailPaneInputs";
import { BuildingDetailPaneFooter } from "./detail-pane/BuildingDetailPaneFooter";

export const BuildingDetailPane: React.FC<BuildingDetailPaneProps> = ({
    data,
    propertyWideCert,
    onInputChange,
    onFileUpload,
    onFileDelete,
    onToggleEnabled: _onToggleEnabled,
    onCopyFromProperty: _onCopyFromProperty,
    validationError,
    fieldErrors,
    t,
    floorData = [],
    constructionTypeData = [],
    useData = [],
    subFloorData = [],
    subTypeData = [],
    initialFloors = [],
    floors = [],
    activeScope = "Property",
    activeFloorId = null,
    onScopeChange,
    isFloorLoading = false,
    onDeleteCertificate,
    isSaving = false,
    isDeletingCertificate = false,
    hasChanges = false,
    saveError,
    deleteError,
    onSave,
}) => {
    const key = mapTypeNameToKey(data?.certificateTypeName || "");
    const displayName =
        key && t(`building.${key}`) && t(`building.${key}`) !== `building.${key}`
            ? t(`building.${key}`)
            : data?.certificateTypeName || "";
    const isDisabled = !data?.enabled;

    const {
        displayData,
        selectedFloorName,
        maxDate,
        minDate,
        isUpdateCase,
        isCertificateFilled,
        isDeleting,
        actionError,
        setActionError,
        handleFileUploadWithConfirm,
        handleFileDeleteWithConfirm,
        handleDeleteCertificateWithConfirm,
        handleSaveClick,
    } = useBuildingDetailPaneState({
        data,
        propertyWideCert,
        activeScope,
        activeFloorId,
        initialFloors,
        floors,
        displayName,
        onFileUpload,
        onFileDelete,
        onDeleteCertificate,
        onSave,
        isSaving,
        isDeletingCertificate,
        isDisabled,
        hasChanges,
        t,
    });

    if (!data || !displayData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] lg:h-[calc(100vh-220px)] bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <AlertCircle size={36} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-500">
                    {t("building.selectCertificatePrompt") || "Select a certificate from the sidebar to edit details"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-auto min-h-full border rounded-xl shadow-sm pt-3 px-4 pb-4 justify-between bg-white border-blue-100">
            <div>
                <BuildingDetailPaneScopeBanner
                    displayName={displayName}
                    activeScope={activeScope}
                    selectedFloorName={selectedFloorName}
                    isSaving={isSaving}
                    onScopeChange={onScopeChange}
                    t={t}
                />

                <BuildingDetailPaneFloorsTable
                    initialFloors={initialFloors}
                    floors={floors}
                    activeFloorId={activeFloorId}
                    activeScope={activeScope}
                    isSaving={isSaving}
                    onScopeChange={onScopeChange}
                    floorData={floorData}
                    subFloorData={subFloorData}
                    constructionTypeData={constructionTypeData}
                    useData={useData}
                    subTypeData={subTypeData}
                    t={t}
                />

                {isFloorLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                        <p className="text-xs font-semibold text-slate-500">
                            {t("building.loadingFloorDetails") || "Loading floor details..."}
                        </p>
                    </div>
                ) : (
                    <BuildingDetailPaneInputs
                        data={data}
                        displayData={displayData}
                        activeScope={activeScope}
                        selectedFloorName={selectedFloorName}
                        displayName={displayName}
                        fieldErrors={fieldErrors}
                        validationError={validationError}
                        minDate={minDate}
                        maxDate={maxDate}
                        onInputChange={onInputChange}
                        onFileDelete={onFileDelete}
                        handleFileUploadWithConfirm={handleFileUploadWithConfirm}
                        handleFileDeleteWithConfirm={handleFileDeleteWithConfirm}
                        setActionError={setActionError}
                        t={t}
                    />
                )}
            </div>

            <BuildingDetailPaneFooter
                actionError={actionError}
                saveError={saveError}
                deleteError={deleteError}
                hasValidationError={Boolean(validationError || (fieldErrors && Object.keys(fieldErrors).length > 0))}
                setActionError={setActionError}
                onDeleteCertificate={onDeleteCertificate}
                isCertificateFilled={isCertificateFilled}
                isUpdateCase={isUpdateCase}
                isDisabled={isDisabled}
                isSaving={isSaving}
                isDeleting={isDeleting}
                hasChanges={hasChanges}
                handleDeleteCertificateWithConfirm={handleDeleteCertificateWithConfirm}
                onSave={onSave}
                handleSaveClick={handleSaveClick}
                t={t}
            />
        </div>
    );
};