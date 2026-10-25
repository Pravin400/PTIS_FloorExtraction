'use client';

/**
 * Workbench Assign / Reassign Modal Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchAssignModal.tsx
 *
 * Dedicated modal to assign or reassign an officer and forward to departments.
 * Line ceiling: <= 220 lines.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Send, Loader2, Building2, User } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Modal, Button, SearchSelect, type SearchSelectOption } from '@/components/common';
import { getLocalizedEntityName } from '@/lib/utils/grievance';
import type {
  AdminGrievanceRecord,
  DepartmentOption,
  DepartmentOfficerOption,
} from '@/types/grievance/admin-complaints.types';
import {
  assignComplaintAction,
  forwardComplaintAction,
  fetchDepartmentOfficersAction,
} from '@/lib/actions/grievance/admin/admin-complaints.actions';

interface WorkbenchAssignModalProps {
  isOpen: boolean;
  complaint: AdminGrievanceRecord | null;
  departments: DepartmentOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkbenchAssignModal({
  isOpen,
  complaint,
  departments,
  onClose,
  onSuccess,
}: WorkbenchAssignModalProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const [prevComplaintId, setPrevComplaintId] = useState<number | null>(complaint?.id ?? null);
  const [targetDeptId, setTargetDeptId] = useState<number>(complaint?.departmentId || 0);
  const [assignedUserId, setAssignedUserId] = useState<number>(0);
  const [remark, setRemark] = useState<string>('');
  const [officers, setOfficers] = useState<DepartmentOfficerOption[]>([]);
  const [isLoadingOfficers, startOfficerTransition] = useTransition();

  const departmentOptions: SearchSelectOption[] = useMemo(() => {
    return departments.map((dept) => ({
      value: String(dept.id),
      label: `${getLocalizedEntityName(dept, locale)}${
        dept.id === complaint?.departmentId ? ` (${t('currentDeptTag')})` : ''
      }`,
    }));
  }, [departments, complaint?.departmentId, locale, t]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset local state when active complaint changes without cascading render effects
  if (complaint && complaint.id !== prevComplaintId) {
    setPrevComplaintId(complaint.id);
    setTargetDeptId(complaint.departmentId);
    setAssignedUserId(0);
    setRemark('');
    setErrorMsg(null);
  }

  // Load officers for selected target department using React transition
  useEffect(() => {
    let active = true;
    if (!targetDeptId || targetDeptId <= 0) {
      return;
    }
    startOfficerTransition(async () => {
      try {
        const res = await fetchDepartmentOfficersAction(targetDeptId);
        if (active && res.success && res.data) {
          setOfficers(res.data);
        } else if (active) {
          setOfficers([]);
        }
      } catch {
        if (active) setOfficers([]);
      }
    });
    return () => {
      active = false;
    };
  }, [targetDeptId]);

  const officerOptions: SearchSelectOption[] = useMemo(() => {
    const visible = targetDeptId > 0 && !isLoadingOfficers ? officers : [];
    return [
      { value: '0', label: t('selectOfficerOptional') },
      ...visible.map((off) => ({
        value: String(off.id),
        label: `${off.name}${off.designation ? ` (${off.designation})` : ''}`,
      })),
    ];
  }, [targetDeptId, officers, isLoadingOfficers, t]);

  if (!complaint) return null;

  const isDepartmentChanged = targetDeptId !== complaint.departmentId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
            updatePrimaryDepartment: true,
          });
        } else {
          res = await assignComplaintAction(complaint.id, {
            assignedToUserId: assignedUserId || 0,
            remark: remark.trim(),
          });
        }

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.message || t('assignFailed'));
        }
      } catch (err) {
        setErrorMsg((err as Error).message || t('assignFailed'));
      }
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 text-sm sm:text-base">
            {t('assignModalTitle')}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
            {complaint.grievanceNo}
          </span>
        </div>
      }
      subtitle={t('assignModalSubtitle')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 1. Target Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('targetDepartment')}</span>
            <span className="text-rose-500">*</span>
          </label>
          <SearchSelect
            id="workbench-assign-dept"
            name="targetDepartment"
            options={departmentOptions}
            value={targetDeptId > 0 ? String(targetDeptId) : ''}
            onChange={(_name, val) => {
              setOfficers([]);
              setTargetDeptId(Number(val));
              setAssignedUserId(0);
            }}
            placeholder={t('selectDepartmentPlaceholder')}
            disabled={isPending}
            className="text-xs h-10 rounded-xl border-slate-300"
          />
        </div>

        {/* 2. Target Officer */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('targetOfficer')}</span>
            </span>
            {isLoadingOfficers && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </label>
          <SearchSelect
            id="workbench-assign-officer"
            name="targetOfficer"
            options={officerOptions}
            value={assignedUserId > 0 ? String(assignedUserId) : '0'}
            onChange={(_name, val) => setAssignedUserId(Number(val))}
            placeholder={t('selectOfficerOptional')}
            disabled={isPending || isLoadingOfficers}
            className="text-xs h-10 rounded-xl border-slate-300"
          />
        </div>

        {/* 3. Action Remark */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            {t('forwardRemark')} <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={isPending}
            placeholder={t('forwardRemarkPlaceholder')}
            className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
            icon={isPending ? Loader2 : Send}
            className="bg-[#0B4D36] hover:bg-emerald-900 border-[#0B4D36]"
          >
            {isPending ? t('assigning') : t('actionAssign')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
