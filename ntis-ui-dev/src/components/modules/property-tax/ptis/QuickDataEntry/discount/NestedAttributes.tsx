"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { FlatSocialAttributeState, getLocalizedName } from "@/lib/utils/social-details";
import { AttributeControl } from "./AttributeControl";

interface NestedAttributesProps {
    attrs: SocialAttributeHierarchyDto[];
    depth?: number;
    socialData: Record<number, FlatSocialAttributeState>;
    errors: Record<number, string>;
    isAttributeEnabled: (attr: FlatSocialAttributeState) => boolean;
    handleValueChange: (
        attributeId: number,
        field: keyof FlatSocialAttributeState,
        value: string | number | boolean | null
    ) => void;
}

export const NestedAttributes: React.FC<NestedAttributesProps> = ({
    attrs,
    depth = 1,
    socialData,
    errors,
    isAttributeEnabled,
    handleValueChange,
}) => {
    const t = useTranslations("quickDataEntry");

    return (
        <div className={depth === 1 
            ? "space-y-2 mt-1 border-t border-slate-100/70 pt-2 transition-all duration-300 ease-in-out w-full" 
            : "space-y-2 pl-3 border-l border-slate-100/70 mt-2 ml-1 w-full"
        }>
            {attrs.map((child) => {
                const childState = socialData[child.id];
                if (!childState) return null;
                const isChildEnabled = isAttributeEnabled(childState);
                const childDisplayName = getLocalizedName(child.socialAttributeCode, child.socialAttributeName, t);

                return (
                    <div key={child.id} className="flex flex-col gap-1 w-full">
                        <span className={`text-[10px] font-semibold ${isChildEnabled ? "text-slate-600" : "text-slate-400"}`}>
                            {childDisplayName}
                            {child.isRequiredWhenParentTrue && <span className="text-red-500 ml-0.5">*</span>}
                            {child.unit && !childDisplayName.toLowerCase().includes(child.unit.toLowerCase()) && !child.socialAttributeName.toLowerCase().includes(child.unit.toLowerCase()) && (
                                <span className="text-slate-400 font-normal ml-1">({child.unit})</span>
                            )}
                        </span>
                        <AttributeControl
                            attr={child}
                            state={childState}
                            isEnabled={isChildEnabled}
                            hasError={!!errors[child.id]}
                            handleValueChange={handleValueChange}
                        />
                        <div className="min-h-[16px] mt-0.5">
                            {errors[child.id] ? (
                                <span className="text-red-500 text-[10px] block leading-none font-semibold">
                                    {errors[child.id]}
                                </span>
                            ) : null}
                        </div>
                        {child.children && child.children.length > 0 && (
                            <NestedAttributes
                                attrs={child.children}
                                depth={depth + 1}
                                socialData={socialData}
                                errors={errors}
                                isAttributeEnabled={isAttributeEnabled}
                                handleValueChange={handleValueChange}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
