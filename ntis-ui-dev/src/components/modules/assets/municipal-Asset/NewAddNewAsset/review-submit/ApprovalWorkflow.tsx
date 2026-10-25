import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { User, FileBadge, Tag, UserCheck, ArrowRight, Check } from 'lucide-react';
import type { ApprovalStepItem, ApprovalWorkflowProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function ApprovalWorkflow({ currentStage, workflowStages, assetStatus }: ApprovalWorkflowProps = {}) {
  const t = useTranslations('newAddNewAsset.review');

  const normalizedStatus = String(assetStatus || '').toUpperCase();
  const normalizedStage = typeof currentStage === 'number'
    ? currentStage
    : String(currentStage || '').toUpperCase();

  let activeIndex = 0;
  let isFullyApproved = false;

  if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'APPROVED' || normalizedStage === 'FINAL' || normalizedStage === 'APPROVED') {
    activeIndex = 3;
    isFullyApproved = true;
  } else if (normalizedStatus === 'FINANCE_APPROVAL' || normalizedStage === 3 || normalizedStage === 'FINANCE') {
    activeIndex = 2;
  } else if (normalizedStatus === 'VERIFICATION' || normalizedStatus === 'DEPARTMENT_VERIFIER' || normalizedStage === 2 || normalizedStage === 'VERIFICATION') {
    activeIndex = 1;
  } else {
    activeIndex = 0;
  }

  const baseSteps: ApprovalStepItem[] = workflowStages && workflowStages.length > 0
    ? workflowStages
    : [
        {
          id: 1,
          label: t('dataEntry'),
          sublabel: t('you'),
          icon: User,
        },
        {
          id: 2,
          label: t('department'),
          sublabel: t('verifier'),
          icon: FileBadge,
        },
        {
          id: 3,
          label: t('finance'),
          sublabel: t('approval'),
          icon: Tag,
        },
        {
          id: 4,
          label: t('final'),
          sublabel: t('approval'),
          icon: UserCheck,
        },
      ];

  const steps = baseSteps.map((step, index) => {
    const isCompleted = isFullyApproved || index < activeIndex;
    const isActive = !isFullyApproved && index === activeIndex;
    const isUpcoming = !isFullyApproved && index > activeIndex;

    const color = isCompleted
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : isActive
        ? 'bg-blue-50 text-blue-600 border-blue-300'
        : 'bg-slate-50 text-slate-400 border-slate-200';

    return {
      ...step,
      isCompleted,
      active: isActive,
      isUpcoming,
      color: step.color || color,
      icon: step.icon || User,
    };
  });

  const statusNote = isFullyApproved
    ? t('statusActiveApproved')
    : activeIndex > 0
      ? t('statusInVerification', { stage: activeIndex + 1, total: steps.length })
      : t('standardWorkflowNote');

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[14px] font-black text-[#101b87]">{t('approvalWorkflow')}</h3>
        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
          {statusNote}
        </span>
      </div>
      
      <div className="flex items-start justify-between pb-6 px-2 relative">
        {steps.map((step, index) => {
          const Icon = step.icon || User;
          return (
            <Fragment key={step.id}>
              {/* Step */}
              <div className="relative flex flex-col items-center gap-2.5 z-10">
                <div className="relative">
                  <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center border ${step.color}`}>
                    {step.isCompleted ? (
                      <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={2.5} />
                    )}
                  </div>
                  {step.active && (
                    <div className="absolute -inset-1.5 rounded-full border-2 border-blue-500 animate-pulse"></div>
                  )}
                </div>
                <div className="text-center mt-1">
                  <p className="text-[11px] font-black text-[#101b87]">{step.label}</p>
                  <p className="text-[10px] font-bold text-[#2d42db]">{step.sublabel}</p>
                </div>
                {step.active && (
                  <div className="absolute -bottom-7 flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mb-0.5" />
                    <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">{t('youAreHere')}</span>
                  </div>
                )}
                {step.isCompleted && (
                  <div className="absolute -bottom-7 flex flex-col items-center">
                    <span className="text-[10px] font-medium text-emerald-600 whitespace-nowrap">{t('completed') || 'Completed'}</span>
                  </div>
                )}
              </div>

              {/* Arrow separator (if not last) */}
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center pt-5">
                  <div className="w-full flex items-center justify-center text-slate-300">
                    <div className={`h-px w-full max-w-[40px] ${step.isCompleted ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
                    <ArrowRight className={`w-4 h-4 -ml-1 ${step.isCompleted ? 'text-emerald-400' : 'text-slate-300'}`} />
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
