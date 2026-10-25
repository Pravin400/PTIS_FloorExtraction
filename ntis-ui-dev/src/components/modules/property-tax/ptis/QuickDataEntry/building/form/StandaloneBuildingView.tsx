import React from "react";
import { BuildingSidebar } from "../BuildingSidebar";
import { BuildingDetailPane } from "../BuildingDetailPane";
import { CertificateData, FloorCertificateDto } from "@/types/building-permission.types";
import type {
    FloorResponse,
    ConstructionTypeResponse,
    TypeOfUseApiItem,
    SubFloorResponse,
    SubTypeOfUseResponse,
} from "@/types/floor-details.types";
import type { FloorData } from "@/types/room-details.types";

interface StandaloneBuildingViewProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    showActiveFirst: boolean;
    setShowActiveFirst: (active: boolean) => void;
    filteredCertificates: CertificateData[];
    selectedTypeId: number | null;
    setSelectedTypeId: (id: number) => void;
    handleToggleWithConfirm: (typeId: number, checked: boolean) => void;
    validationErrors: Record<number, string>;
    fieldErrors: Record<number, { number?: string; date?: string; document?: string }>;
    selectedCert: CertificateData | null;
    propertyWideCert: CertificateData | null;
    activeSelectedTypeId: number | null;
    handleInputChange: (typeId: number, field: "number" | "date", value: string) => void;
    handleFileUpload: (typeId: number, file: File) => void;
    handleFileDelete: (typeId: number) => void;
    handleCopyFromPropertyCert: (typeId: number) => void;
    floorData: FloorResponse[];
    constructionTypeData: ConstructionTypeResponse[];
    useData: TypeOfUseApiItem[];
    subFloorData: SubFloorResponse[];
    subTypeData: SubTypeOfUseResponse[];
    initialFloors: FloorData[];
    activeScope: string;
    activeFloorId: string | number | null;
    selectFloorOrPropertyScope: (scope: "Property" | "Floor", floorDetailsId: number | null) => void;
    floors: FloorCertificateDto[];
    isFloorLoading: boolean;
    isSaving: boolean;
    hasChanges: boolean;
    handleDeleteCertificate: (typeId: number) => Promise<unknown>;
    onSaveStandalone: () => Promise<unknown>;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const StandaloneBuildingView: React.FC<StandaloneBuildingViewProps> = ({
    searchTerm,
    setSearchTerm,
    showActiveFirst,
    setShowActiveFirst,
    filteredCertificates,
    selectedTypeId,
    setSelectedTypeId,
    handleToggleWithConfirm,
    validationErrors,
    fieldErrors,
    selectedCert,
    propertyWideCert,
    activeSelectedTypeId,
    handleInputChange,
    handleFileUpload,
    handleFileDelete,
    handleCopyFromPropertyCert,
    floorData,
    constructionTypeData,
    useData,
    subFloorData,
    subTypeData,
    initialFloors,
    activeScope,
    activeFloorId,
    selectFloorOrPropertyScope,
    floors,
    isFloorLoading,
    isSaving,
    hasChanges,
    handleDeleteCertificate,
    onSaveStandalone,
    t,
}) => {
    return (
        <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden p-3 gap-3">
            <h2 className="text-base font-bold text-blue-900 border-b border-slate-100 pb-2">
                {t("building.title") || "Building Permissions & Documents"}
            </h2>
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
                {/* Left Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 h-full min-h-0 overflow-y-auto">
                    <BuildingSidebar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        showActiveFirst={showActiveFirst}
                        onShowActiveChange={setShowActiveFirst}
                        certificates={filteredCertificates}
                        selectedTypeId={selectedTypeId}
                        onSelect={setSelectedTypeId}
                        onToggleEnabled={handleToggleWithConfirm}
                        validationErrors={validationErrors}
                        t={t}
                    />
                </div>

                {/* Right Detail Pane */}
                <div className="lg:col-span-8 xl:col-span-9 h-full min-h-0 overflow-y-auto">
                    <BuildingDetailPane
                        data={selectedCert}
                        propertyWideCert={propertyWideCert}
                        onInputChange={(field, val) =>
                            activeSelectedTypeId !== null && handleInputChange(activeSelectedTypeId, field, val)
                        }
                        onFileUpload={(file) =>
                            activeSelectedTypeId !== null && handleFileUpload(activeSelectedTypeId, file)
                        }
                        onFileDelete={(typeId) => handleFileDelete(typeId)}
                        onToggleEnabled={(checked) =>
                            activeSelectedTypeId !== null && handleToggleWithConfirm(activeSelectedTypeId, checked)
                        }
                        onCopyFromProperty={() =>
                            activeSelectedTypeId !== null && handleCopyFromPropertyCert(activeSelectedTypeId)
                        }
                        validationError={activeSelectedTypeId !== null ? validationErrors[activeSelectedTypeId] : undefined}
                        fieldErrors={activeSelectedTypeId !== null ? fieldErrors[activeSelectedTypeId] : undefined}
                        t={t}
                        floorData={floorData}
                        constructionTypeData={constructionTypeData}
                        useData={useData}
                        subFloorData={subFloorData}
                        subTypeData={subTypeData}
                        initialFloors={initialFloors}
                        activeScope={activeScope}
                        activeFloorId={activeFloorId}
                        onScopeChange={(scope, floorId) => selectFloorOrPropertyScope(scope, floorId)}
                        floors={floors}
                        isFloorLoading={isFloorLoading}
                        isSaving={isSaving}
                        hasChanges={hasChanges}
                        onDeleteCertificate={async () => {
                            if (activeSelectedTypeId !== null) {
                                return await handleDeleteCertificate(activeSelectedTypeId);
                            }
                        }}
                        onSave={onSaveStandalone}
                    />
                </div>
            </div>
        </div>
    );
};
