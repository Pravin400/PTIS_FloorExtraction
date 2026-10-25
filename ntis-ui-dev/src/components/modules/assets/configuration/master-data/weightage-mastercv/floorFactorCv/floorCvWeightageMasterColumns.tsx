import React from 'react';
import { Column } from '@/components/common/MasterTable';
import { MatrixCellInput, StatusBadge } from '@/components/common';
import { SortAscButton, SortDescButton, SortDefaultButton } from '@/components/common/ActionButtons';
import { ColumnConfig, FloorFactorCVMaster } from '@/types/asset-masters/floor-cv-weightageMaster.types';
import { toast } from "sonner";

// Extend FloorFactorCVMaster to add index signature
type FloorFactorCVMasterWithIndex = FloorFactorCVMaster & Record<string, unknown>;

/**
 * Renders a sortable column header with sort icon.
 * Mirrors the SortableHeader pattern from ConstructionTypeColumns.
 */
function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: (key: string) => string;
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === 'asc';
  const isDesc = isActive && sortOrder === 'desc';

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon('table.sort.verb')} ${label} ${tCommon('table.sort.ascending')}`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon('table.sort.verb')} ${label} ${tCommon('table.sort.descending')}`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={`${tCommon('table.sort.by')} ${label}`}
      />
    );
  };

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

/**
 * Returns the table column configuration for Floor CV Weightage Master.
 *
 * Sortable columns: floorCode, description (API-supported).
 * Assessment year shows fromYear only (not fromYear-toYear range).
 */
export const getFloorCvWeightageMasterColumns = ({
  t,
  tW,
  tCommon,
  editableRows,
  handleCellChange,
  getRowUid,
  sortBy,
  sortOrder,
  onSort,
  floorOptions = [],
  assessmentYearOptions = [],
}: ColumnConfig & {
  floorOptions?: { label: string; value: string }[];
  assessmentYearOptions?: { label: string; value: string }[];
}): Column<FloorFactorCVMasterWithIndex>[] => {
  // Sortable columns — API accepts: FloorCode, FloorDescription, FromYear
  const sortableColumns: Record<string, string> = {
    floorCode: 'FloorCode',
    floorDescription: 'FloorDescription',
    fromYear: 'FromYear',
  };

  const createSortableLabel = (label: string, dataKey: string) => {
    const apiSortKey = sortableColumns[dataKey];
    if (onSort && apiSortKey) {
      return (
        <SortableHeader
          label={label}
          columnKey={apiSortKey}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
        />
      );
    }
    return label;
  };

  return [
    {
      key: 'floorCode',
      label: createSortableLabel(t('columns.floorCode'), 'floorCode'),
      width: '10%',
      render: (value: unknown, row: FloorFactorCVMasterWithIndex) => {
        let code = '-';
        if (value && typeof value === 'string' && value !== '-') {
          code = value;
        } else {
          const opt = floorOptions.find(o => o.value === String(row.floorId));
          if (opt) {
            const parts = opt.label.split(' - ');
            code = parts.length > 1 ? parts[0].trim() : opt.label;
          }
        }
        return <span className="break-all block">{code}</span>;
      },
    },
    {
      key: 'floorDescription',
      label: createSortableLabel(t('columns.description'), 'floorDescription'),
      width: '14%',
      render: (value: unknown, row: FloorFactorCVMasterWithIndex) => {
        let desc = '-';
        if (value && typeof value === 'string' && value !== '-') {
          desc = value;
        } else {
          const opt = floorOptions.find(o => o.value === String(row.floorId));
          if (opt) {
            const parts = opt.label.split(' - ');
            desc = parts.length > 1 ? parts.slice(1).join(' - ').trim() : opt.label;
          }
        }
        return <span className="break-all block">{desc}</span>;
      },
    },
    {
      key: 'factorWithLift',
      label: t('columns.factorWithLift'),
      width: '14%',
      render: (value: unknown, row: FloorFactorCVMaster) => {
        const rowUid = getRowUid(row);
        const editableValue = editableRows[rowUid]?.factorWithLift ?? (value as number);
        return (
          <MatrixCellInput
            className="lg:w-26"
            value={editableValue}
            rowId={rowUid}
            columnId="factorWithLift"
            metaLabel={t('columns.factorWithLift')}
            maxValue={999.99}
            onCellChange={handleCellChange}
            onMaxExceeded={() => toast.error(tW('common.messages.valueExceedsMax'))}
          />
        );
      },
    },
    {
      key: 'factorWithoutLift',
      label: t('columns.factorWithoutLift'),
      width: '14%',
      render: (value: unknown, row: FloorFactorCVMaster) => {
        const rowUid = getRowUid(row);
        const editableValue = editableRows[rowUid]?.factorWithoutLift ?? (value as number);
        return (
          <MatrixCellInput
            className="lg:w-26"
            value={editableValue}
            rowId={rowUid}
            columnId="factorWithoutLift"
            metaLabel={t('columns.factorWithoutLift')}
            maxValue={999.99}
            onCellChange={handleCellChange}
            onMaxExceeded={() => toast.error(tW('common.messages.valueExceedsMax'))}
          />
        );
      },
    },
    {
      // Assessment year column: display as fromYear-toYear, sortable by FromYear
      key: 'fromYear',
      label: createSortableLabel(t('columns.assessmentYear'), 'fromYear'),
      width: '14%',
      render: (_value: unknown, row: FloorFactorCVMasterWithIndex) => {
        if (row.fromYear != null && row.toYear != null && row.fromYear !== 0 && row.toYear !== 0) {
          return `${row.fromYear}-${row.toYear}`;
        }
        const yearId = (row as Record<string, unknown>).yearRangeCVId ?? (row as Record<string, unknown>).yearRangeId ?? (row as Record<string, unknown>).yearRangeCvId ?? (row as Record<string, unknown>).YearRangeCVId ?? (row as Record<string, unknown>).YearRangeCvId ?? (row as Record<string, unknown>).yearId;
        if (yearId != null && yearId !== undefined) {
          const opt = assessmentYearOptions.find(o => String(o.value) === String(yearId));
          if (opt) return opt.label;
        }
        return '-';
      },
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      width: '14%',
      isStatus: true,
      render: (value: unknown) => {
        return (
          <StatusBadge
            variant="status"
            value={value as boolean}
            activeLabel={tW('common.labels.active')}
            inactiveLabel={tW('common.labels.inactive')}
          />
        );
      },
    },
  ];
};
