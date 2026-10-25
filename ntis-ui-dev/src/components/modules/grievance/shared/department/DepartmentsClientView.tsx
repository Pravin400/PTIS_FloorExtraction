'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Building2 } from 'lucide-react';
import { TableHeader } from '@/components/common';
import { MunicipalDepartmentsView } from './MunicipalDepartmentsView';
import { CitizenRegisterGrievanceModal } from '@/components/modules/grievance/citizen/CitizenRegisterGrievanceModal';
import { useDepartmentCount } from '@/hooks/grievance/shared';
import type { MunicipalDepartment } from '@/types/grievance';
import { formatLocalizedNumber, formatDepartmentNavLabel } from '@/lib/utils/grievance';

export function DepartmentsClientView() {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const [selectedDeptForGrievance, setSelectedDeptForGrievance] = useState<MunicipalDepartment | null>(null);


  const { count: deptCount } = useDepartmentCount();
  const displayCount = deptCount ?? 0;
  const localizedCount = formatLocalizedNumber(displayCount, locale);
  const headerTitle = formatDepartmentNavLabel(t('amcDeptsHeader'), displayCount, locale);

  return (
    <div className="flex-1 min-h-0 m-2 sm:m-3 p-2 sm:p-3 flex flex-col space-y-3">
      {/* 1. Official Page Header from Common */}
      <TableHeader
        title={headerTitle}
        subtitle={t('amcDeptsSubtitle', { count: localizedCount })}
        icon={Building2}
        rightContent={
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/grievance/dashboard`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('backToDashboard')}</span>
              <span className="sm:hidden">{t('back')}</span>
            </Link>
            <Link
              href={`/${locale}/grievance/raise`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-2xs shrink-0"
            >
              <span>{t('fileGrievance')}</span>
            </Link>
          </div>
        }
        className="shrink-0"
      />

      {/* 2. Main Departments Directory View */}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <MunicipalDepartmentsView
          hideHeader={true}
          className="h-full flex-1"
          onFileGrievanceForDept={(dept) => {
            setSelectedDeptForGrievance(dept);
          }}
        />
      </div>

      {/* 3. In-Flow Grievance Registration Modal */}
      {selectedDeptForGrievance && (
        <CitizenRegisterGrievanceModal
          isOpen={true}
          showOfficerContact={true}
          defaultDepartmentId={selectedDeptForGrievance.id}
          defaultCategory={selectedDeptForGrievance.category}
          onClose={() => setSelectedDeptForGrievance(null)}
          onSuccess={() => { }}
        />
      )}
    </div>
  );
}
