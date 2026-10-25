'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentViewerModal } from '@/components/common';
import type { BuildingPermissionTabProps } from './building-permission/types';
import { useBuildingPermissionTab } from './building-permission/useBuildingPermissionTab';
import { BuildingPermissionTabHeader } from './building-permission/BuildingPermissionTabHeader';
import { BuildingPermissionTabCard } from './building-permission/BuildingPermissionTabCard';
import { BuildingPermissionSkeleton } from '../apartment/building-permission/BuildingPermissionSkeleton';

export type { BuildingPermissionTabProps };

export const BuildingPermissionTab: React.FC<BuildingPermissionTabProps> = ({
  data,
  propertyId,
  wardNo,
  wardId,
  propertyNo,
  partitionNo,
  societyDetailId,
  categoryId,
  isExpanded = false,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const t = useTranslations('ptis');

  const {
    items,
    displayedItems,
    activeViewingKey,
    activeEditingKey,
    copiedKey,
    selectedCertType,
    setSelectedCertType,
    certificateTypeOptions,
    viewerData,
    closeViewer,
    handleCopyNumber,
    handleViewDocument,
    handleEditCertificate,
    handleToolbarEdit,
  } = useBuildingPermissionTab({
    data,
    propertyId,
    wardNo,
    wardId,
    propertyNo,
    partitionNo,
    societyDetailId,
    categoryId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-1">
        <div className="flex items-center gap-2 px-1">
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <p className="text-[11px] font-bold text-slate-700 tracking-wide uppercase">
            {t('building.loadingCertificates') || 'Loading Building Permission Data...'}
          </p>
        </div>
        <BuildingPermissionSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-5 text-center bg-red-50/60 rounded-xl border border-dashed border-red-200 gap-1.5">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <p className="text-xs font-bold text-red-700">
          {error || t('building.loadError') || 'Failed to load building permission records.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            {t('common.retry') || 'Retry'}
          </button>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-center mb-2 text-blue-600 shadow-2xs">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-xs font-bold text-slate-700 tracking-wide">
          {t('building.noCertificatesAttached') || t('noDataAvailable')}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
          {t('building.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <>
      <BuildingPermissionTabHeader
        certificateTypeOptions={certificateTypeOptions}
        selectedCertType={selectedCertType}
        onFilterSelect={setSelectedCertType}
        onClearFilter={() => setSelectedCertType('ALL')}
        onEdit={handleToolbarEdit}
        isEditing={activeEditingKey === 'toolbar-edit'}
      />

      <div
        data-testid="building-permission-cards-container"
        className={cn(
          'w-full overflow-y-auto rounded-xl custom-scrollbar transition-all duration-300',
          isExpanded ? 'max-h-[460px]' : 'max-h-[238px]'
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {displayedItems.map((item, index) => {
            const rowKey = item.propertyCertificateId
              ? String(item.propertyCertificateId)
              : `${item.certificateTypeId}-${item.propertyDetailsId || 'property'}-${index}`;

            return (
              <BuildingPermissionTabCard
                key={rowKey}
                item={item}
                rowKey={rowKey}
                index={index}
                partitionNo={partitionNo}
                societyDetailId={societyDetailId}
                categoryId={categoryId}
                isViewingThis={activeViewingKey === rowKey}
                isEditingThis={activeEditingKey === rowKey}
                isCopied={copiedKey === rowKey}
                onViewDocument={handleViewDocument}
                onCopyNumber={handleCopyNumber}
                onEditCertificate={handleEditCertificate}
              />
            );
          })}
        </div>
      </div>

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
    </>
  );
};

export default BuildingPermissionTab;
