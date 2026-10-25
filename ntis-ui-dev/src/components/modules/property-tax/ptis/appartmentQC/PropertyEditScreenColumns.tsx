"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Column } from "@/components/common/MasterTable";
import { ExternalLink } from "lucide-react";
import { EditLabelButton } from "@/components/common/ActionButtons";
import { YEAR_REGEX } from "@/lib/utils/validation-rules";
import { cn } from "@/lib/utils/cn";
import { DrawerFloorDataRow, DrawerDropdownOption } from "@/types/propertyEditScreenDrawer.types";
import { Tooltip } from "@/components/common";

// ─── Compact Select (Table Cell) ────────────────────────────────────────────

interface CompactSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: DrawerDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  onDropdownClick?: () => void;
  isLoading?: boolean;
}
  
export const CompactSelect = ({
  value, onChange, options, placeholder = "Select", disabled = false, onDropdownClick, isLoading = false,
}: CompactSelectProps) => {
  // Ensure current value is always in options to display correctly
  const displayOptions = useMemo(() => {
    if (!value) return options;
    // Check if current value exists in options
    const valueExists = options.some(opt => opt.value === value);
    if (valueExists) return options;
    // Add current value as temporary option if not found (will be replaced when master data loads)
    return [{ value, label: value }, ...options];
  }, [value, options]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      onClick={(e) => {
        e.stopPropagation();
        if (onDropdownClick && !isLoading) {
          onDropdownClick();
        }
      }}
      className="h-6 px-1 text-[10px] border border-gray-300 rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition w-full min-w-[80px] cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      <option value="">{isLoading ? "Loading..." : placeholder}</option>
      {displayOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
    </select>
  );
};

// ─── Compact Cell Input ─────────────────────────────────────────────────────

interface CompactCellInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  pattern?: RegExp;
  error?: string;
}

export const CompactCellInput = ({ value, onChange, placeholder = "Enter", maxLength, pattern, error }: CompactCellInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (pattern === YEAR_REGEX) newValue = newValue.replace(/\D/g, "");
    if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
    onChange(newValue);
  };
  return (
    <div className="flex flex-col">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        onClick={(e) => e.stopPropagation()}
        className={`h-6 px-1 text-[10px] border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition w-full min-w-[60px] ${error ? "border-red-500" : "border-gray-300"}`}
      />
      {error && <span className="text-[8px] text-red-500">{error}</span>}
    </div>
  );
};

// ─── Read-Only Cell Hover Wrapper ───────────────────────────────────────────

interface ReadOnlyCellHoverProps {
  value: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export const ReadOnlyCellHover = ({ value, onClick, disabled = false, tooltip }: ReadOnlyCellHoverProps) => {
  const baseClasses = "group relative border rounded px-1 py-0.5 text-[10px] text-center transition-all duration-200 min-w-[60px]";
  const borderClasses = disabled
    ? "bg-gray-100 border-gray-300"
    : "bg-white border-gray-300 hover:border-blue-500 cursor-pointer";
  const textClasses = disabled ? "text-gray-400" : "text-gray-800 font-medium group-hover:text-blue-700 group-hover:underline";

  const content = (
    <div className={cn(baseClasses, borderClasses)} onClick={!disabled && onClick ? onClick : undefined}>
      <span className={textClasses}>{value || "-"}</span>
      {!disabled && (
        <ExternalLink className="inline-block w-3 h-3 ml-1 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200" />
      )}
    </div>
  );

  if (tooltip && !disabled) {
    return (
      <Tooltip content={tooltip} placement="top">
        {content}
      </Tooltip>
    );
  }
  return content;
};

// ─── Column Header ──────────────────────────────────────────────────────────

const makeHeader = (
  label: string,
  tooltip: string
) => (
  <Tooltip
    content={
      <div className="text-xs max-w-xs whitespace-normal break-words">
        {tooltip}
      </div>
    }
    placement="top"
  >
    <div>

      <span className="text-[10px] font-semibold text-gray-900">{label}</span>

    </div>
  </Tooltip>
) as unknown as string;

const makeFloorQcHeader = (
  columnKey: string,
  t: ReturnType<typeof useTranslations>
) =>
  makeHeader(
    t(`floorQC.columns.${columnKey}`),
    t(`floorQC.toolTipFloorQC.tooltips.${columnKey}`)
  );

// ─── Column Builder Props ───────────────────────────────────────────────────

interface ColumnBuilderProps {
  floorOptions: DrawerDropdownOption[];
  conTypeOptions: DrawerDropdownOption[];
  useTypeOptions: DrawerDropdownOption[];
  getSubTypeOptions: (typeOfUseId: string) => DrawerDropdownOption[];
  isLoadingFloors: boolean;
  isLoadingConTypes: boolean;
  isLoadingUseTypes: boolean;
  handleFloorDropdownClick: () => void;
  handleConTypeDropdownClick: () => void;
  handleUseTypeDropdownClick: () => void;
  updateRow: (id: string, field: keyof DrawerFloorDataRow, value: string) => void;
  onOpenRoomSubmission: (row: DrawerFloorDataRow) => void;
}

// ─── Build Common Columns ───────────────────────────────────────────────────

export function useDrawerCommonColumns(props: ColumnBuilderProps): Column<DrawerFloorDataRow>[] {
  const { floorOptions, conTypeOptions, useTypeOptions, getSubTypeOptions, onOpenRoomSubmission } = props;
  const t = useTranslations("appartmentQC");

  const getLabel = (val: string, options: DrawerDropdownOption[]) => {
    if (!val) return "-";
    const opt = options.find((o) => String(o.value) === String(val));
    return opt ? opt.label : val;
  };

  return useMemo(() => [
    { key: "floorId", label: makeFloorQcHeader("floor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={getLabel(row.floorId, floorOptions)} /> },
    { key: "conYear", label: makeFloorQcHeader("conYear", t), width: "70px", align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.conYear} /> },
    { key: "asstYear", label: makeFloorQcHeader("asstYear", t), width: "70px", align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.asstYear} /> },
    { key: "constructionTypeId", label: makeFloorQcHeader("conType", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={getLabel(row.constructionTypeId, conTypeOptions)} /> },
    { key: "typeOfUseId", label: makeFloorQcHeader("use", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={getLabel(row.typeOfUseId, useTypeOptions)} /> },
    {
      key: "subTypeOfUseId", label: makeFloorQcHeader("subTypeOfUse", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => {
        const opts = getSubTypeOptions(row.typeOfUseId);
        return <ReadOnlyCellHover value={getLabel(row.subTypeOfUseId, opts)} />;
      }
    },
    {
      key: "noOfRooms", label: makeFloorQcHeader("noOfRooms", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover
          value={String(row.noOfRooms || "")}
          onClick={() => onOpenRoomSubmission(row)}
          disabled={!row.pdnId}
          tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")}
        />
      )
    },
    {
      key: "area", label: makeFloorQcHeader("area", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover
          value={row.area}
          onClick={() => onOpenRoomSubmission(row)}
          disabled={!row.pdnId}
          tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")}
        />
      )
    }
  ], [floorOptions, conTypeOptions, useTypeOptions, getSubTypeOptions, onOpenRoomSubmission, t]);
}

// ─── Action Column ──────────────────────────────────────────────────────────

export function useDrawerActionColumn(props: { onOpenFloorQCEdit: (row: DrawerFloorDataRow) => void }): Column<DrawerFloorDataRow> {
  const { onOpenFloorQCEdit } = props;
  const t = useTranslations("appartmentQC");
  return useMemo(() => ({
    key: "actions",
    label: makeHeader(t("floorQC.columns.editFloorQC") || "Edit Floor QC", t("floorQC.tooltips.editFloorQC") || "Edit row"),
    align: "center",
    cellClassName: "px-0 py-0.1",
    render: (_v, row) => (
      <div className="flex items-center justify-center h-full">
        <EditLabelButton
          className="p-0"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFloorQCEdit(row);
          }}
          title={t("floorQC.columns.editFloorQC") || "Edit Floor QC"}
        />
      </div>
    )
  }), [onOpenFloorQCEdit, t]);
}

// ─── Rateable Columns ───────────────────────────────────────────────────────

export function useDrawerRateableColumns(props: { onOpenRoomSubmission: (row: DrawerFloorDataRow) => void }): Column<DrawerFloorDataRow>[] {
  const { onOpenRoomSubmission } = props;
  const t = useTranslations("appartmentQC");
  return useMemo(() => [
    {
      key: "rentMY", label: makeFloorQcHeader("rentMY", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.rentMY} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "rateMY", label: makeFloorQcHeader("rateMY", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => {
        const monthlyRate = row.monthlyRate ?? row.rateMY;
        const yearlyRate = row.yearlyRate ?? '';
        const displayValue = yearlyRate ? `${monthlyRate} / ${yearlyRate}` : String(monthlyRate);
        return (
          <ReadOnlyCellHover value={displayValue} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
        );
      }
    },
    {
      key: "rentalValue", label: makeFloorQcHeader("rentalValue", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.rentalValue} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "depreciation", label: makeFloorQcHeader("depreciation", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.depreciation} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "alv", label: makeFloorQcHeader("alv", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.alv} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "mr", label: makeFloorQcHeader("mr", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.mr} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "rv", label: makeFloorQcHeader("rv", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.rv} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
  ], [t, onOpenRoomSubmission]);
}

// ─── Capital Columns ────────────────────────────────────────────────────────

export function useDrawerCapitalColumns(props: { onOpenRoomSubmission: (row: DrawerFloorDataRow) => void }): Column<DrawerFloorDataRow>[] {
  const { onOpenRoomSubmission } = props;
  const t = useTranslations("appartmentQC");
  return useMemo(() => [
    {
      key: "sdrr", label: makeFloorQcHeader("sdrr", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.sdrr} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "baseValue", label: makeFloorQcHeader("baseValue", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.baseValue} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "floorFactor", label: makeFloorQcHeader("floorFactor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.floorFactor} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "ageFactor", label: makeFloorQcHeader("ageFactor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.ageFactor} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "ntbFactor", label: makeFloorQcHeader("ntbFactor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.ntbFactor} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "useFactor", label: makeFloorQcHeader("useFactor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.useFactor} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
    {
      key: "capitalValue", label: makeFloorQcHeader("capitalValue", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
        <ReadOnlyCellHover value={row.capitalValue} onClick={() => onOpenRoomSubmission(row)} disabled={!row.pdnId} tooltip={row.pdnId ? t("floorQC.tooltips.viewRoomDetails") : t("floorQC.tooltips.noDetailId")} />
      )
    },
  ], [t, onOpenRoomSubmission]);
}
