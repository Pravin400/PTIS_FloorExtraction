"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { getLocalizedName } from "@/lib/utils/social-details";
import { Input, ToggleSwitch } from "@/components/common";
import { getMinMaxValues } from "@/lib/validations/social-details.validation";
import { getFieldGuideline } from "@/lib/utils/social-guidelines";
import { preventNegativeInput } from "./AttributeControl";
import { DiscountFieldErrors } from "@/lib/utils/validateDiscountForm";
import { getDiscountChildren } from "@/lib/utils/discount-helpers";

interface DiscountNestedAttributesProps {
    parentId: number;
    depth?: number;
    discountData: DiscountState;
    validationErrors?: Record<number, string>;
    fieldErrors?: Record<number, DiscountFieldErrors>;
    isDisabled: boolean;
    onInputChange: (
        attributeId: number,
        field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark" | "bitValue",
        value: string | number | boolean | null
    ) => void;
}

export const DiscountNestedAttributes: React.FC<DiscountNestedAttributesProps> = ({
    parentId,
    depth = 1,
    discountData,
    validationErrors,
    fieldErrors,
    isDisabled,
    onInputChange,
}) => {
    const t = useTranslations("quickDataEntry");
    const children = getDiscountChildren(parentId, discountData);

    if (!children || children.length === 0) return null;

    return (
        <div className={depth === 1
            ? "space-y-3 mt-1.5 border-t border-slate-100/70 pt-2.5 transition-all duration-300 ease-in-out w-full"
            : "space-y-3 pl-3 border-l-2 border-blue-100 mt-2 ml-1 w-full"
        }>
            {children.map((child: DiscountAttributeState) => {
                const childDisplayName = getLocalizedName(child.socialAttributeCode, child.socialAttributeName, t);
                const isChildBit = (child.dataType || "").toUpperCase() === "BIT";
                const isChildActive = isChildBit ? child.bitValue === true : Boolean(child.enabled);
                const hasControlDisabled = isDisabled;
                const errorMsg = fieldErrors?.[child.id]?.value || validationErrors?.[child.id];
                const guideline = getFieldGuideline(child.socialAttributeCode, child.dataType, t);

                const renderControl = () => {
                    switch (child.dataType?.toUpperCase()) {
                        case "BIT":
                            return (
                                <div className="cursor-pointer flex items-center">
                                    <ToggleSwitch
                                        checked={child.bitValue === true}
                                        onChange={(checked) => onInputChange(child.id, "bitValue", checked)}
                                        disabled={hasControlDisabled}
                                        showPopup={false}
                                    />
                                </div>
                            );
                        case "INT": {
                            const code = (child.socialAttributeCode || "").toUpperCase();
                            const isYear = code === "WATER_CONN_YEAR";
                            const isTree = code.includes("TREE");
                            const isSolar = code.includes("SOLAR");
                            const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;
                            const { min, max } = getMinMaxValues(child.socialAttributeCode);

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
                                        value={child.intValue ?? ""}
                                        disabled={hasControlDisabled}
                                        error={errorMsg ? " " : undefined}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw.replace(/\D/g, "").length <= digitsLimit) {
                                                onInputChange(child.id, "intValue", raw === "" ? null : raw);
                                            }
                                        }}
                                        className="h-8 w-full font-semibold"
                                    />
                                    {guideline && !hasControlDisabled && (
                                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                                            {guideline}
                                        </span>
                                    )}
                                </div>
                            );
                        }
                        case "DECIMAL": {
                            const { min, max } = getMinMaxValues(child.socialAttributeCode);
                            return (
                                <div className="flex flex-col gap-1 w-full">
                                    <Input
                                        type="number"
                                        step="any"
                                        min={min || 0.01}
                                        max={max}
                                        onKeyDown={preventNegativeInput}
                                        placeholder={t("discount.socialPlaceholders.enterDecimal") || "Enter decimal"}
                                        value={child.decimalValue ?? ""}
                                        disabled={hasControlDisabled}
                                        error={errorMsg ? " " : undefined}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            onInputChange(child.id, "decimalValue", raw === "" ? null : raw);
                                        }}
                                        className="h-8 w-full font-semibold"
                                    />
                                    {guideline && !hasControlDisabled && (
                                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                                            {guideline}
                                        </span>
                                    )}
                                </div>
                            );
                        }
                        case "VARCHAR": {
                            return (
                                <div className="flex flex-col gap-1 w-full">
                                    <Input
                                        type="text"
                                        maxLength={100}
                                        placeholder={t("discount.socialPlaceholders.enterText") || "Enter text"}
                                        value={child.textValue || ""}
                                        disabled={hasControlDisabled}
                                        error={errorMsg ? " " : undefined}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            onInputChange(child.id, "textValue", raw === "" ? null : raw);
                                        }}
                                        className="h-8 w-full font-semibold"
                                    />
                                    {guideline && !hasControlDisabled && (
                                        <span className="text-slate-400 text-[10px] font-semibold mt-0.5 leading-normal">
                                            {guideline}
                                        </span>
                                    )}
                                </div>
                            );
                        }
                        case "DATE": {
                            return (
                                <div className="flex flex-col gap-1 w-full">
                                    <Input
                                        type="date"
                                        max={new Date().toISOString().split("T")[0]}
                                        value={child.dateValue || ""}
                                        disabled={hasControlDisabled}
                                        error={errorMsg ? " " : undefined}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            onInputChange(child.id, "dateValue", raw === "" ? null : raw);
                                        }}
                                        className="h-8 w-full font-semibold"
                                    />
                                </div>
                            );
                        }
                        default:
                            return null;
                    }
                };

                return (
                    <div key={child.id} className="flex flex-col gap-1 w-full bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${!hasControlDisabled && isChildActive ? "text-slate-700" : "text-slate-500"}`}>
                                {childDisplayName}
                                {child.isRequiredWhenParentTrue && <span className="text-red-500 ml-0.5">*</span>}
                                {child.unit && !childDisplayName.toLowerCase().includes(child.unit.toLowerCase()) && !child.socialAttributeName.toLowerCase().includes(child.unit.toLowerCase()) && (
                                    <span className="text-slate-400 font-normal ml-1">({child.unit})</span>
                                )}
                            </span>
                        </div>

                        {renderControl()}

                        {errorMsg ? (
                            <span className="text-red-500 text-[10px] block leading-none font-semibold mt-0.5">
                                {errorMsg}
                            </span>
                        ) : null}

                        {/* Recursive nested children if any */}
                        <DiscountNestedAttributes
                            parentId={child.id}
                            depth={depth + 1}
                            discountData={discountData}
                            validationErrors={validationErrors}
                            fieldErrors={fieldErrors}
                            isDisabled={isDisabled}
                            onInputChange={onInputChange}
                        />
                    </div>
                );
            })}
        </div>
    );
};
