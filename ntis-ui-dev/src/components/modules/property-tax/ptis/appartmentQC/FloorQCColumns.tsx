"use client";

import React from "react";
import { Eye } from "lucide-react";
import { EditLabelButton } from "@/components/common/ActionButtons";
import { cn } from "@/lib/utils/cn";
import { Select, MatrixCellInput } from "@/components/common";
import type { Column } from "@/components/common/MasterTable";
import type { FloorDataRow, DropdownOption, FloorQCSectionCopy } from "@/types/propertyEdit.types";

/* -------------------------------------------------------------------------- */
/*                           COMPACT INPUT COMPONENTS                          */
/* -------------------------------------------------------------------------- */

interface CompactSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  // Note: onOpen removed as Select component doesn't support lazy loading callback
}

/**
 * Compact select dropdown using the common Select component
 * Ensures current value is always visible even before master data loads
 */
export const CompactSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
}: CompactSelectProps) => {
  // Ensure current value is always in options array (prevents "Select" placeholder when value exists)
  const displayOptions = React.useMemo(() => {
    if (!value) return options;
    // Check if current value exists in options
    const valueExists = options.some(opt => opt.value === value);
    if (valueExists) return options;
    // Add current value as temporary option if not found (will be replaced when master data loads)
    return [{ value, label: value }, ...options];
  }, [value, options]);

  return (
    <div onClick={(e) => e.stopPropagation()} className="w-full">
      <Select
        value={value}
        onChange={(_e, val) => onChange(val)}
        options={displayOptions}
        placeholder={placeholder}
        disabled={disabled}
        selectSize="sm"
        className="min-w-[80px] text-[10px]"
      />
    </div>
  );
};
CompactSelect.displayName = "CompactSelect";

/**
 * Year cell input using MatrixCellInput for numeric year values
 */
interface YearCellInputProps {
  value: string;
  rowId: string;
  columnId: string;
  onChange: (val: string) => void;
  error?: string;
}

export const YearCellInput = ({
  value,
  rowId,
  columnId,
  onChange,
  error,
}: YearCellInputProps) => {
  const numericValue = parseInt(value, 10) || 0;
  
  const handleCellChange = (_rowId: string, _columnId: string, newValue: number) => {
    onChange(newValue === 0 ? "" : String(newValue));
  };

  return (
    <div className="relative">
      <MatrixCellInput
        value={numericValue}
        rowId={rowId}
        columnId={columnId}
        onCellChange={handleCellChange}
        allowDecimals={false}
        maxValue={9999}
        className={cn(
          "h-6 w-full min-w-[60px] text-[10px]",
          error && "border-red-400"
        )}
      />
      {error && (
        <span className="absolute -bottom-3 left-0 text-[8px] text-red-500 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
};
YearCellInput.displayName = "YearCellInput";

interface CompactCellInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
}

/**
 * Generic compact text input for non-numeric fields
 */
export const CompactCellInput = ({
  value,
  onChange,
  placeholder = "Enter",
  maxLength,
  error,
}: CompactCellInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "h-6 w-full px-1 text-[10px] border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition min-w-[60px]",
          error ? "border-red-400" : "border-gray-300"
        )}
      />
      {error && (
        <span className="absolute -bottom-3 left-0 text-[8px] text-red-500 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
};
CompactCellInput.displayName = "CompactCellInput";

/* -------------------------------------------------------------------------- */
/*                           READ-ONLY CELL COMPONENT                          */
/* -------------------------------------------------------------------------- */

interface ReadOnlyCellProps {
  value: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const ReadOnlyCell = ({ value, onClick, className, disabled }: ReadOnlyCellProps) => (
  <div 
    className={cn(
      "bg-gray-100 rounded border border-gray-300 px-1 py-0.5 text-[10px] text-center min-w-[60px]",
      onClick && !disabled && "cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors",
      onClick && disabled && "cursor-not-allowed opacity-70",
      className
    )}
    onClick={!disabled ? onClick : undefined}
  >
    {value || "-"}
  </div>
);
ReadOnlyCell.displayName = "ReadOnlyCell";

/* -------------------------------------------------------------------------- */
/*                           COLUMN BUILDER FUNCTIONS                          */
/* -------------------------------------------------------------------------- */

interface ColumnBuilderConfig {
  floorOptions: DropdownOption[];
  conTypeOptions: DropdownOption[];
  useTypeOptions: DropdownOption[];
  getSubTypeOptions: (typeOfUseId: string) => DropdownOption[];
  updateFloorRow: (id: string, field: keyof FloorDataRow, value: string) => void;
  onOpenRoomSubmission: (row: FloorDataRow) => void;
  onOpenFloorQCEdit?: (row: FloorDataRow) => void;
  copy: FloorQCSectionCopy;
}

/**
 * Builds the common columns shared across rateable and capital views
 */
export function buildCommonColumns(config: ColumnBuilderConfig): Column<FloorDataRow>[] {
  const {
    floorOptions,
    conTypeOptions,
    useTypeOptions,
    getSubTypeOptions,
    onOpenRoomSubmission,
    copy,
  } = config;

  const getLabel = (val: string, options: DropdownOption[]) => {
    if (!val) return "-";
    const opt = options.find((o) => String(o.value) === String(val));
    return opt ? opt.label : val;
  };

  return [
    {
      key: "floorId",
      label: copy.columns.floor,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={getLabel(row.floorId, floorOptions)} />,
    },
    {
      key: "conYear",
      label: copy.columns.conYear,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={row.conYear} />,
    },
    {
      key: "asstYear",
      label: copy.columns.asstYear,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={row.asstYear} />,
    },
    {
      key: "constructionTypeId",
      label: copy.columns.conType,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={getLabel(row.constructionTypeId, conTypeOptions)} />,
    },
    {
      key: "typeOfUseId",
      label: copy.columns.use,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={getLabel(row.typeOfUseId, useTypeOptions)} />,
    },
    {
      key: "subTypeOfUseId",
      label: copy.columns.subTypeOfUse,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => <ReadOnlyCell value={getLabel(row.subTypeOfUseId, getSubTypeOptions(row.typeOfUseId))} />,
    },
    {
      key: "noOfRooms",
      label: copy.columns.noOfRooms,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => (
        <ReadOnlyCell 
          value={String(row.noOfRooms || "")} 
          onClick={() => onOpenRoomSubmission(row)} 
          disabled={!row.pdnId}
          className="h-full flex items-center justify-center"
        />
      ),
    },
    {
      key: "area",
      label: copy.columns.area,
      cellClassName: "px-0.5 py-0.5",
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <div className="bg-gray-100 rounded border border-gray-300 px-1 py-0.5 text-[10px] text-center min-w-[50px] flex-1">
            {row.area || "-"}
          </div>
          <button
            type="button"
            onClick={() => onOpenRoomSubmission(row)}
            disabled={!row.pdnId}
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded transition",
              row.pdnId
                ? "text-blue-600 hover:bg-blue-100 cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            )}
            title={row.pdnId ? copy.tooltips.viewRoomDetails : copy.tooltips.noDetailId}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }
  ];
}

/**
 * Action Column
 */
export function buildActionColumn(copy: FloorQCSectionCopy, onOpenFloorQCEdit?: (row: FloorDataRow) => void): Column<FloorDataRow> {
  return {
    key: "actions",
    label: (copy.columns as Record<string, string>).editFloorQC || "Edit Floor QC",
    cellClassName: "px-0.5 py-0.5",
    render: (_v, row) => (
      <div className="flex items-center justify-center h-full">
        {onOpenFloorQCEdit && (
          <EditLabelButton
            onClick={(e) => {
              e.stopPropagation();
              onOpenFloorQCEdit(row);
            }}
            title={(copy.tooltips as Record<string, string>)?.editFloorQC || "Edit Floor QC"}
          />
        )}
      </div>
    )
  };
}

/**
 * Builds rateable method columns (read-only display)
 */
export function buildRateableColumns(copy: FloorQCSectionCopy, onOpenRoomSubmission: (row: FloorDataRow) => void): Column<FloorDataRow>[] {
  const makeClickableCell = (val: string | number | undefined | null, row: FloorDataRow) => (
    <ReadOnlyCell 
      value={val != null ? String(val) : ""} 
      onClick={() => onOpenRoomSubmission(row)} 
      disabled={!row.pdnId}
      className="h-full flex items-center justify-center min-h-[24px]"
    />
  );
  return [
    { key: "rentMY", label: copy.columns.rentMY, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.rentMY, row) },
    { key: "rateMY", label: copy.columns.rateMY, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.rateMY, row) },
    { key: "rentalValue", label: copy.columns.rentalValue, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.rentalValue, row) },
    { key: "depreciation", label: copy.columns.depreciation, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.depreciation, row) },
    { key: "alv", label: copy.columns.alv, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.alv, row) },
    { key: "mr", label: copy.columns.mr, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.mr, row) },
    { key: "rv", label: copy.columns.rv, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.rv, row) },
  ];
}

/**
 * Builds capital method columns (read-only display)
 */
export function buildCapitalColumns(copy: FloorQCSectionCopy, onOpenRoomSubmission: (row: FloorDataRow) => void): Column<FloorDataRow>[] {
  const makeClickableCell = (val: string | number | undefined | null, row: FloorDataRow) => (
    <ReadOnlyCell 
      value={val != null ? String(val) : ""} 
      onClick={() => onOpenRoomSubmission(row)} 
      disabled={!row.pdnId}
      className="h-full flex items-center justify-center min-h-[24px]"
    />
  );
  return [
    { key: "sdrr", label: copy.columns.sdrr, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.sdrr, row) },
    { key: "baseValue", label: copy.columns.baseValue, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.baseValue, row) },
    { key: "floorFactor", label: copy.columns.floorFactor, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.floorFactor, row) },
    { key: "ageFactor", label: copy.columns.ageFactor, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.ageFactor, row) },
    { key: "ntbFactor", label: copy.columns.ntbFactor, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.ntbFactor, row) },
    { key: "useFactor", label: copy.columns.useFactor, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.useFactor, row) },
    { key: "capitalValue", label: copy.columns.capitalValue, cellClassName: "px-0.5 py-0.5", render: (_v, row) => makeClickableCell(row.capitalValue, row) },
  ];
}

/**
 * Builds all columns based on the current view mode
 */
export function buildFloorQCColumns(
  config: ColumnBuilderConfig,
  subTab: string,
  dualMethodTab: "rateable" | "capital"
): Column<FloorDataRow>[] {
  const commonColumns = buildCommonColumns(config);
  const rateableColumns = buildRateableColumns(config.copy, config.onOpenRoomSubmission);
  const capitalColumns = buildCapitalColumns(config.copy, config.onOpenRoomSubmission);
  const actionCol = buildActionColumn(config.copy, config.onOpenFloorQCEdit);

  if (subTab === "capital") {
    return [...commonColumns, ...capitalColumns, actionCol];
  } else if (subTab === "dual-method") {
    return dualMethodTab === "capital"
      ? [...commonColumns, ...capitalColumns, actionCol]
      : [...commonColumns, ...rateableColumns, actionCol];
  }
  return [...commonColumns, ...rateableColumns, actionCol];
}
