'use client';

/**
 * Complaints Table Component
 * Path: src/components/modules/grievance/admin/complaints/ComplaintsTable.tsx
 *
 * Wraps @/components/common/MasterTable with typed grievance columns,
 * status badges, localized dates, and quick inspection trigger.
 * Line ceiling: <= 300 lines.
 */

import { useState, useMemo } from 'react';
import { Eye, MapPin, Building2, User, Phone } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button, Tooltip } from '@/components/common';
import { MasterTable, type Column } from '@/components/common/MasterTable';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';
import { formatLocalizedNumber } from '@/lib/utils/grievance';
import { ComplaintEvidenceCell } from './ComplaintEvidenceCell';
import { ComplaintEvidenceModal } from './ComplaintEvidenceModal';

interface ComplaintsTableProps {
  complaints: AdminGrievanceRecord[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewClick: (complaint: AdminGrievanceRecord) => void;
}

export function ComplaintsTable({
  complaints,
  isLoading,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onViewClick,
}: ComplaintsTableProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const [evidenceComplaint, setEvidenceComplaint] = useState<AdminGrievanceRecord | null>(null);

  const columns: Column<AdminGrievanceRecord & Record<string, unknown>>[] = useMemo(() => {
    const getStatusBadge = (stateId: number) => {
      switch (stateId) {
        case 1:
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t('statusPending')}
            </span>
          );
        case 2:
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              {t('statusInProgress')}
            </span>
          );
        case 3:
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t('statusResolved')}
            </span>
          );
        case 4:
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {t('statusClosed')}
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {t('statusSubmitted')}
            </span>
          );
      }
    };

    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    return [
      {
        key: 'id',
        label: t('thId'),
        width: '70px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, row, index) => {
          const rawId = row.id || (page - 1) * pageSize + index + 1;
          const displayId = formatLocalizedNumber(rawId, locale);
          return (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-100 border border-slate-200/80 font-mono font-black text-slate-800 text-xs">
              {displayId}
            </span>
          );
        },
      },
      {
        key: 'grievanceNo',
        label: t('thGrievanceNo'),
        width: '150px',
        render: (_val, row) => (
          <span className="inline-flex items-center font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
            {row.grievanceNo}
          </span>
        ),
      },
      {
        key: 'citizenName',
        label: t('thCitizen'),
        width: '160px',
        render: (_val, row) => {
          const citizenDisplayName =
            !row.citizenName || row.citizenName.toLowerCase() === 'citizen'
              ? t('defaultCitizen')
              : row.citizenName;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">{citizenDisplayName}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'citizenMobileNo',
        label: t('thMobileNo'),
        width: '160px',
        render: (_val, row) => {
          const mobile = row.citizenMobileNo?.trim();
          if (!mobile) {
            return <span className="text-slate-400 text-xs font-mono">—</span>;
          }

          return (
            <div
              className="inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={`tel:${mobile}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold transition-all shadow-2xs group cursor-pointer active:scale-95"
                title={`${t('callCitizen')}: ${mobile}`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                <span>{mobile}</span>
              </a>
            </div>
          );
        },
      },
      {
        key: 'departmentName',
        label: t('thDepartment'),
        render: (_val, row) => (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-800 truncate">{row.departmentName}</div>
              <div className="text-[11px] text-emerald-700 font-semibold truncate">
                {row.grievanceType}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'roadLandmark',
        label: t('thLocation'),
        width: '180px',
        render: (_val, row) => {
          const landmarkText = row.roadLandmark || t('defaultAmravatiArea');
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-[180px] min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Tooltip content={landmarkText} placement="top">
                <span className="truncate cursor-pointer hover:text-slate-900 transition-colors">
                  {landmarkText}
                </span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        key: 'evidence',
        label: t('thBeforeAfter'),
        width: '180px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, row) => (
          <ComplaintEvidenceCell
            complaint={row}
            onEnlarge={(c) => setEvidenceComplaint(c)}
          />
        ),
      },
      {
        key: 'currentStateName',
        label: t('thStatus'),
        width: '130px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, row) => getStatusBadge(row.currentStateId),
      },
      {
        key: 'submittedDate',
        label: t('thSubmittedDate'),
        width: '120px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, row) => (
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            {formatDate(row.submittedDate)}
          </span>
        ),
      },
    ];
  }, [t, locale, page, pageSize]);

  return (
    <>
      <MasterTable<AdminGrievanceRecord & Record<string, unknown>>
        columns={columns}
        data={complaints as (AdminGrievanceRecord & Record<string, unknown>)[]}
        loading={isLoading}
        emptyText={t('noComplaintsFound')}
        getRowKey={(row) => row.id}
        pageNumber={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        pageSizeOptions={[10, 20, 50, 100]}
        actionLabel={t('thActions')}
        renderActions={(row) => (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="xs"
              variant="secondary"
              onClick={() => onViewClick(row)}
              title={t('viewComplaintDetails')}
              icon={Eye}
              className="w-7 h-7 p-0 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-2xs cursor-pointer"
            />
          </div>
        )}
        onRowClick={(row) => onViewClick(row)}
      />

      <ComplaintEvidenceModal
        isOpen={Boolean(evidenceComplaint)}
        complaint={evidenceComplaint}
        onClose={() => setEvidenceComplaint(null)}
      />
    </>
  );
}
