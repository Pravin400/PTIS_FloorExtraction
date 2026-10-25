"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Button } from "@/components/common/ActionButton";
import { Cog } from "lucide-react";
import { SearchSelect, MultiSelect, Option } from '@/components/common';
import { cn } from "@/lib/utils/cn";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface PropertyFilterProps {
    zoneOptions: Option[];
    wardOptions: Option[];
    propertyFromOptions?: Option[];
    propertyToOptions?: Option[];
    selectedZone?: string;
    selectedWards?: string[];
    selectedPropertyFrom?: string;
    selectedPropertyTo?: string;
    isLoadingPropertyFrom?: boolean;
    isLoadingPropertyTo?: boolean;
    onZoneChange: (name: string, value: string) => void;
    onWardsChange: (selected: string[]) => void;
    onPropertyFromChange?: (name: string, value: string) => void;
    onPropertyToChange?: (name: string, value: string) => void;
    t: (key: string, values?: Record<string, string | number>) => string;
    divisionLabel?: string;
    wardLabel?: string;
    propertyNoLabel?: string;
}

export function PropertyFilter({
    zoneOptions = [],
    wardOptions = [],
    propertyFromOptions = [],
    propertyToOptions = [],
    selectedZone = "",
    selectedWards = [],
    selectedPropertyFrom = "",
    selectedPropertyTo = "",
    isLoadingPropertyFrom = false,
    isLoadingPropertyTo = false,
    onZoneChange,
    onWardsChange,
    onPropertyFromChange,
    onPropertyToChange,
    t,
    divisionLabel: propDivisionLabel,
    wardLabel: propWardLabel,
    propertyNoLabel: propPropertyNoLabel,
}: PropertyFilterProps) {
    const divisionAlias = useAliasLabel("Division", propDivisionLabel ?? t("uploadDownloadDrawer.propertyFilter.divisionLabel"));
    const wardAlias = useAliasLabel("Ward", propWardLabel ?? t("uploadDownloadDrawer.propertyFilter.wardLabel"));
    const propertyNoAlias = useAliasLabel(
        "Property_No",
        propPropertyNoLabel ?? t("aliasFallback.propertyNo")
    );
    const isFilterApplied = Boolean(
        selectedZone ||
        (selectedWards && selectedWards.length > 0) ||
        selectedPropertyFrom ||
        selectedPropertyTo
    );
    const [isFilterOpen, setIsFilterOpen] = useState(isFilterApplied);

    return (
        <Card
            variant="default"
            padding="none"
            className="w-full overflow-visible rounded-xl sm:rounded-2xl border border-[#d7e3f1] bg-white shadow-2xs"
        >
            <CardHeader
                className={cn(
                    "mb-0 flex flex-row items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#f4f8fc] rounded-t-xl sm:rounded-t-2xl",
                    isFilterOpen ? "border-b border-[#d7e3f1]" : "rounded-b-xl sm:rounded-b-2xl"
                )}
            >
                {/* Left Content */}
                <div className="flex flex-col">
                    <CardTitle className="text-xs sm:text-sm font-bold leading-tight text-[#1f4977]">
                        {t("uploadDownloadDrawer.propertyFilter.title")}
                    </CardTitle>

                    <>
                        {!isFilterApplied && (
                            <span className="mt-0.5 text-[11px] font-medium leading-3 text-[#777]">
                                {t("uploadDownloadDrawer.propertyFilter.optional")}
                            </span>
                        )}

                        <div className="mt-1.5 flex items-center gap-1.5">
                            <span
                                className={`h-2 w-2 rounded-full ${isFilterApplied ? "bg-green-500" : "bg-gray-400"
                                    }`}
                            />

                            <span className="text-[11px] font-medium text-[#777]">
                                {isFilterApplied
                                    ? t("uploadDownloadDrawer.propertyFilter.filterActive")
                                    : t("uploadDownloadDrawer.propertyFilter.noFilter")}
                            </span>
                        </div>
                    </>
                </div>

                {/* Filter Button */}
                <Button
                    variant={isFilterOpen ? "primary" : "secondary"}
                    size="xs"
                    icon={Cog}
                    className={`h-7 sm:h-8 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${isFilterOpen
                        ? 'bg-[#185FB8] text-white hover:bg-[#134b94]'
                        : 'border-[#d7e3f1] bg-white text-[#315474] hover:bg-slate-50'
                        }`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    {t("uploadDownloadDrawer.propertyFilter.filter")}
                </Button>
            </CardHeader>

            {isFilterOpen && (
                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <SearchSelect
                            label={divisionAlias}
                            options={zoneOptions}
                            placeholder={t("uploadDownloadDrawer.propertyFilter.divisionPlaceholder")}
                            value={selectedZone}
                            onChange={onZoneChange}
                        />

                        <MultiSelect
                            label={wardAlias}
                            options={wardOptions}
                            showSelectAll={false}
                            placeholder={
                                !selectedZone
                                    ? t("uploadDownloadDrawer.propertyFilter.divisionFirstPlaceholder")
                                    : t("uploadDownloadDrawer.propertyFilter.wardPlaceholder")
                            }
                            value={selectedWards}
                            onChange={onWardsChange}
                            disabled={!selectedZone}
                            selectSize="sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <SearchSelect
                            options={propertyFromOptions}
                            label={t("uploadDownloadDrawer.propertyFilter.propertyFromLabel", { propertyNo: propertyNoAlias })}
                            placeholder={
                                !selectedZone
                                    ? t("uploadDownloadDrawer.propertyFilter.divisionFirstPlaceholder")
                                    : isLoadingPropertyFrom
                                        ? t("uploadDownloadDrawer.propertyFilter.loading")
                                        : t("uploadDownloadDrawer.propertyFilter.optional")
                            }
                            value={selectedPropertyFrom}
                            onChange={onPropertyFromChange ?? (() => { })}
                            disabled={!selectedZone || isLoadingPropertyFrom}
                        />
                        <SearchSelect
                            options={propertyToOptions}
                            label={t("uploadDownloadDrawer.propertyFilter.propertyToLabel", { propertyNo: propertyNoAlias })}
                            placeholder={
                                !selectedPropertyFrom
                                    ? t("uploadDownloadDrawer.propertyFilter.propertyFromFirstPlaceholder")
                                    : isLoadingPropertyTo
                                        ? t("uploadDownloadDrawer.propertyFilter.loading")
                                        : t("uploadDownloadDrawer.propertyFilter.optional")
                            }
                            value={selectedPropertyTo}
                            onChange={onPropertyToChange ?? (() => { })}
                            disabled={!selectedPropertyFrom || isLoadingPropertyTo}
                        />
                    </div>

                    <div className="rounded-lg bg-[#f1f3f6] border border-[#e2e8f0] px-3 py-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#666]">
                        <span className="font-semibold text-[#444]">*</span> {t("uploadDownloadDrawer.propertyFilter.sameFromToScope")}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}