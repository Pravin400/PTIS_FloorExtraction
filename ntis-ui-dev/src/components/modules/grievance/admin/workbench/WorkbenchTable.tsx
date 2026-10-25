'use client';

/**
 * Workbench Table Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchTable.tsx
 *
 * Implements the Workbench master table using the canonical common component
 * @/components/common/ExpandableMasterTable.
 * Integrates shared ComplaintEvidenceCell for Before & After evidence preview,
 * responsive status tokens, action dispatch buttons, and expandable
 * horizontal assignment history stepper.
 * Line ceiling: <= 280 lines.
 */

import { useMemo } from 'react';
import { ChevronDown, ChevronRight, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/common';
import { ExpandableMasterTable, type Column } from '@/components/common/ExpandableMasterTable';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';
import type { GrievanceTimelineItemDto } from '@/types/grievance/tracking.types';
import { ComplaintEvidenceCell } from '@/components/modules/grievance/admin/complaints/ComplaintEvidenceCell';
import { WorkbenchTimelineStepper } from './WorkbenchTimelineStepper';

type StatusTranslationKey = 'statusPending' | 'statusInProgress' | 'statusResolved' | 'statusClosed';

const STATUS_MAP: Record<number, { bg: string; dot: string; key: StatusTranslationKey }> = {
  1: { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500 animate-pulse', key: 'statusPending' },
  2: { bg: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-500', key: 'statusInProgress' },
  3: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600', key: 'statusResolved' },
};
const DEFAULT_STATUS_MAP: { bg: string; dot: string; key: StatusTranslationKey } = {
  bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', key: 'statusClosed',
};

interface WorkbenchTableProps {
  complaints: AdminGrievanceRecord[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (size: number) => void;
  expandedIds: Set<number>;
  onToggleExpand: (complaint: AdminGrievanceRecord) => void;
  timelines: Map<number, GrievanceTimelineItemDto[]>;
  loadingTimelines: Set<number>;
  onAssignClick: (complaint: AdminGrievanceRecord) => void;
  onViewClick: (complaint: AdminGrievanceRecord) => void;
  onEnlargeEvidence: (complaint: AdminGrievanceRecord) => void;
}

export function WorkbenchTable({
  complaints,
  isLoading,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  expandedIds,
  onToggleExpand,
  timelines,
  loadingTimelines,
  onAssignClick,
  onViewClick,
  onEnlargeEvidence,
}: WorkbenchTableProps) {
  const t = useTranslations('grievance');

  // Convert complaints to Record-compatible shape for ExpandableMasterTable
  const tableData = useMemo(() => {
    return complaints as (AdminGrievanceRecord & Record<string, unknown>)[];
  }, [complaints]);

  // Column definitions using the shared Column contract
  const columns: Column<AdminGrievanceRecord & Record<string, unknown>>[] = useMemo(() => {
    return [
      // 1. Expand Chevron Toggle Column
      {
        key: 'id',
        label: '',
        width: '44px',
        align: 'center',
        headerClassName: 'w-[44px] text-center px-1',
        cellClassName: 'w-[44px] text-center align-middle px-1',
        render: (_val, row) => (
          <button
            type="button"
            aria-label={t('toggleDetails')}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(row); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer mx-auto"
          >
            {expandedIds.has(row.id) ? (
              <ChevronDown className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5]" />
            )}
          </button>
        ),
      },
      // 2. Complaint Title & Token Column
      {
        key: 'grievanceType',
        label: t('thComplaint'),
        width: '26%',
        align: 'left',
        headerClassName: 'text-left pl-3',
        cellClassName: 'text-left pl-3 align-middle',
        render: (_val, row) => (
          <div className="space-y-0.5 min-w-[160px] max-w-xs">
            <div className="text-xs sm:text-sm font-black text-slate-900 truncate" title={row.description || row.grievanceType}>
              {row.grievanceType || row.description || t('defaultGrievance')}
            </div>
            <div className="font-mono text-[11px] font-bold text-slate-500">{row.grievanceNo}</div>
          </div>
        ),
      },
      // 3. Common Evidence Thumbnail Column (Before & After Slider + modal trigger)
      {
        key: 'photos',
        label: t('thEvidence'),
        width: '180px',
        align: 'left',
        headerClassName: 'w-[180px] text-left pl-3',
        cellClassName: 'w-[180px] text-left pl-3 align-middle',
        render: (_val, row) => <ComplaintEvidenceCell complaint={row} onEnlarge={onEnlargeEvidence} />,
      },

      // 4. Department / Area Column
      {
        key: 'departmentName',
        label: t('thDeptArea'),
        width: '24%',
        align: 'left',
        headerClassName: 'text-left pl-3',
        cellClassName: 'text-left pl-3 align-middle',
        render: (_val, row) => {
          const areaText = row.roadLandmark || t('defaultWardArea');
          return (
            <div className="space-y-0.5 min-w-[140px] max-w-[200px]">
              <div className="text-xs font-black text-slate-900 truncate" title={row.departmentName}>
                {row.departmentName}
              </div>
              <div className="flex items-center min-w-0">
                <Tooltip content={areaText} placement="top">
                  <span className="text-[11px] font-medium text-slate-500 truncate cursor-pointer hover:text-slate-700 transition-colors">
                    {areaText}
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        },
      },

      // 5. Assigned Officer Column
      {
        key: 'currentStateId',
        label: t('thAssignedOfficer'),
        width: '180px',
        align: 'left',
        headerClassName: 'w-[180px] text-left pl-3',
        cellClassName: 'w-[180px] text-left pl-3 align-middle',
        render: (_val, row) => {
          const isUnassigned = row.currentStateId === 1;
          const timeline = timelines.get(row.id);
          const currentStep = timeline?.find((s) => s.isCurrentStep) || timeline?.[timeline.length - 1];
          const officerName = currentStep?.assignedTo || (!isUnassigned ? t('assignedOfficer') : null);

          if (isUnassigned || !officerName) {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('unassigned')}
              </span>
            );
          }

          return (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate"
              title={officerName}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{officerName}</span>
            </span>
          );
        },
      },

      // 6. Status Badge Column
      {
        key: 'currentStateName',
        label: t('thStatus'),
        width: '130px',
        align: 'left',
        headerClassName: 'w-[130px] text-left pl-3',
        cellClassName: 'w-[130px] text-left pl-3 align-middle',
        render: (_val, row) => {
          const cfg = STATUS_MAP[row.currentStateId] || DEFAULT_STATUS_MAP;
          return (
            <div className="flex items-center justify-start">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${cfg.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {t(cfg.key)}
              </span>
            </div>
          );
        },
      },
    ];
  }, [expandedIds, onToggleExpand, onEnlargeEvidence, timelines, t]);

  // Render Action buttons matching Image 1
  const renderActions = (row: AdminGrievanceRecord & Record<string, unknown>) => {
    const isUnassigned = row.currentStateId === 1;
    const isClosed = row.currentStateId === 3 || row.currentStateId === 4;
    const btnClass = isUnassigned
      ? 'bg-[#0B4D36] hover:bg-emerald-900 text-white font-black'
      : isClosed ? 'border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold' : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold';
    const label = isUnassigned ? t('actionAssign') : isClosed ? t('actionView') : t('actionReassign');
    const onAction = isClosed ? () => onViewClick(row) : () => onAssignClick(row);

    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className={`h-8 px-4 rounded-xl text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap ${btnClass}`}
        >
          {label}
        </button>
        <button
          type="button"
          aria-label="View history"
          onClick={(e) => { e.stopPropagation(); onViewClick(row); }}
          className="w-8 h-8 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all cursor-pointer shadow-2xs shrink-0"
          title={t('assignmentHistory')}
        >
          <Clock className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    );
  };

  // Render Expandable Inline Assignment History Stepper
  const renderExpandedRow = (row: AdminGrievanceRecord & Record<string, unknown>) => {
    if (!expandedIds.has(row.id)) return null;

    return (
      <div className="py-2 px-1">
        <WorkbenchTimelineStepper
          complaint={row}
          timeline={timelines.get(row.id)}
          isLoading={loadingTimelines.has(row.id)}
          submittedDate={row.submittedDate}
          onViewFullHistory={() => onViewClick(row)}
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      <ExpandableMasterTable
        columns={columns}
        data={tableData}
        loading={isLoading}
        isPagination={true}
        pageNumber={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isPageSize={Boolean(onPageSizeChange)}
        pageSizeOptions={[6, 10, 20, 50]}
        actionLabel={t('thActions')}
        actionHeaderAlign="right"
        actionCellAlign="right"
        actionHeaderClassName="w-[140px] min-w-[140px] text-right pr-6"
        actionCellClassName="w-[140px] min-w-[140px] text-right pr-6 align-middle"
        renderActions={renderActions}
        renderExpandedRow={renderExpandedRow}
        theadClassName="bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF] border-b border-blue-200 text-[#1E3A8A] select-none [&_th]:py-3.5 [&_th]:h-[52px] [&_th]:align-middle [&_th]:text-sm [&_th]:font-semibold"
        rowClassName={(_row) => 'hover:bg-blue-50/40 transition-colors cursor-pointer'}
        onRowClick={(row) => onToggleExpand(row)}
        emptyText={t('noComplaintsFound')}
        bareCard={false}
      />
    </div>
  );
}
