'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { savePropertyWorkflowStageAction } from '@/app/[locale]/property-tax/ptis/workflowStageActions';
import type { PropertyWorkflowStage } from '@/types/propertyWorkflowStage.types';
import { Tooltip, useConfirm } from '@/components/common';
import { DynamicIcon } from './FooterIconRegistry';
import { cn } from '@/lib/utils/cn';
import { ShieldCheck, MapPinned, FileStack, Landmark } from 'lucide-react';

interface QCDropdownButtonProps {
  workflowStages: PropertyWorkflowStage[];
  currentWorkflowStageId?: number;
  buttonClasses: string;
  iconClasses: string;
  isLoading: boolean;
  localizedButtonName: string;
  iconName?: string;
}

const OPTIONS = [
  {
    label: 'QC Done',
    searchPattern: ['assessment', 'qc done', 'qc'],
    title: 'QC Done',
    icon: ShieldCheck,
  },
  {
    label: 'sent to spot',
    searchPattern: ['internalsurvey', 'geosequencing', 'spot'],
    title: 'Sent to Spot',
    icon: MapPinned,
  },
  {
    label: 'sent to verification',
    searchPattern: ['assessment', 'approvalbyulb'],
    title: 'Sent to Verification',
    icon: FileStack,
  },
  {
    label: 'sent to ULB',
    searchPattern: ['approvalbyulb', 'ulb'],
    title: 'Sent to ULB',
    icon: Landmark,
  },
];

export function QCDropdownButton({
  workflowStages,
  currentWorkflowStageId,
  buttonClasses,
  iconClasses,
  isLoading,
  localizedButtonName,
  iconName,
}: QCDropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useConfirm();

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const toggleOpen = () => {
    if (isLoading || isSaving) return;
    if (!open) {
      updateCoords();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { capture: true });
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, { capture: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const findStage = useMemo(() => {
    const lookup = (patterns: string[]) => {
      for (const pattern of patterns) {
        const found = workflowStages.find(s =>
          s.stageName.toLowerCase().trim() === pattern.toLowerCase().trim() ||
          s.stageName.toLowerCase().includes(pattern.toLowerCase())
        );
        if (found) return found;
      }
      return null;
    };
    return lookup;
  }, [workflowStages]);

  const handleSelect = (optLabel: string) => {
    setOpen(false);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      toast.error('Property ID is missing. Please select/search for a property first.');
      return;
    }

    confirm({
      variant: 'warning',
      title: 'Confirm Workflow Action',
      description: `Are you sure you want to perform "${optLabel}"? This will update the property workflow status.`,
      confirmText: 'Yes, Proceed',
      cancelText: 'Cancel',
      onConfirm: () => executeSelect(optLabel, propertyId),
    });
  };

  const executeSelect = async (optLabel: string, propertyId: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'en';

    setIsSaving(true);

    if (optLabel === 'sent to verification') {
      const assessmentStage = findStage(['Assessment', 'QC Done']);
      const ulbStage = findStage(['ApprovalByULB', 'ULB']);

      if (!assessmentStage || !ulbStage) {
        toast.error('Required workflow stages ("Assessment" or "ApprovalByULB") are not configured on the server.');
        setIsSaving(false);
        return;
      }

      const toastId = toast.loading('Sending to verification (updating Assessment & ULB)...');
      try {
        const res1 = await savePropertyWorkflowStageAction(Number(propertyId), assessmentStage.id, locale);
        if (!res1.success) {
          toast.error(res1.error || 'Failed to update to Assessment status', { id: toastId });
          setIsSaving(false);
          return;
        }

        const res2 = await savePropertyWorkflowStageAction(Number(propertyId), ulbStage.id, locale);
        if (res2.success) {
          toast.success('Successfully sent to verification (updated to Assessment and ApprovalByULB)', { id: toastId });
        } else {
          toast.error(res2.error || 'Failed to update to ULB status', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
        toast.error(msg, { id: toastId });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    let targetStage = null;
    if (optLabel === 'QC Done') {
      targetStage = findStage(['Assessment', 'QC Done']);
    } else if (optLabel === 'sent to ULB') {
      targetStage = findStage(['ApprovalByULB', 'ULB']);
    } else if (optLabel === 'sent to spot') {
      targetStage = findStage(['InternalSurvey', 'GeoSequencing', 'spot']);
    }

    if (!targetStage) {
      toast.error(`Workflow stage for "${optLabel}" is not configured on the server.`);
      setIsSaving(false);
      return;
    }

    const toastId = toast.loading(`Updating status to "${optLabel}"...`);
    try {
      const result = await savePropertyWorkflowStageAction(Number(propertyId), targetStage.id, locale);
      if (result.success) {
        toast.success(`Workflow status updated to "${optLabel}" successfully`, { id: toastId });
      } else {
        toast.error(result.error || `Failed to update status to "${optLabel}"`, { id: toastId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const optionsWithStatus = useMemo(() => {
    const activeStage = currentWorkflowStageId
      ? workflowStages.find((s) => s.id === currentWorkflowStageId)
      : null;

    const spotStage = findStage(['InternalSurvey', 'GeoSequencing', 'spot']);
    const qcStage = findStage(['Assessment', 'QC Done']);
    const ulbStage = findStage(['ApprovalByULB', 'ULB']);

    return OPTIONS.map((opt) => {
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

      if (!activeStage || !workflowStages || workflowStages.length === 0) {
        if (opt.label === 'sent to spot') status = 'completed';
        else if (opt.label === 'QC Done') status = 'current';
      } else {
        if (opt.label === 'sent to spot') {
          if (spotStage) {
            status = spotStage.id === activeStage.id ? 'current' : (spotStage.displayOrder < activeStage.displayOrder ? 'completed' : 'upcoming');
          }
        } else if (opt.label === 'QC Done') {
          if (qcStage) {
            status = qcStage.id === activeStage.id ? 'current' : (qcStage.displayOrder < activeStage.displayOrder ? 'completed' : 'upcoming');
          }
        } else if (opt.label === 'sent to ULB') {
          if (ulbStage) {
            status = ulbStage.id === activeStage.id ? 'current' : (ulbStage.displayOrder < activeStage.displayOrder ? 'completed' : 'upcoming');
          }
        } else if (opt.label === 'sent to verification') {
          if (qcStage && ulbStage) {
            if (activeStage.displayOrder < qcStage.displayOrder) status = 'upcoming';
            else if (activeStage.displayOrder > ulbStage.displayOrder) status = 'completed';
            else status = 'current';
          }
        }
      }

      return { ...opt, status };
    });
  }, [workflowStages, currentWorkflowStageId, findStage]);

  const dropdownWidth = 200;
  const leftPos = coords
    ? Math.max(8, Math.min(typeof window !== 'undefined' ? window.innerWidth - dropdownWidth - 8 : 0, coords.left + coords.width / 2 - dropdownWidth / 2))
    : 0;

  return (
    <>
      <Tooltip
        content={
          <div className="flex flex-col gap-0.5 pointer-events-none">
            <span className="font-bold text-[11px] text-white">
              {localizedButtonName}
            </span>
          </div>
        }
        placement="top"
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          disabled={isLoading || isSaving}
          className={cn(
            buttonClasses,
            open && "border-blue-500 ring-4 ring-blue-50/50"
          )}
          aria-label={localizedButtonName}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-full group">
            {iconName && (
              <DynamicIcon
                name={iconName}
                size={16}
                className={iconClasses}
              />
            )}
          </span>
        </button>
      </Tooltip>

      {open && coords && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          className="fixed z-[9999] p-[1px] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-[14px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 w-[200px]"
          style={{
            bottom: `${window.innerHeight - coords.top + 8}px`,
            left: `${leftPos}px`,
          }}
        >
          <div className="bg-white rounded-[13px] overflow-hidden py-1">
            <ul className="divide-y divide-slate-50">
              {optionsWithStatus.map((opt) => {
                const { status, icon: IconComponent } = opt;

                let iconColorClass = 'text-slate-400';
                let iconBgClass = 'bg-slate-50';
                if (status === 'completed') {
                  iconColorClass = 'text-emerald-600';
                  iconBgClass = 'bg-emerald-50';
                } else if (status === 'current') {
                  iconColorClass = 'text-blue-600';
                  iconBgClass = 'bg-blue-50';
                }

                return (
                  <li
                    key={opt.label}
                    role="option"
                    aria-selected={status === 'current'}
                    tabIndex={0}
                    onClick={() => handleSelect(opt.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(opt.label);
                      }
                    }}
                    className="flex items-center gap-3 py-2.5 px-3.5 cursor-pointer border-l-4 border-l-transparent hover:border-l-[#2563EB] hover:bg-[#F3F8FF] focus:border-l-[#2563EB] focus:bg-[#F3F8FF] focus:outline-none transition-all duration-200"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", iconBgClass)}>
                      <IconComponent className={cn("w-4 h-4", iconColorClass)} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-800 text-[12px] leading-tight">
                        {opt.title}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
