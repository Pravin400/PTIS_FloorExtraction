"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input, ToggleSwitch } from "@/components/common";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";
import { getMinMaxValues } from "@/lib/validations/social-details.validation";
import { SocialAttributeHierarchyDto } from "@/types/property-social-details.types";

import { getFieldGuideline } from "@/lib/utils/social-guidelines";

interface AttributeControlProps {
    attr: SocialAttributeHierarchyDto;
    state: FlatSocialAttributeState;
    isEnabled: boolean;
    hasError: boolean;
    handleValueChange: (
        attributeId: number,
        field: keyof FlatSocialAttributeState,
        value: string | number | boolean | null
    ) => void;
}

export const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
};

export const AttributeControl: React.FC<AttributeControlProps> = ({
    attr,
    state,
    isEnabled,
    hasError,
    handleValueChange
}) => {
    const t = useTranslations("quickDataEntry");
    const disabled = !isEnabled;
    const guideline = getFieldGuideline(attr.socialAttributeCode, attr.dataType, t);

    switch (attr.dataType.toUpperCase()) {
        case "BIT":
            return (
                <div className="cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_span]:cursor-pointer flex items-center">
                    <ToggleSwitch
                        checked={!!state.bitValue}
                        onChange={(checked) => handleValueChange(attr.id, "bitValue", checked)}
                        disabled={disabled}
                        showPopup={false}
                    />
                </div>
            );
        case "INT": {
            const code = attr.socialAttributeCode.toUpperCase();
            const isYear = code === "WATER_CONN_YEAR";
            const isTree = code.includes("TREE");
            const isSolar = code.includes("SOLAR");
            const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;

            const { min, max } = getMinMaxValues(attr.socialAttributeCode);
            return (
                <div className="flex flex-col gap-1 w-full">
                    <Input
                        type="number"
                        step="1"
                        min={min || 1}
                        max={max}
                        maxLength={digitsLimit}
                        onKeyDown={preventNegativeInput}
                        placeholder={t("discount.socialPlaceholders.enterValue") || "Enter value"}
                        value={state.intValue ?? ""}
                        disabled={disabled}
                        error={hasError ? " " : undefined}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw.replace(/\D/g, "").length <= digitsLimit) {
                                handleValueChange(attr.id, "intValue", raw === "" ? null : raw);
                            }
                        }}
                        className="h-8 w-full font-semibold"
                    />
                    {guideline && isEnabled && (
                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                            {guideline}
                        </span>
                    )}
                </div>
            );
        }
        case "DECIMAL": {
            const { min, max } = getMinMaxValues(attr.socialAttributeCode);
            return (
                <div className="flex flex-col gap-1 w-full">
                    <Input
                        type="number"
                        step="any"
                        min={min || 0.01}
                        max={max}
                        onKeyDown={preventNegativeInput}
                        placeholder={t("discount.socialPlaceholders.enterDecimal") || "Enter decimal"}
                        value={state.decimalValue ?? ""}
                        disabled={disabled}
                        error={hasError ? " " : undefined}
                        onChange={(e) => {
                            const raw = e.target.value;
                            handleValueChange(
                                attr.id,
                                "decimalValue",
                                raw === "" ? null : raw
                            );
                        }}
                        className="h-8 w-full font-semibold"
                    />
                    {guideline && isEnabled && (
                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                            {guideline}
                        </span>
                    )}
                </div>
            );
        }
        case "DATE":
            return (
                <div className="flex flex-col gap-1 w-full">
                    <Input
                        type="date"
                        value={state.dateValue ? state.dateValue.split("T")[0] : ""}
                        disabled={disabled}
                        error={hasError ? " " : undefined}
                        onChange={(e) => handleValueChange(attr.id, "dateValue", e.target.value || null)}
                        className="h-8 w-full font-semibold"
                    />
                    {guideline && isEnabled && (
                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                            {guideline}
                        </span>
                    )}
                </div>
            );
        default: {
            const code = attr.socialAttributeCode.toUpperCase();
            const isStatus = code.includes("WATER_CONN") || code.includes("STATUS");
            return (
                <div className="flex flex-col gap-1 w-full">
                    <Input
                        type="text"
                        placeholder={t("discount.socialPlaceholders.enterText") || "Enter text"}
                        value={state.textValue ?? ""}
                        disabled={disabled}
                        error={hasError ? " " : undefined}
                        onChange={(e) => handleValueChange(attr.id, "textValue", e.target.value || null)}
                        className="h-8 w-full font-semibold"
                        minLength={isStatus ? 3 : 2}
                        maxLength={isStatus ? 30 : 100}
                    />
                    {guideline && isEnabled && (
                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                            {guideline}
                        </span>
                    )}
                </div>
            );
        }
    }
};
