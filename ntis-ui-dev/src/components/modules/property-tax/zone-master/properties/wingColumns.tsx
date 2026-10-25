"use client";

import { Column } from "@/components/common/MasterTable";
import { Badge } from "@/components/common";
import { PenLine, Building2 } from "lucide-react";
import { IconOnlyActionButton } from "@/components/common/ActionButtons";

export interface WingSummary {
  /** WingDetailsMast.wingName - the wing's short label (e.g. "A") */
  wingName: string;
  count: number;
  /** WingItem.id (Wing master) referenced by this WingDetailsMast row */
  wingMasterId: number;
  wingNo?: string;
  /** WingDetailsMast.id - the FK required as wingDetailId in Property/Bulk */
  wingDetailId: number;
  aminityCount?: number; // Amenity count from society wing details API
  propertyCount?: number; // Property count from society wing details API
  /** True for the synthetic "Main Society" row - no wing, no action buttons */
  isMainSociety?: boolean;
  [key: string]: unknown;
}

interface GetWingColumnsParams {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  onEditWing: (row: WingSummary) => void;
  onUpdateStructure: (row: WingSummary) => void;
  wingAlias?: string;
}

export function getWingColumns({
  t,
  onEditWing,
  onUpdateStructure,
  wingAlias,
}: GetWingColumnsParams): Column<WingSummary & Record<string, unknown>>[] {
  const wing = wingAlias ?? "Wing";
  return [
    {
      label: t("partitionForm.wing.table.wingName", { wing }),
      key: "wingName",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          {row.wingNo && (
            <Badge variant="default" size="md" className="font-bold">
              {row.wingNo}
            </Badge>
          )}
          <span className="font-medium text-gray-700">{row.wingName}</span>
        </div>
      ),
    },
    {
      label: t("partitionForm.wing.table.totalProperties"),
      key: "count",
      render: (_value, row) => {
        const displayCount = row.propertyCount ?? row.count;
        return (
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
              {displayCount} {t("partitionForm.wing.table.properties")}
            </div>
          </div>
        );
      },
    },
    {
      label: t("partitionForm.wing.table.amenities"),
      key: "aminityCount",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            {row.aminityCount ?? 0} {t("partitionForm.wing.table.amenities")}
          </div>
        </div>
      ),
    },
    {
      label: t("partitionForm.wing.table.actions"),
      key: "wingDetailId",
      align: "center",
      render: (_value, row) => {
        if (row.isMainSociety) {
          return <div className="flex items-center justify-center gap-1" />;
        }
        const isWingIdMissing = row.wingDetailId == null;
        return (
          <div className="flex items-center justify-center gap-1">
            {/* Edit Wing Name Button */}
            <IconOnlyActionButton
              icon={PenLine}
              onClick={() => onEditWing(row)}
              aria-label={t("partitionForm.wing.table.editWingName", { wing })}
              variant="ghost"
              size="sm"
              disabled={isWingIdMissing}
              className={isWingIdMissing 
                ? "text-gray-400 cursor-not-allowed p-1.5" 
                : "text-green-600 hover:scale-110 transition-transform p-1.5 hover:bg-transparent"
              }
            />

            {/* Update Wing Structure Button */}
            <IconOnlyActionButton
              icon={Building2}
              onClick={() => onUpdateStructure(row)}
              aria-label={t("partitionForm.wing.table.updateWing", { wing })}
              variant="ghost"
              size="sm"
              disabled={isWingIdMissing}
              className={isWingIdMissing 
                ? "text-gray-400 cursor-not-allowed p-1.5" 
                : "text-blue-600 hover:scale-110 transition-transform p-1.5 hover:bg-transparent"
              }
            />
          </div>
        );
      },
    },
  ];
}
