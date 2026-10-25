"use client";

import React from "react";
import { Input, ValidationMessage, Label } from "@/components/common";
import { DiscountAttributeState } from "@/types/discount.types";

interface DiscountValueInputProps {
    data: DiscountAttributeState;
    isDisabled: boolean;
    inputClassName: string;
    onInputChange: (field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark", value: string) => void;
    isValueInvalid: boolean;
    validationError?: string;
    t: (key: string, values?: Record<string, string | number>) => string;
}

import { getFieldGuideline } from "@/lib/utils/social-guidelines";
import { preventNegativeInput } from "./AttributeControl";

export const DiscountValueInput: React.FC<DiscountValueInputProps> = ({
    data,
    isDisabled,
    inputClassName,
    onInputChange,
    isValueInvalid,
    validationError,
    t,
}) => {
    const dataTypeUpper = (data.dataType || "").toUpperCase();
    const guideline = getFieldGuideline(data.socialAttributeCode, dataTypeUpper, t);

    return (
        <div className="space-y-1.5 w-full">
            <Label className="text-sm font-bold text-blue-800">
                {t("discount.amount") || "Value"}
                {data.unit ? ` (${t("discount.unitLabel", { unit: data.unit }) || `Unit: ${data.unit}`})` : ""}
                <span className="text-red-500 ml-0.5">*</span>
            </Label>
            
            {dataTypeUpper === "INT" && (() => {
                const code = (data.socialAttributeCode || "").toUpperCase();
                const isYear = code === "WATER_CONN_YEAR";
                const isTree = code.includes("TREE") || code === "TREE_COUNT";
                const isSolar = code.includes("SOLAR");
                const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;
                const minVal = isYear ? 1900 : 1;
                return (
                    <Input
                        type="number"
                        step="1"
                        min={minVal}
                        maxLength={digitsLimit}
                        onKeyDown={preventNegativeInput}
                        value={data.intValue !== null && data.intValue !== undefined ? String(data.intValue) : ""}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw.replace(/\D/g, "").length <= digitsLimit) {
                                onInputChange("intValue", raw === "" ? "" : raw); // Wait, Discount expects string value.
                            }
                        }}
                        placeholder={t("discount.amountPlaceholder") || "Enter value"}
                        disabled={isDisabled}
                        className={inputClassName}
                    />
                );
            })()}

            {dataTypeUpper === "DECIMAL" && (
                <Input
                    type="number"
                    step="any"
                    min={0.01}
                    onKeyDown={preventNegativeInput}
                    value={data.decimalValue !== null && data.decimalValue !== undefined ? String(data.decimalValue) : ""}
                    onChange={(e) => onInputChange("decimalValue", e.target.value)}
                    placeholder={t("discount.amountPlaceholder") || "Enter value"}
                    disabled={isDisabled}
                    className={inputClassName}
                />
            )}

            {dataTypeUpper === "VARCHAR" && (
                <Input
                    value={data.textValue || ""}
                    onChange={(e) => onInputChange("textValue", e.target.value)}
                    placeholder={t("discount.amountPlaceholder") || "Enter text"}
                    disabled={isDisabled}
                    className={inputClassName}
                />
            )}

            {dataTypeUpper === "DATE" && (
                <Input
                    type="date"
                    value={data.dateValue || ""}
                    onChange={(e) => onInputChange("dateValue", e.target.value)}
                    disabled={isDisabled}
                    className={inputClassName}
                />
            )}

            {guideline && !isDisabled && (
                <p className="text-slate-400 text-xs font-semibold mt-1 leading-normal">
                    {guideline}
                </p>
            )}

            {isValueInvalid && <ValidationMessage message={validationError} />}
        </div>
    );
};
