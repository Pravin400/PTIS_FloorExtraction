'use client';

import { useMemo } from 'react';
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Building2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import { MasterTable, type Column } from '@/components/common/MasterTable';
import type { GrievanceDepartment } from '@/types/grievance/department-master.types';

interface DepartmentMasterTableProps {
  departments: GrievanceDepartment[];
  isLoading: boolean;
  search: string;
  status: 'all' | 'active' | 'inactive';
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onSearchChange: (q: string) => void;
  onStatusChange: (st: 'all' | 'active' | 'inactive') => void;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewClick: (dept: GrievanceDepartment) => void;
  onEditClick: (dept: GrievanceDepartment) => void;
  onDeleteClick: (dept: GrievanceDepartment) => void;
}

export function DepartmentMasterTable({
  departments,
  isLoading,
  search,
  status,
  page,
  pageSize,
  totalCount,
  totalPages,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onPageSizeChange,
  onViewClick,
  onEditClick,
  onDeleteClick,
}: DepartmentMasterTableProps) {
  const t = useTranslations('grievance');

  const columns: Column<GrievanceDepartment & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'code',
        label: t('thCode'),
        width: '80px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, dept, index) => {
          const displayId = dept.code || dept.srNo || String((page - 1) * pageSize + index + 1);
          return (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-100 border border-slate-200/80 font-mono font-black text-slate-800 text-xs">
              {displayId}
            </span>
          );
        },
      },
      {
        key: 'nameEn',
        label: t('thDepartmentName'),
        align: 'left',
        render: (_val, dept) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-slate-900 text-xs sm:text-sm">
                {dept.nameEn}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-devanagari font-semibold mt-0.5 leading-relaxed">
                {dept.nameMr}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'isActive',
        label: t('thStatus'),
        width: '140px',
        align: 'center',
        headerClassName: 'text-center',
        render: (_val, dept) => (
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-black border transition-colors shadow-2xs ${
              dept.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                dept.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            {dept.isActive ? t('active') : t('inactive')}
          </span>
        ),
      },
    ],
    [t, page, pageSize]
  );

  return (
    <MasterTable<GrievanceDepartment & Record<string, unknown>>
      columns={columns}
      data={departments as (GrievanceDepartment & Record<string, unknown>)[]}
      loading={isLoading}
      emptyText={t('noDepartmentsFound')}
      getRowKey={(dept) => dept.id}
      pageNumber={page}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      pageSizeOptions={[10, 20, 50, 100]}
      actionLabel={t('thActions')}
      renderActions={(dept) => (
        <div
          className="flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* View Details */}
          <Button
            size="xs"
            variant="secondary"
            onClick={() => onViewClick(dept)}
            title={t('viewDetailsTooltip')}
            icon={Eye}
            className="w-7 h-7 p-0 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-2xs"
          />

          {/* Edit */}
          <Button
            size="xs"
            variant="secondary"
            onClick={() => onEditClick(dept)}
            title={t('editDeptTooltip')}
            icon={Pencil}
            className="w-7 h-7 p-0 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-2xs"
          />

          {/* Delete */}
          <Button
            size="xs"
            variant="secondary"
            onClick={() => onDeleteClick(dept)}
            title={t('deleteDeptTooltip')}
            icon={Trash2}
            className="w-7 h-7 p-0 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-2xs"
          />
        </div>
      )}
      onRowClick={(dept) => onViewClick(dept)}
      headerExtra={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchDepartmentsPlaceholder')}
              className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs text-xs font-bold self-start sm:self-auto">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusChange(st)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                  status === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t(st)}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
