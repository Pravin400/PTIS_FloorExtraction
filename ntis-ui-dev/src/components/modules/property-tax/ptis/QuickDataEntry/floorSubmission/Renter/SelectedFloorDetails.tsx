"use client";

import { MasterTable } from "@/components/common";
import { useTranslations } from "next-intl";

interface LookupItem {
    [key: string]: string | number | undefined;
}

interface FloorRowData {
    floorDescription?: string;
    floor?: string | number;
    conYr?: string | number;
    asstYr?: string | number;
    constructionDescription?: string;
    conTyp?: string | number;
    useDescription?: string;
    use?: string | number;
    subTypeDescription?: string;
    subTyp?: string | number;
    renter?: string | boolean;
    renterDetails?: {
        renterName?: string;
        rentAmount?: string | number;
        agreementDateFrom?: string;
    };
    renterName?: string;
    renterNameEnglish?: string;
    rentMonthly?: string | number;
    rooms?: number | string;
    areaSqM?: number | string;
    [key: string]: unknown;
}

interface SelectedFloorDetailsProps {
    formData: FloorRowData | null;
    floorLookup?: LookupItem[];
    constructionLookup?: LookupItem[];
    useLookup?: LookupItem[];
    subTypeLookup?: LookupItem[];
    subFloorLookup?: LookupItem[];
}

export const SelectedFloorDetails = ({ 
    formData,
    floorLookup = [],
    constructionLookup = [],
    useLookup = [],
    subTypeLookup = [],
    subFloorLookup: _subFloorLookup = [],
}: SelectedFloorDetailsProps) => {
    const t = useTranslations('quickDataEntry');
    
    if (!formData) return null;

    const data = [formData];

    // Helper to get Label from Lookup (matches format like "ID - Description")
    const getLabel = (value: string | number | undefined, lookup: LookupItem[], keyId: string, keyDesc: string) => {
        if (value === undefined || value === null) return "-";
        const item = lookup.find(i => String(i[keyId]) === String(value));
        if (item) {
            const desc = item[keyDesc] || "";
            // Return in "ID - Description" format as shown in image 2
            return desc ? `${value} - ${desc}` : String(value);
        }
        return String(value);
    };

    const columns = [
        {
            key: "floorDescription",
            label: t('floor.floorLabel'),
            render: (_: unknown, row: FloorRowData) => row.floorDescription || getLabel(row.floor, floorLookup, "floorId", "description"),
            headerClassName: "text-center",
            cellClassName: "text-center font-bold text-slate-700"
        },
        {
            key: "conYr",
            label: t('floor.conYr'),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold",
            render: (val: unknown) => (val as string | number) || "-"
        },
        {
            key: "asstYr",
            label: t('floor.asstYr'),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold",
            render: (val: unknown) => (val as string | number) || "-"
        },
        {
            key: "constructionDescription",
            label: t('floor.conTyp'),
            render: (_: unknown, row: FloorRowData) => row.constructionDescription || getLabel(row.conTyp, constructionLookup, "constructionTypeId", "description"),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold"
        },
        {
            key: "useDescription",
            label: t('floor.use'),
            render: (_: unknown, row: FloorRowData) => row.useDescription || getLabel(row.use, useLookup, "typeOfUseId", "description"),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold"
        },
        {
            key: "subTypeDescription",
            label: t('floor.subTyp'),
            render: (_: unknown, row: FloorRowData) => row.subTypeDescription || getLabel(row.subTyp, subTypeLookup, "subTypeOfUseId", "description"),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold"
        },
        {
            key: "renter",
            label: t('floor.renter'),
            headerClassName: "text-center",
            cellClassName: "text-center",
            render: (val: unknown, row: FloorRowData) => {
                const hasRenterData = row.renterDetails?.renterName || 
                                      row.renterName || 
                                      row.renterNameEnglish ||
                                      row.renterDetails?.rentAmount ||
                                      row.rentMonthly ||
                                      row.renterDetails?.agreementDateFrom;
                const isRenter = val === 'Yes' || String(val) === 'true' || hasRenterData;
                return (
                    <span className={`px-3 py-1 rounded text-[10px] font-bold ${isRenter ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {isRenter ? t('floor.yes') : t('floor.no')}
                    </span>
                );
            }
        },
        {
            key: "rooms",
            label: t('floor.rooms'),
            headerClassName: "text-center",
            cellClassName: "text-center font-semibold",
            render: (val: unknown) => (val as string | number) ?? "-",
        },
        {
            key: "areaSqM",
            label: t('floor.areaSqM'),
            headerClassName: "text-center",
            cellClassName: "text-center font-bold text-slate-800",
            render: (val: unknown) => (val as string | number) ?? "-",
        }
    ];

    return (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <MasterTable<FloorRowData>
                columns={columns}
                data={data}
                headerTitle={t('floor.selectedFloorDetails')}
                containerClassName="rounded-xl overflow-hidden shadow-sm pt-0"
                tableClassName="text-xs"
            />
        </div>
    );
};
