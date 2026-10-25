import { FloorTableRow } from "@/types/OldDetails/property-old-details.types";
import { Column } from "@/components/common/MasterTable";

const renderCombinedArea = (value: unknown, t: (key: string) => string) => {
  const localizedUnit = t('roomSubmission.table.sqMeter');
  const valStr = typeof value === 'string' ? value.replace('m²', localizedUnit) : '';
  if (!valStr) return <span className="text-slate-900">-</span>;

  const parts = valStr.split(' (');
  if (parts.length === 2) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1">
        <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
          {parts[0]}
        </span>
        <span className="text-[10px] text-black font-bold whitespace-nowrap">
          ({parts[1]}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-1">
      <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
        {valStr}
      </span>
    </div>
  );
};

/**
 * Defines the columns for the Floor Information MasterTable.
 * 
 * @param t - Translation function from next-intl
 * @returns Array of column definitions
 */
export const getFloorInformationColumns = (t: (key: string) => string): Column<FloorTableRow>[] => [
  {
    key: 'floor',
    label: t('floor.floorLabel'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '120px',
  },
  {
    key: 'subFloor',
    label: t('floor.subFloor'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '120px',
  },
  {
    key: 'conYr',
    label: t('floor.conYr'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '90px',
  },
  {
    key: 'assessmentYr',
    label: t('floor.asstYr'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '90px',
  },
  {
    key: 'conTyp',
    label: t('floor.conTyp'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '200px',
  },
  {
    key: 'use',
    label: t('floor.use'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '110px',
  },
  {
    key: 'subUse',
    label: t('floor.subTyp'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '110px',
  },
  {
    key: 'carpetAreaCombined',
    label: t('oldDetails.carpetformheaderArea'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '160px',
    render: (value: unknown) => renderCombinedArea(value, t),
  },
  {
    key: 'builtupAreaCombined',
    label: t('oldDetails.builtupformheaderArea'),
    headerClassName: 'text-xs uppercase border-r border-white/30 font-semibold text-white text-center whitespace-nowrap',
    width: '160px',
    render: (value: unknown) => renderCombinedArea(value, t),
  },
];