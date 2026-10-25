'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { DocumentViewerModal } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { DiscountHeader } from './discount/DiscountHeader';
import { DiscountCard } from './discount/DiscountCard';
import { useDiscountDataTab } from './discount/useDiscountDataTab';
import { getItemLevel } from './discount/discount-tab-helpers';
import type { DiscountDataTabProps } from './discount/types';

export { getItemLevel };
export type { DiscountDataTabProps };

const DiscountDataTab: React.FC<DiscountDataTabProps> = (props) => {
  const {
    isExpanded: propIsExpanded,
    onToggleExpand,
    showHeader = true,
    className,
    propertyNo,
    wingName,
    societyDetailId,
    wingDetailsId,
  } = props;

  const t = useTranslations('ptis');
  const tTable = useTranslations('ptisRedesign.discountTable');

  const [internalExpanded, setInternalExpanded] = useState<boolean>(true);
  const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalExpanded;
  const toggleExpand = useCallback(() => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [onToggleExpand]);

  const {
    isApartmentScreen,
    activeSubTab,
    setActiveSubTab,
    selectedLevel,
    setSelectedLevel,
    activeViewingKey,
    activeEditingKey,
    viewerData,
    closeViewer,
    discountCount,
    socialCount,
    levelCounts,
    displayedItems,
    handleViewDocument,
    handleEditInQDE,
  } = useDiscountDataTab(props);

  return (
    <div className={cn('w-full flex flex-col font-sans transition-all space-y-2', className)}>
      {/* 1. Header Toolbar with Sub-Tabs, Scope Pills, and Edit Button */}
      {showHeader && (
        <DiscountHeader
          activeSubTab={activeSubTab}
          onSubTabChange={(tab) => {
            setActiveSubTab(tab);
            if (!isExpanded) toggleExpand();
          }}
          discountCount={discountCount}
          socialCount={socialCount}
          selectedLevel={selectedLevel}
          onLevelSelect={setSelectedLevel}
          levelCounts={levelCounts}
          isApartmentScreen={isApartmentScreen}
          hasSocDetail={Boolean(societyDetailId && Number(societyDetailId) > 0)}
          hasWingDetail={Boolean(wingDetailsId && Number(wingDetailsId) > 0)}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          onEdit={() => handleEditInQDE()}
          isEditing={activeEditingKey === 'edit-all'}
        />
      )}

      {/* 2. Collapsible Cards Container */}
      {isExpanded && (
        <div className="w-full">
          {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 gap-2">
              <AlertCircle className="w-7 h-7 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">
                {t('noDataAvailable') || 'No data available for this section'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                {tTable('noData') || 'No discount or social details configured yet.'}
              </p>
            </div>
          ) : (
            <div
              data-testid="discount-social-cards-container"
              className="w-full overflow-y-auto max-h-[360px] rounded-xl custom-scrollbar p-0.5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {displayedItems.map((item, index) => {
                  const rowKey = String(
                    item.id
                      ? `id-${item.id}`
                      : `attr-${item.socialAttributeId}-prop-${item.propertyId}-wing-${item.wingDetailId || 0}-${index}`
                  );
                  return (
                    <DiscountCard
                      key={rowKey}
                      item={item}
                      rowKey={rowKey}
                      index={index}
                      isViewingThis={activeViewingKey === rowKey}
                      isEditingThis={activeEditingKey === rowKey}
                      propertyNo={propertyNo}
                      wingName={wingName}
                      isApartmentScreen={isApartmentScreen}
                      onViewDocument={handleViewDocument}
                      onEdit={handleEditInQDE}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Document Viewer Modal */}
      {viewerData && (
        <DocumentViewerModal
          isOpen={viewerData.isOpen}
          onClose={closeViewer}
          fileUrl={viewerData.url}
          fileName={viewerData.name}
          label={viewerData.label}
          contentType={viewerData.contentType}
        />
      )}
    </div>
  );
};

export default DiscountDataTab;
