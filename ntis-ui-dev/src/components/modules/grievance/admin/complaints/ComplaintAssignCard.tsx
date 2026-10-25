'use client';

/**
 * Complaint Assign & Forward Card
 * Path: src/components/modules/grievance/admin/complaints/ComplaintAssignCard.tsx
 *
 * Dedicated sub-component for reassigning / forwarding complaints to departments and officers.
 * Line ceiling: <= 250 lines.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Building2, Send, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button, SearchSelect, type SearchSelectOption } from '@/components/common';
import type {
  AdminGrievanceRecord,
  DepartmentOption,
  DepartmentOfficerOption,
} from '@/types/grievance/admin-complaints.types';
import {
  forwardComplaintAction,
  assignComplaintAction,
  fetchDepartmentOfficersAction,
} from '@/lib/actions/grievance/admin/admin-complaints.actions';

interface ComplaintAssignCardProps {
  complaint: AdminGrievanceRecord;
  departments: DepartmentOption[];
  onSuccess?: () => void;
}

export function ComplaintAssignCard({
  complaint,
  departments,
  onSuccess,
}: ComplaintAssignCardProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const [targetDeptId, setTargetDeptId] = useState<number>(complaint.departmentId || 0);
  const [assignedUserId, setAssignedUserId] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [updatePrimary, setUpdatePrimary] = useState<boolean>(true);

  const [officers, setOfficers] = useState<DepartmentOfficerOption[]>([]);
  const [loadedDeptId, setLoadedDeptId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isLoadingOfficers = targetDeptId > 0 && loadedDeptId !== targetDeptId;

  // SearchSelect department options with current dept indicator
  const departmentOptions: SearchSelectOption[] = useMemo(() => {
    return departments.map((dept) => ({
      value: String(dept.id),
      label: `${locale === 'mr' && dept.nameMr ? dept.nameMr : dept.nameEn}${
        dept.id === complaint.departmentId ? ` (${t('currentDeptTag')})` : ''
      }`,
    }));
  }, [departments, complaint.departmentId, locale, t]);

  // SearchSelect officer options
  const officerOptions: SearchSelectOption[] = useMemo(() => {
    return [
      { value: '0', label: t('selectOfficerOptional') },
      ...officers.map((off) => ({
        value: String(off.id),
        label: `${off.name}${off.designation ? ` (${off.designation})` : ''}`,
      })),
    ];
  }, [officers, t]);

  // Load officers whenever target department changes
  useEffect(() => {
    if (targetDeptId <= 0) return;

    let active = true;
    fetchDepartmentOfficersAction(targetDeptId)
      .then((res) => {
        if (active && res.success && res.data) {
          setOfficers(res.data);
        }
      })
      .finally(() => {
        if (active) {
          setLoadedDeptId(targetDeptId);
        }
      });

    return () => {
      active = false;
    };
  }, [targetDeptId]);

  const isDepartmentChanged = targetDeptId !== complaint.departmentId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!targetDeptId || targetDeptId <= 0) {
      setErrorMsg(t('departmentRequired'));
      return;
    }
    if (!remark.trim()) {
      setErrorMsg(t('remarkRequired'));
      return;
    }

    startTransition(async () => {
      try {
        let res;
        if (isDepartmentChanged) {
          res = await forwardComplaintAction(complaint.id, {
            forwardedToDeptId: targetDeptId,
            assignedToUserId: assignedUserId || 0,
            remark: remark.trim(),
            updatePrimaryDepartment: updatePrimary,
          });
        } else {
          res = await assignComplaintAction(complaint.id, {
            assignedToUserId: assignedUserId || 0,
            remark: remark.trim(),
          });
        }

        if (res.success) {
          setSuccessMsg(t('assignSuccessToast'));
          setRemark('');
          if (onSuccess) {
            setTimeout(() => onSuccess(), 800);
          }
        } else {
          setErrorMsg(res.message || t('assignFailed'));
        }
      } catch (err) {
        setErrorMsg((err as Error).message || t('assignFailed'));
      }
    });
  };

  return (
    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t('assignDepartmentTitle')}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('assignDepartmentSubtitle')}
            </p>
          </div>
        </div>
        {isDepartmentChanged && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ArrowRight className="w-3 h-3" />
            {t('forwardingDeptBadge')}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Department Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('targetDepartment')}</span> <span className="text-rose-500">*</span>
            </label>
            <SearchSelect
              id="assign-target-dept-select"
              name="targetDepartment"
              options={departmentOptions}
              value={targetDeptId > 0 ? String(targetDeptId) : ''}
              onChange={(_name, val) => {
                const newDeptId = Number(val);
                setTargetDeptId(newDeptId);
                setAssignedUserId(0);
                if (newDeptId <= 0) {
                  setOfficers([]);
                  setLoadedDeptId(0);
                }
              }}
              placeholder={t('selectDepartmentPlaceholder')}
              disabled={isPending}
              className="text-xs h-9 rounded-lg border-slate-300"
            />
          </div>

          {/* Assigned Officer Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{t('targetOfficer')}</span>
              {isLoadingOfficers && (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              )}
            </label>
            <SearchSelect
              id="assign-target-officer-select"
              name="targetOfficer"
              options={officerOptions}
              value={assignedUserId > 0 ? String(assignedUserId) : '0'}
              onChange={(_name, val) => setAssignedUserId(Number(val))}
              placeholder={t('selectOfficerOptional')}
              disabled={isPending || isLoadingOfficers}
              className="text-xs h-9 rounded-lg border-slate-300"
            />
          </div>
        </div>

        {/* Remark / Action Note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {t('forwardRemark')} <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={isPending}
            placeholder={t('forwardRemarkPlaceholder')}
            className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {/* Primary Department Toggle for Inter-Department Forwarding */}
        {isDepartmentChanged && (
          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={updatePrimary}
              onChange={(e) => setUpdatePrimary(e.target.checked)}
              disabled={isPending}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs text-slate-600 font-medium">
              {t('updatePrimaryDepartmentLabel')}
            </span>
          </label>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isPending}
            icon={isPending ? Loader2 : Send}
            className="h-8 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {isPending ? t('assigning') : t('assignAndForwardBtn')}
          </Button>
        </div>
      </form>
    </div>
  );
}
