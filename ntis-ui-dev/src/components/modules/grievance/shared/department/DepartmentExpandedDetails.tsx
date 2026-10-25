'use client';

import { useTranslations } from 'next-intl';
import {
  ChevronUp,
  FileText,
  Building2,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/common/ActionButton';
import type { MunicipalDepartment } from '@/types/grievance';

interface DepartmentExpandedDetailsProps {
  dept: MunicipalDepartment;
  theme: { icon: string; bg: string };
  onCollapse: () => void;
  onFileGrievance?: (dept: MunicipalDepartment) => void;
  onSelectDepartment?: (dept: MunicipalDepartment) => void;
}

export function DepartmentExpandedDetails({
  dept,
  theme,
  onCollapse,
  onFileGrievance,
  onSelectDepartment,
}: DepartmentExpandedDetailsProps) {
  const t = useTranslations('grievance');
  const displayName = dept.nameEn;

  const handleFileAction = () => {
    onSelectDepartment?.(dept);
    onFileGrievance?.(dept);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg ring-4 ring-emerald-500/10 overflow-hidden transition-all duration-300 animate-in fade-in-50">
      {/* 1. Gradient Header */}
      <div
        onClick={onCollapse}
        className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white border-b border-emerald-100 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-2xs border ${theme.bg}`}
          >
            <span>{dept.icon || theme.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {displayName}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {t('departmentFrameworkSubtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          title="Collapse Department"
        >
          <ChevronUp className="w-4 h-4 text-emerald-700" />
        </button>
      </div>

      {/* 2. Main Content Body */}
      <div className="p-3.5 sm:p-4 space-y-3.5 bg-white text-xs">
        {/* Contact Strip */}
        {(dept.hod || dept.phone || dept.email) && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            {dept.hod && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-400 font-normal">{t('hodLabel')}:</span> {dept.hod}
              </span>
            )}
            {dept.phone && (
              <a
                href={`tel:${dept.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors font-semibold"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{dept.phone}</span>
              </a>
            )}
            {dept.email && (
              <a
                href={`mailto:${dept.email}`}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors font-medium text-slate-500"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{dept.email}</span>
              </a>
            )}
          </div>
        )}

        {/* Sub-Offices */}
        {dept.subOffices.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{t('subDivisionsLabel')} ({dept.subOffices.length})</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dept.subOffices.map((sub, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10.5px] text-slate-700 font-medium transition-colors"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grievance Types */}
        {dept.grievanceTypes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-500" />
              <span>{t('commonComplaintsLabel')} ({dept.grievanceTypes.length})</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dept.grievanceTypes.map((g, gIdx) => (
                <span
                  key={gIdx}
                  className="px-2.5 py-1 rounded-lg bg-amber-50/80 text-amber-900 border border-amber-200/80 text-[10.5px] font-semibold"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostic Fields */}
        {dept.fields.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-600" />
              <span>{t('diagnosticFieldsLabel')} ({dept.fields.length})</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dept.fields.map((fld, fIdx) => (
                <div
                  key={fIdx}
                  className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/90 space-y-1 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {fld.key}
                    </span>
                    {fld.required && (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded">
                        {t('fieldRequired')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-snug">
                    {fld.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Action Footer */}
        <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onCollapse}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← {t('closeDetails')}
          </button>

          <Button
            variant="success"
            size="sm"
            icon={CheckCircle2}
            onClick={handleFileAction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs hover:shadow-emerald-200 active:scale-[0.98] transition-all px-4 py-2 rounded-xl"
          >
            {t('fileGrievanceForDept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
