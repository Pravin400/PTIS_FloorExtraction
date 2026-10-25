'use client';

import { useState, useEffect, useTransition } from 'react';
import { FooterSelect } from './FooterSelect';
import { useTranslations } from 'next-intl';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleArrowLeft, Route } from 'lucide-react';
import { Tooltip, useConfirm } from '@/components/common';
import type { PropertyWorkflowStage } from '@/types/propertyWorkflowStage.types';
import { toast } from 'sonner';
import { savePropertyWorkflowStageAction } from '@/app/[locale]/property-tax/ptis/workflowStageActions';
import { PropertyTrackingModal } from './PropertyTrackingModal';

export function PtisBackButton() {
  const t = useTranslations('ptis');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resolvedSearchState, setResolvedSearchState] = useState<string | null>(null);

  useEffect(() => {
    const urlSearchState = searchParams.get('searchState');
    if (urlSearchState === 'clear') {
      sessionStorage.removeItem('ptis_search_state');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolvedSearchState(null);
    } else if (urlSearchState) {
      sessionStorage.setItem('ptis_search_state', urlSearchState);
      setResolvedSearchState(urlSearchState);
    } else {
      const cached = sessionStorage.getItem('ptis_search_state');
      if (cached) {
        setResolvedSearchState(cached);
      }
    }
  }, [searchParams]);

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'en';

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem('ptis_search_state');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to read ptis_search_state from sessionStorage:', err);
      }
    }
    const target = `/${locale}/property-tax/search-property${cached ? `?${cached}` : ''}`;
    router.push(target);
  };

  const targetUrl = `/${locale}/property-tax/search-property${
    resolvedSearchState ? `?${resolvedSearchState}` : ''
  }`;

  return (
    <Tooltip content={t('buttons.backToSearch') || 'Back to Search Property'} placement="top">
      <Link
        href={targetUrl}
        onClick={handleBackClick}
        className="h-8.5 md:h-9 w-8.5 md:w-9 inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50/70 text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100/50"
        aria-label={t('buttons.backToSearch') || 'Back to Search Property'}
      >
        <CircleArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
      </Link>
    </Tooltip>
  );
}

export function PtisFooterDropdowns({
  workflowStages = [],
  propertyId,
  currentWorkflowStageId,
  propertyNo,
  ownerName,
}: {
  workflowStages?: PropertyWorkflowStage[];
  propertyId?: number | string;
  currentWorkflowStageId?: number;
  propertyNo?: string;
  ownerName?: string;
}) {
  const t = useTranslations('ptis');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [qcStatus, setQcStatus] = useState(() => {
    if (currentWorkflowStageId && workflowStages.length > 0) {
      const activeStage = workflowStages.find((s) => s.id === currentWorkflowStageId);
      return activeStage ? activeStage.stageName : '';
    }
    return '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const [prevStageId, setPrevStageId] = useState(currentWorkflowStageId);
  const [prevStages, setPrevStages] = useState(workflowStages);

  if (currentWorkflowStageId !== prevStageId || workflowStages !== prevStages) {
    setPrevStageId(currentWorkflowStageId);
    setPrevStages(workflowStages);
    if (currentWorkflowStageId && workflowStages && workflowStages.length > 0) {
      const activeStage = workflowStages.find((s) => s.id === currentWorkflowStageId);
      if (activeStage) {
        setQcStatus(activeStage.stageName);
      }
    }
  }

  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'en';

  const POLICY_OPTIONS = [
    { label: t('footerControls.policy.options.old'), value: 'old' },
    { label: t('footerControls.policy.options.min_rv'), value: 'min_rv' },
    { label: t('footerControls.policy.options.mix'), value: 'mix' },
  ];

  const ACTION_OPTIONS = [
    { label: t('footerControls.action.options.apply'), value: 'apply' },
    { label: t('footerControls.action.options.remove_retention'), value: 'remove_retention' },
    { label: t('footerControls.action.options.remove_hearing'), value: 'remove_hearing' },
    {
      label: t('footerControls.action.options.remove_appeal_committee'),
      value: 'remove_appeal_committee',
    },
    { label: t('footerControls.action.options.remove_remission'), value: 'remove_remission' },
    { label: t('footerControls.action.options.remove_all_appeals'), value: 'remove_all_appeals' },
  ];

  const handleOpenStages = () => {
    if (searchParams.get('openStages') === 'true' || isPending) return;
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('openStages', 'true');
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    });
  };

  // Resolve mapping from workflow stages fetched via API
  const isCurrentlyLoading = isPending && workflowStages.length === 0;

  const QC_STATUS_OPTIONS = isCurrentlyLoading
    ? [{ label: 'Loading...', value: '', disabled: true }]
    : (workflowStages || [])
        .filter((s) => s.isActive)
        .map((stage) => ({
          label: stage.stageName,
          value: stage.stageName,
        }));

  const handleSaveWorkflowDetail = async (stageName: string, stageId: number) => {
    if (!propertyId) {
      toast.error(
        t('error.propertyIdMissing') ||
          'Property ID is missing. Please search and select a property first.'
      );
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Updating workflow status...');

    try {
      const result = await savePropertyWorkflowStageAction(propertyId, stageId, locale);
      if (result.success) {
        setQcStatus(stageName);
        toast.success('Workflow status updated successfully', { id: toastId });
      } else {
        toast.error(result.error || 'Failed to update workflow status', { id: toastId });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQcStatusChange = (val: string) => {
    if (!val) {
      setQcStatus('');
      return;
    }

    const selectedStage = workflowStages.find((s) => s.stageName === val);
    const workflowStageId = selectedStage?.id;

    if (val === 'QC Revert') {
      confirm({
        variant: 'warning',
        title: t('footerControls.qcRevertModal.title'),
        description: t('footerControls.qcRevertModal.description'),
        confirmText: t('footerControls.qcRevertModal.confirmText'),
        cancelText: t('footerControls.qcRevertModal.cancelText'),
        onConfirm: () => {
          if (workflowStageId) {
            handleSaveWorkflowDetail(val, workflowStageId);
          } else {
            setQcStatus('');
          }
        },
      });
      return;
    }

    confirm({
      variant: 'info',
      title: t('footerControls.statusChangeModal.title'),
      description: t('footerControls.statusChangeModal.description', { status: val }),
      confirmText: t('footerControls.statusChangeModal.confirmText'),
      cancelText: t('footerControls.statusChangeModal.cancelText'),
      onConfirm: () => {
        if (workflowStageId) {
          handleSaveWorkflowDetail(val, workflowStageId);
        } else {
          setQcStatus(val);
        }
      },
    });
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <FooterSelect
        label={t('footerControls.policy.label')}
        placeholder={t('footerControls.policy.placeholder')}
        value={selectedPolicy}
        onChange={setSelectedPolicy}
        options={POLICY_OPTIONS}
        className="w-[105px] sm:w-[130px] md:w-[145px] shrink-0"
      />

      <FooterSelect
        label={t('footerControls.action.label')}
        placeholder={t('footerControls.action.placeholder')}
        value={selectedAction}
        onChange={setSelectedAction}
        options={ACTION_OPTIONS}
        className="w-[115px] sm:w-[150px] md:w-[165px] shrink-0"
      />

      <FooterSelect
        label={t('footerControls.qcStatus.label')}
        placeholder={t('footerControls.qcStatus.placeholder')}
        value={qcStatus}
        onChange={handleQcStatusChange}
        options={QC_STATUS_OPTIONS}
        onOpen={handleOpenStages}
        className="w-[105px] sm:w-[130px] md:w-[145px] shrink-0"
        disabled={isSaving}
      />

      {(qcStatus === 'Assessment' || qcStatus === 'QC Done') && (
        <div className="flex items-center gap-1 px-2.5 h-8.5 md:h-9 bg-emerald-600 border border-emerald-700 text-white text-[10px] font-bold rounded-lg shrink-0 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-right-4">
          <span>✅ {t('footerControls.qcDoneLabel')}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsTrackingModalOpen(true);
        }}
        className="h-8.5 md:h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100/50 text-xs font-semibold"
      >
        <Route className="w-4 h-4" />
        {t('footerControls.trackStatus')}
      </button>

      <PropertyTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        propertyId={propertyId}
        propertyNo={propertyNo}
        ownerName={ownerName}
        workflowStages={workflowStages}
      />
    </div>
  );
}
