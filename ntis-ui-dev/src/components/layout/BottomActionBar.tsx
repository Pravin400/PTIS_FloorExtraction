'use client';

import { useTransition, Fragment } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FooterAction } from '@/lib/api/footer.service';
import { FooterPagination } from './FooterPagination';
import { UtilityActions, RightActions } from './FooterActionButtons';
import { useFooterActions, type FooterActionOverrides } from '@/hooks/layout/useFooterActions';
import type { PropertyListItem } from '@/types/ptis.types';
import type { PropertyWorkflowStage } from '@/types/propertyWorkflowStage.types';
import {
  useOptionalPtisNavigation,
  getTargetPropertyRoute,
  cleanParamsForTargetProperty,
} from '@/components/modules/property-tax/ptis/shared/PtisNavigationContext';
import { useFooterActionHandler } from '@/hooks/layout/useFooterActionHandler';

interface BottomActionBarProps {
  actions?: FooterAction[];
  actionOverrides?: FooterActionOverrides;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onAction?: (command: string) => void;
  isLoading?: boolean;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  properties?: PropertyListItem[];
  categoryId?: number;
  categoryName?: string;
  partitionNo?: string;
  societyDetailId?: number;
  wingDetailId?: number;
  isCombined?: boolean;
  workflowStages?: PropertyWorkflowStage[];
  currentWorkflowStageId?: number;
}

export function BottomActionBar({
  actions = [],
  actionOverrides,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onAction,
  isLoading = false,
  leftContent,
  centerContent,
  rightContent,
  properties = [],
  categoryId,
  categoryName,
  partitionNo,
  societyDetailId,
  wingDetailId,
  isCombined = false,
  workflowStages = [],
  currentWorkflowStageId,
}: BottomActionBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startPaginationTransition] = useTransition();

  const ptisNav = useOptionalPtisNavigation();
  const { handleActionClick, isPending: isActionPending, clickedCommand } = useFooterActionHandler(
    onAction,
    categoryId,
    societyDetailId,
    categoryName,
    wingDetailId
  );

  // Apply show/hide logic for "Apply Taxes" button:
  // If Partition No. is available AND Category = Apartment, show "Apply Taxes".
  // If Partition No. is not available AND Category = Apartment, do not show "Apply Taxes".
  const isApartment =
    categoryId === 1 ||
    categoryId === 0 ||
    String(categoryName || '').toLowerCase().includes('apartment');

  const resolvedPartition = partitionNo ?? searchParams.get('partitionNo') ?? '';
  const hasPartitionNo = Boolean(
    resolvedPartition &&
    resolvedPartition !== '0' &&
    resolvedPartition.trim() !== '' &&
    resolvedPartition.trim() !== '-'
  );

  const effectiveOverrides: FooterActionOverrides = {
    ...actionOverrides,
    ...(isApartment
      ? {
          PTIS_APPLY: {
            ...actionOverrides?.PTIS_APPLY,
            canView: hasPartitionNo,
          },
          PTIS_APPLICABLE_TAXES_INFO: {
            ...actionOverrides?.PTIS_APPLICABLE_TAXES_INFO,
            canView: hasPartitionNo,
          },
        }
      : {}),
  };

  const groupedActions = useFooterActions(actions, effectiveOverrides);

  // Check if properties array is present
  const hasProperties = properties.length > 0;

  // Resolve pagination state either from our optimized context or fallback parameters
  let resolvedCurrentPage = currentPage;
  let resolvedTotalPages = totalPages;
  let handlePageChange = onPageChange;
  let isPaginationPending = false;

  if (ptisNav) {
    resolvedCurrentPage = ptisNav.currentPage;
    resolvedTotalPages = ptisNav.totalPages;
    handlePageChange = ptisNav.navigateToPage;
    isPaginationPending = ptisNav.isPending;
  } else {
    // Fallback standard pagination logic
    const rawPropId = searchParams.get('propertyId');
    const rawPropNo = searchParams.get('propertyNo');
    const rawPartNo = searchParams.get('partitionNo');
    const activePropertyId = rawPropId ? Number(rawPropId) : null;
    let activeIndex = -1;
    if (activePropertyId && hasProperties) {
      activeIndex = properties.findIndex((p) => p.propertyId === activePropertyId);
    }
    if (activeIndex === -1 && rawPropNo && hasProperties) {
      activeIndex = properties.findIndex((p) => {
        const matchesNo = String(p.propertyNo).trim().toLowerCase() === String(rawPropNo).trim().toLowerCase();
        if (!matchesNo) return false;
        if (rawPartNo && rawPartNo !== '0' && rawPartNo !== '') {
          return String(p.partitionNo ?? '0').trim().toLowerCase() === String(rawPartNo).trim().toLowerCase();
        }
        return true;
      });
    }

    resolvedCurrentPage = hasProperties
      ? (activeIndex !== -1 ? activeIndex + 1 : 1)
      : currentPage;
    resolvedTotalPages = hasProperties ? properties.length : totalPages;

    handlePageChange = onPageChange || ((page: number) => {
      if (hasProperties) {
        const targetProperty = properties[page - 1];
        if (targetProperty) {
          const targetPath = getTargetPropertyRoute(targetProperty, pathname);
          const newParams = cleanParamsForTargetProperty(searchParams, targetProperty);
          startPaginationTransition(() => {
            router.replace(`${targetPath}?${newParams.toString()}`, { scroll: false });
          });
          return;
        }
      }
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('pageNumber', String(page));
      startPaginationTransition(() => {
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      });
    });
  }

  const isPaginationDisabled = !hasProperties || resolvedTotalPages <= 1;
  const isPropertySelected = Boolean(
    searchParams.get('propertyId') ||
    searchParams.get('propertyNo') ||
    (hasProperties && resolvedCurrentPage > 0)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[50] h-auto min-h-[48px] md:h-14 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-8px_40px_rgb(0,0,0,0.06)] print:hidden transition-all duration-300 layout-content-shifted flex flex-col md:flex-row items-stretch md:items-center justify-between px-3 sm:px-6 py-2 md:py-0">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

      <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 md:gap-3 shrink-0">
          <FooterPagination
            currentPage={resolvedCurrentPage}
            totalPages={resolvedTotalPages}
            onPageChange={handlePageChange}
            leftContent={leftContent}
            isPropertyPagination={hasProperties}
            isLoading={isPaginationPending || isLoading}
            disabled={isPaginationDisabled}
            isPropertySelected={isPropertySelected}
          />
        </div>

        <div className="w-full md:flex-1 flex items-center justify-between md:justify-end gap-2 md:gap-4 min-w-0">
          <div className="relative flex-1 min-w-0 flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/95 to-transparent pointer-events-none z-10" />
            <div className="flex-1 flex items-center justify-start md:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar px-2 min-w-0">
              <UtilityActions
                actions={groupedActions.utility}
                onActionClick={handleActionClick}
                isLoading={isLoading || isPaginationPending}
                isActionPending={isActionPending}
                clickedCommand={clickedCommand}
                isCombined={isCombined}
                workflowStages={workflowStages}
                currentWorkflowStageId={currentWorkflowStageId}
              />
              {centerContent && <Fragment key="center-content-wrapper">{centerContent}</Fragment>}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-white/95 to-transparent pointer-events-none z-10" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-2 border-l border-slate-100 md:border-l-0 md:pl-0">
            <RightActions
              actions={groupedActions.right}
              onActionClick={handleActionClick}
              isLoading={isLoading || isPaginationPending}
              isActionPending={isActionPending}
              clickedCommand={clickedCommand}
              iconOnly={true}
            />
            {rightContent && <Fragment key="right-content-wrapper">{rightContent}</Fragment>}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
