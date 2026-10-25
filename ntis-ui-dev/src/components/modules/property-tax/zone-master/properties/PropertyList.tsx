"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MasterTable } from "@/components/common/MasterTable";
import { SearchInput, StatusBadge, AddButton, SearchSelect, Option, Label } from '@/components/common';
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WardItem } from "@/types/wardMaster.types";
import { usePropertyListHandlers } from "@/hooks/zoneMaster/usePropertyListHandlers";
import { getPropertyColumns } from "./propertyColumns";
import { DeleteLabelButton } from "@/components/common/ActionButtons";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface PropertyCategoryMap {
    [key: number]: string;
}

interface PropertyTypeMap {
    [key: number]: string;
}

interface Props {
    properties: ZonePropertyItem[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    searchTerm?: string;
    selectedWardId: number | null;
    wards: WardItem[];
    currentWard?: WardItem | undefined;
    selectedZoneId: number | null;
    categoryMap?: PropertyCategoryMap;
    propertyTypeMap?: PropertyTypeMap;
}

export default function PropertyList({
    properties,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    searchTerm = "",
    selectedWardId,
    wards,
    selectedZoneId,
    categoryMap = {},
    propertyTypeMap = {},
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations("zoneMaster");
    const tCommon = useTranslations("common");

    const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
    const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
    const propertyNoAlias = useAliasLabel(
        "Property_No",
        useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo")))
    );
    const partitionAlias = useAliasLabel("Partition", t("defaults.partition"));
    const categoryAlias = useAliasLabel("Category", t("defaults.category"));

    const [pendingAction, setPendingAction] = useState<
        "createProperty" | "createPartition" | "deleteProperty" | null
    >(null);

    // Reset the pending loader once the URL actually changes (drawer opened/closed)
    const searchParamsKey = searchParams.toString();
    const [prevSearchParamsKey, setPrevSearchParamsKey] = useState(searchParamsKey);
    if (searchParamsKey !== prevSearchParamsKey) {
        setPrevSearchParamsKey(searchParamsKey);
        setPendingAction(null);
    }
    const {
        localSearch,
        handleSearchChange,
        handlePageChange,
        handlePageSizeChange,
        handleWardChange,
    } = usePropertyListHandlers({
        selectedWardId,
        selectedZoneId,
        searchTerm,
        pageNumber,
        pageSize,
    });

    // Ward options for dropdown
    const wardOptions: Option[] = useMemo(() => {
        return wards.map((ward) => ({
            value: String(ward.id),
            label: `${ward.wardNo}${ward.description ? ` - ${ward.description}` : ""}`,
        }));
    }, [wards]);



    // ── Columns ──────────────────────────────────────────────────────────────
    const columns = useMemo(
        () =>
            getPropertyColumns({
                t,
                pageNumber,
                pageSize,
                wards,
                categoryMap,
                propertyTypeMap,
                propertyNoAlias,
                categoryAlias,
            }),
        [t, pageNumber, pageSize, wards, categoryMap, propertyTypeMap, propertyNoAlias, categoryAlias]
    );

    const handleCreateProperty = useCallback(() => {
        setPendingAction("createProperty");
        const params = new URLSearchParams(searchParams.toString());
        if (selectedWardId !== null) params.set("propWardId", String(selectedWardId));
        params.set("createProperty", "");
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams, selectedWardId]);

    const handleCreatePartition = useCallback(() => {
        setPendingAction("createPartition");
        const params = new URLSearchParams(searchParams.toString());
        if (selectedWardId !== null) params.set("propWardId", String(selectedWardId));
        params.set("createPartition", "");
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams, selectedWardId]);

    const handleOpenDeleteDrawer = useCallback(() => {
        setPendingAction("deleteProperty");
        const params = new URLSearchParams(searchParams.toString());
        if (selectedWardId !== null) params.set("propWardId", String(selectedWardId));
        params.set("deleteProperty", "");
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams, selectedWardId]);


    return (
        <div className="flex flex-col h-full">
            {/* HEADER */}
            <div className="p-4 py-0">
                <div className="flex items-center justify-between px-4 py-2 mb-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div>
                            <span className="text-sm font-semibold text-blue-900">
                                {t("propertyList.dependencyFlow")}
                            </span>
                            <p className="text-xs text-blue-600 mt-0.5">
                                {t("propertyList.dependencyPath", {
                                    zone: zoneAlias,
                                    ward: wardAlias,
                                    partition: partitionAlias,
                                })}
                            </p>
                        </div>
                    </div>
                    {selectedWardId && (
                        <StatusBadge
                            label={wardOptions.find(w => w.value === String(selectedWardId))?.label || `${wardAlias} ${selectedWardId}`}
                            variant="pending"
                        />
                    )}
                </div>

                {/* Ward Dropdown and Search Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <SearchSelect
                            label={t("propertyList.selectWard", { ward: wardAlias })}
                            options={wardOptions}
                            value={selectedWardId ? String(selectedWardId) : ""}
                            onChange={(_name, value) => handleWardChange(value)}
                            placeholder={t("propertyList.selectWardPlaceholder", { ward: wardAlias })}
                            disabled={wards.length === 0}
                        />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("propertyList.search")}
                        </Label>
                        <SearchInput
                            className="w-full"
                            placeholder={t("propertyList.searchPlaceholder", {
                                propertyNo: propertyNoAlias,
                                partition: partitionAlias,
                            })}
                            value={localSearch}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                {/* Properties Header with Actions */}
                <div className="flex items-center justify-between mb-3 mt-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#1A86E8]" />
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-base font-semibold text-[#1A86E8]">
                                {t("propertyList.title")}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {t("propertyList.selectWardHint", {
                                    ward: wardAlias,
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <AddButton
                            size="sm"
                            label={t("propertyList.createProperty")}
                            onClick={handleCreateProperty}
                            disabled={selectedWardId === null || pendingAction !== null}
                            isLoading={pendingAction === "createProperty"}
                        />
                        <AddButton
                            size="sm"
                            label={t("propertyList.createPartition", { partition: partitionAlias })}
                            onClick={handleCreatePartition}
                            disabled={selectedWardId === null || pendingAction !== null}
                            isLoading={pendingAction === "createPartition"}
                        />

                        <DeleteLabelButton
                            label={t("propertyList.deleteButton")}
                            onClick={handleOpenDeleteDrawer}
                            disabled={selectedWardId === null || pendingAction !== null}
                            isLoading={pendingAction === "deleteProperty"}
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 px-4 pb-4">
                {selectedWardId === null ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        {t("propertyList.selectWardPrompt", {
                            ward: wardAlias,
                        })}
                    </div>
                ) : (
                    <MasterTable
                        columns={columns}
                        data={properties as unknown as Record<string, unknown>[]}
                        emptyText={t("propertyList.noPropertiesFound")}
                        height="xs"
                        paginationConfig={{ enabled: true, showPageSizeSelector: false }}
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        footerLeftContent={
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                {tCommon("table.showing")}{" "}
                                {totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1}{" "}
                                {tCommon("table.to")}
                                <select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    className="border border-blue-200 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    aria-label={tCommon("table.rowsPerPage")}
                                >
                                    {[5, 10, 20, 50].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                                {tCommon("table.of")}{" "}
                                <span>
                                    {totalCount} {tCommon("table.entries")}
                                </span>
                            </div>
                        }
                    />
                )}
            </div>

        </div>
    );
}

