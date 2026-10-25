import React from "react";
import { ToggleSwitch, Label, Tooltip } from "@/components/common";
import { CertificateData } from "@/types/building-permission.types";
import { BuildingSidebarBadge } from "./BuildingSidebarBadge";
import { isCertificateApplied } from "./sidebar.helpers";

interface BuildingSidebarItemProps {
    cert: CertificateData;
    isSelected: boolean;
    validationErrors?: Record<number, string>;
    onSelect: (typeId: number) => void;
    onToggleEnabled: (typeId: number, checked: boolean) => void;
    t: (key: string) => string;
}

export const BuildingSidebarItem: React.FC<BuildingSidebarItemProps> = ({
    cert,
    isSelected,
    validationErrors,
    onSelect,
    onToggleEnabled,
    t,
}) => {
    const hasError = cert.enabled && !!validationErrors?.[cert.certificateTypeId];
    const displayName = cert.certificateTypeName;
    const isApplied = isCertificateApplied(cert);

    const cardClass = isSelected
        ? hasError
            ? "bg-red-50/60 border-red-600 shadow-sm ring-1 ring-red-600/30"
            : "bg-blue-50/60 border-blue-600 shadow-sm ring-1 ring-blue-600/30"
        : hasError
            ? "bg-red-50/10 border-red-200 hover:border-red-300"
            : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/10";

    return (
        <div
            data-certificate-id={cert.certificateTypeId}
            onClick={() => onSelect(cert.certificateTypeId)}
            className={`group p-3 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-2 relative ${cardClass}`}
        >
            {isSelected && (
                <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                        hasError ? "bg-red-600" : "bg-blue-600"
                    }`}
                />
            )}

            <div className="flex justify-between items-start gap-2 pl-1.5">
                <Label
                    className={`text-sm font-bold transition-colors line-clamp-2 flex-1 cursor-pointer select-none ${
                        isSelected
                            ? hasError
                                ? "text-red-900"
                                : "text-blue-900"
                            : hasError
                                ? "text-red-800 hover:text-red-900"
                                : "text-gray-700 group-hover:text-blue-800"
                    }`}
                >
                    {displayName}
                </Label>
                <div onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                    {isApplied ? (
                        <Tooltip
                            placement="left"
                            className="text-left max-w-[240px]"
                            content={
                                <div className="text-left space-y-1">
                                    <p className="font-semibold text-white">
                                        {t("building.appliedCertToggleTooltipTitle") || "Certificate already applied"}
                                    </p>
                                    <p className="text-[11px] text-blue-50 leading-snug">
                                        {t("building.appliedCertToggleTooltipDesc") ||
                                            "To delete this certificate, please use the 'Delete Certificate & Data' button at the bottom."}
                                    </p>
                                </div>
                            }
                        >
                            <div
                                onClick={() => onSelect(cert.certificateTypeId)}
                                className="cursor-not-allowed inline-flex items-center"
                            >
                                <div className="pointer-events-none">
                                    <ToggleSwitch
                                        checked={true}
                                        disabled={true}
                                        onChange={() => {}}
                                        showPopup={false}
                                    />
                                </div>
                            </div>
                        </Tooltip>
                    ) : (
                        <ToggleSwitch
                            checked={cert.enabled}
                            onChange={(checked) => {
                                onSelect(cert.certificateTypeId);
                                onToggleEnabled(cert.certificateTypeId, checked);
                            }}
                            showPopup={false}
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center pl-1.5">
                <BuildingSidebarBadge cert={cert} validationErrors={validationErrors} t={t} />
            </div>
        </div>
    );
};
