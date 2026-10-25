import React from "react";
import { CheckCircle2, ShieldCheck, Building2, Home } from "lucide-react";
import type { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import type { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import type { UnitSelectionItem } from "@/types/building-permission.types";

export interface UnitRow extends Record<string, unknown> {
    propertyDetailsId: number;
    propertyId?: number;
    unitNo: string;
    wingName: string;
    wingDetailId?: number;
    floorName: string;
    useName: string;
    coverageStatus?: CoverageStatus;
    actions?: unknown;
    deleteSelection?: unknown;
}

export const COVERAGE_STATUSES = ["direct", "wing", "apartment", "none"] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const coverageBadgeConfig: Record<CoverageStatus, { label: string; tKey: string; icon: React.ReactNode; className: string }> = {
    direct: {
        label: "Applied (Direct)",
        tKey: "building.statusAppliedDirect",
        icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
        className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    },
    wing: {
        label: "Wing Covered",
        tKey: "building.statusWingCovered",
        icon: <Home className="w-3 h-3 shrink-0" />,
        className: "bg-blue-50 text-blue-800 border-blue-300",
    },
    apartment: {
        label: "Apartment Covered",
        tKey: "building.statusApartmentCovered",
        icon: <Building2 className="w-3 h-3 shrink-0" />,
        className: "bg-indigo-50 text-indigo-800 border-indigo-300",
    },
    none: {
        label: "Not Applied",
        tKey: "building.statusNotApplied",
        icon: <ShieldCheck className="w-3 h-3 shrink-0" />,
        className: "bg-slate-50 text-slate-700 border-slate-300",
    },
};

export interface UnitSelectionPanelProps {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    activeSelectedId?: number | null;
    activeAttributeName?: string;
    onEditUnit?: (row: unknown) => void;
    onUrlUpdate?: (params: URLSearchParams) => void;
    showActions?: boolean;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    propertyId?: string | number;
    onBulkDelete?: (selectedUnitPropertyIds: number[]) => Promise<boolean | void> | void;
    onDeleteSelectionChange?: (selectedIds: Set<number>) => void;
}

export interface UseUnitTableColumnsParams {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    uploadedUnitsMap: Map<number, (PropertySocialDetailsDto | SocialAttributeHierarchyDto)>;
    wingDocumentMap: Map<number, (PropertySocialDetailsDto | SocialAttributeHierarchyDto)>;
    apartmentDocumentItem: (PropertySocialDetailsDto | SocialAttributeHierarchyDto) | null;
    unitCoverageMap: Map<number, CoverageStatus>;
    isUnitApplied: (unitPropId: number) => boolean;
    isRowEditing: (u: UnitRow) => boolean;
    isAllSelectableUnitsSelected: boolean;
    handleToggleAllSelectableUnits: () => void;
    selectableUnits: (UnitRow | UnitSelectionItem)[];
    appliedUnits: (UnitRow | UnitSelectionItem)[];
    isAllAppliedUnitsSelectedForDelete: boolean;
    handleToggleAllAppliedUnitsForDelete: () => void;
    selectedDeleteUnitIds: Set<number>;
    handleToggleDeleteUnit: (propertyDetailsId: number, e?: React.MouseEvent) => void;
    showActions: boolean;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
    translate: (key: string, fallback: string, values?: Record<string, string | number | Date>) => string;
    handleEditUnit: (row: UnitRow) => void;
    handleCancelEdit: (e?: React.MouseEvent) => void;
    handleViewUnitDocument: (_row: UnitRow, item?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)) => void;
}
