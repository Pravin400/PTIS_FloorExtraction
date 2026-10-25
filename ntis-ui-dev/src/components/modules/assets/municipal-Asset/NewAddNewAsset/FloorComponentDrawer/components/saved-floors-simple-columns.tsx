import type { FloorDetailsTableColumn } from '@/components/common';
import type { SavedFloorRow } from '@/types/asset/floor-details.types';
import { Home, TreeDeciduous, Sparkles } from 'lucide-react';
import { typeBadge, getTypeOfUseLabel } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderSimple';
  return HeaderComponent;
}

export function buildSavedFloorsIdentityColumns(
  t: (key: string) => string,
  floorLevelMap: Map<string, string>,
  constructionTypeMap: Map<string, string>,
  subUseTypeMap: Record<string, Array<{ label: string; value: string | number }>>,
  useTypes: Array<{ label: string; value: string | number }>,
  pageOffset: number = 0
): FloorDetailsTableColumn<SavedFloorRow>[] {
  return [
    {
      key: 'srNo',
      label: 'SR NO.',
      headerRender: plainHeader('SR NO.'),
      headerClassName: 'py-2.5 px-4 text-left min-w-[70px] max-w-[85px]',
      cellClassName: 'py-2.5 px-4 text-left font-bold text-slate-800',
      render: (f, index) => (
        <div className="flex items-center gap-1.5">
          {String(f.unitType).toLowerCase().includes('room') && (
            <Home className="size-3.5 text-blue-500 shrink-0" />
          )}
          {String(f.unitType).toLowerCase().includes('open') && (
            <TreeDeciduous className="size-3.5 text-emerald-500 shrink-0" />
          )}
          {String(f.unitType).toLowerCase().includes('amenit') && (
            <Sparkles className="size-3.5 text-violet-500 shrink-0" />
          )}
          <span>{pageOffset + (index ?? 0) + 1}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('floorDetails.type') || 'Type',
      headerRender: plainHeader(t('floorDetails.type') || 'Type'),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left',
      render: (f) => (
        <span
          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${typeBadge[f.unitType === 'Floor' ? 'Construction' : (f.unitType || '')] || typeBadge[f.unitType || ''] || 'bg-slate-100 text-slate-600'}`}
        >
          {f.isDirectFloorSubmission
            ? (f.unitType === 'Open Space' ? 'Open Space' : 'Construction')
            : (f.unitType && f.unitType !== 'Room' && f.unitType !== 'Floor' ? f.unitType : 'Construction')}
        </span>
      ),
    },
    {
      key: 'floor',
      label: t('floorDetails.floor'),
      headerRender: plainHeader(t('floorDetails.floor')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-bold text-slate-900',
      render: (f) => floorLevelMap.get(String(f.floorId)) || f.floorId,
    },
    {
      key: 'subFloor',
      label: t('floorDetails.subFloor'),
      headerRender: plainHeader(t('floorDetails.subFloor')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-semibold text-slate-800',
      render: (f) => f.subFloorName || f.subFloorId || '-',
    },
    {
      key: 'conYr',
      label: t('floorDetails.conYr'),
      headerRender: plainHeader(t('floorDetails.conYr')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-mono font-bold text-slate-800',
      render: (f) => f.constructionYear,
    },
    {
      key: 'asstYr',
      label: t('floorDetails.asstYr') || 'Asst Yr',
      headerRender: plainHeader(t('floorDetails.asstYr') || 'Asst Yr'),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-mono font-bold text-slate-800',
      render: (f) => f.assessmentYear || '-',
    },
    {
      key: 'conType',
      label: t('floorDetails.conType'),
      headerRender: plainHeader(t('floorDetails.conType')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-semibold text-slate-800',
      render: (f) => constructionTypeMap.get(String(f.constructionTypeId)) || f.constructionTypeId,
    },
    {
      key: 'typeOfUse',
      label: t('floorDetails.typeOfUse'),
      headerRender: plainHeader(t('floorDetails.typeOfUse')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-semibold text-slate-800',
      render: (f) => f.useTypeName || getTypeOfUseLabel(f.typeOfUseId, useTypes || []),
    },
    {
      key: 'subTypeOfUse',
      label: t('floorDetails.subTypeOfUse'),
      headerRender: plainHeader(t('floorDetails.subTypeOfUse')),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-semibold text-slate-800',
      render: (f) =>
        f.subTypeOfUseName ||
        subUseTypeMap[String(f.typeOfUseId)]?.find((o: { label: string; value: string | number }) => String(o.value) === String(f.subTypeOfUseId))
          ?.label ||
        '-',
    },
  ];
}
