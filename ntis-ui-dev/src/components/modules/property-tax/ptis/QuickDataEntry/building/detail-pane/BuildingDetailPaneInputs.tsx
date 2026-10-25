import React, { useMemo } from "react";
import { Building2, Layers } from "lucide-react";
import { Input, ValidationMessage, Label } from "@/components/common";
import { CertificateData } from "@/types/building-permission.types";
import { DocumentAttachment } from "../DocumentAttachment";
import { mapTypeNameToKey } from "@/lib/utils/building-helpers";
import { getCertificateLengthRule, sanitizeCertificateNumber } from "@/lib/validation/building/validation-rules";

interface BuildingDetailPaneInputsProps {
    data: CertificateData;
    displayData: CertificateData;
    activeScope?: string;
    selectedFloorName: string;
    displayName: string;
    fieldErrors?: { number?: string; date?: string; document?: string };
    validationError?: string;
    minDate?: string;
    maxDate: string;
    onInputChange: (field: "number" | "date", value: string) => void;
    onFileDelete?: (certificateTypeId: number) => void;
    handleFileUploadWithConfirm: (file: File) => void;
    handleFileDeleteWithConfirm: () => void;
    setActionError: (err: string | null) => void;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const BuildingDetailPaneInputs: React.FC<BuildingDetailPaneInputsProps> = ({
    data,
    displayData,
    activeScope = "Property",
    selectedFloorName,
    displayName,
    fieldErrors,
    validationError,
    minDate,
    maxDate,
    onInputChange,
    onFileDelete,
    handleFileUploadWithConfirm,
    handleFileDeleteWithConfirm,
    setActionError,
    t,
}) => {
    const activeTypeKey = useMemo(() => {
        return mapTypeNameToKey(data.certificateTypeName || "", data.certificateTypeCode || undefined);
    }, [data.certificateTypeName, data.certificateTypeCode]);

    const isNumericOnly = activeTypeKey === "aadharCard" || activeTypeKey === "electricBill";

    const lengthRule = useMemo(() => {
        return getCertificateLengthRule(data.certificateTypeName || undefined, data.certificateTypeCode || undefined);
    }, [data.certificateTypeName, data.certificateTypeCode]);

    const isNumberInvalid = Boolean(fieldErrors?.number);
    const isDateInvalid = Boolean(fieldErrors?.date);
    const isDocumentInvalid = Boolean(fieldErrors?.document);

    return (
        <>
            {/* Certificate Form Context Header */}
            <div className="pt-1 pb-2 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
                <div>
                    <h5 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                        {activeScope === "Floor" ? (
                            <>
                                <Layers className="w-4 h-4 text-amber-600" />
                                <span>
                                    {t("building.floorCertificateDetailsTitle")}:{" "}
                                    <span className="text-amber-700">{selectedFloorName}</span>
                                </span>
                            </>
                        ) : (
                            <>
                                <Building2 className="w-4 h-4 text-blue-700" />
                                <span>{t("building.propertyCertificateDetailsTitle")}</span>
                            </>
                        )}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {activeScope === "Floor"
                            ? t("building.floorDetailsDesc", { floorName: selectedFloorName })
                            : t("building.propertyDetailsDesc")}
                    </p>
                </div>
            </div>

            {/* Document Attachment Section */}
            <div className="mt-1 space-y-1.5 mb-3">
                <Label required className="text-sm font-bold text-blue-800">
                    {t("building.documentAttachment", { name: displayName })}
                </Label>
                <DocumentAttachment
                    documentGuid={displayData.documentGuid}
                    fileName={displayData.fileName}
                    isUploading={displayData.isUploading}
                    isDeleting={displayData.isDeleting}
                    isDisabled={false}
                    isDocumentInvalid={isDocumentInvalid}
                    documentError={fieldErrors?.document || validationError}
                    onFileUpload={handleFileUploadWithConfirm}
                    onFileDelete={onFileDelete ? handleFileDeleteWithConfirm : undefined}
                    t={t}
                    label={displayName}
                    pendingFile={displayData.pendingFile}
                />
            </div>

            {/* Certificate Number & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label required className="text-sm font-bold text-blue-800">
                        {t("building.certificateNumber", { name: displayName })}
                    </Label>
                    <Input
                        value={displayData.number}
                        onChange={(e) => {
                            const val = sanitizeCertificateNumber(e.target.value, isNumericOnly);
                            onInputChange("number", val);
                            setActionError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === " ") e.preventDefault();
                        }}
                        placeholder={t("building.certificateNumberPlaceholder", { name: displayName })}
                        maxLength={lengthRule.max}
                        className={`h-10 text-sm placeholder:text-gray-400 focus:ring-1 shadow-sm transition-colors font-semibold ${
                            isNumberInvalid
                                ? "bg-white text-gray-800 border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "bg-white text-gray-800 border-blue-200 focus:border-blue-600 focus:ring-blue-600 hover:border-blue-300"
                        }`}
                    />
                    {isNumberInvalid && <ValidationMessage message={fieldErrors?.number} />}
                </div>

                <div className="space-y-1.5">
                    <Label required className="text-sm font-bold text-blue-800">
                        {t("building.certificateDate", { name: displayName })}
                    </Label>
                    <Input
                        type="date"
                        min={minDate}
                        max={maxDate}
                        value={displayData.date}
                        onChange={(e) => {
                            onInputChange("date", e.target.value);
                            setActionError(null);
                        }}
                        placeholder={t("building.certificateDatePlaceholder", { name: displayName })}
                        className={`h-10 text-sm placeholder:text-gray-400 [&::-webkit-datetime-edit]:text-gray-800 focus:ring-1 shadow-sm transition-colors font-semibold ${
                            isDateInvalid
                                ? "bg-white text-gray-800 border-red-500 focus:border-red-500 focus:ring-red-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                : "bg-white text-gray-800 border-blue-200 focus:border-blue-600 focus:ring-blue-600 hover:border-blue-300 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        }`}
                    />
                    {isDateInvalid && <ValidationMessage message={fieldErrors?.date} />}
                </div>
            </div>
        </>
    );
};
