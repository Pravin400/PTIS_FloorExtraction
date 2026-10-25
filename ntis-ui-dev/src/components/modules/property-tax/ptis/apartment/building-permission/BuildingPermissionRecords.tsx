'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { defaultLocale } from '@/i18n/config';
import { DocumentViewerModal } from '@/components/common';
import type { BuildingPermissionData } from '@/types/ptis.types';
import type { BuildingPermissionRecord } from '@/types/property-tax/apartment/building-permission-records.types';
import { useBuildingPermissionRecords } from './useBuildingPermissionRecords';
import { BuildingPermissionFilterBar } from './BuildingPermissionFilterBar';
import { BuildingPermissionEmptyState } from './BuildingPermissionEmptyState';
import { BuildingPermissionCard } from './BuildingPermissionCard';
import { BuildingPermissionSkeleton } from './BuildingPermissionSkeleton';

export interface BuildingPermissionRecordsProps {
  records?: BuildingPermissionRecord[];
  rawGridData?: unknown;
  masterTypes?: unknown[] | null;
  initialCertificateType?: string | null;
  initialViewMode?: 'cards' | 'table';
  isExpanded?: boolean;
  isLoading?: boolean;
  onToggleExpand?: () => void;
  buildingPermissionData?: BuildingPermissionData | null;
  propertyId?: number | string | null;
  wardId?: string | number | null;
  wardNo?: string | null;
  propertyNo?: string | null;
  societyDetailId?: number | null;
  wingDetailsId?: number | null;
  wingName?: string | null;
  className?: string;
}

export const BuildingPermissionRecords: React.FC<BuildingPermissionRecordsProps> = ({
  records: propRecords,
  rawGridData,
  masterTypes: propMasterTypes,
  initialCertificateType,
  isExpanded: propIsExpanded,
  isLoading = false,
  buildingPermissionData,
  propertyId,
  wardId,
  wardNo,
  propertyNo,
  societyDetailId,
  wingDetailsId,
  wingName,
  className,
}) => {
  const routeParams = useParams();
  const locale = useLocale() || (routeParams?.locale as string) || defaultLocale;
  const isExpanded = propIsExpanded !== undefined ? propIsExpanded : true;

  const {
    rows,
    displayedRows,
    certificateTypeOptions,
    selectedCertTypeValue,
    selectedCertType,
    selectedLevel,
    setSelectedLevel,
    levelCounts,
    hasFloorLevel,
    activeViewingKey,
    activeEditingKey,
    copiedKey,
    viewerData,
    closeViewer,
    handleFilterSelect,
    handleLevelSelect,
    handleClearAllFilters,
    handleCopyNumber,
    handleEditRecord,
    handleViewDocument,
  } = useBuildingPermissionRecords({
    propRecords,
    rawGridData,
    propMasterTypes,
    initialCertificateType,
    buildingPermissionData,
    propertyId,
    wardId,
    wardNo,
    propertyNo,
    societyDetailId,
    wingDetailsId,
    wingName,
    locale,
  });

  return (
    <div className={cn('w-full flex flex-col font-sans transition-all', className)}>
      {isExpanded && (
        <>
          {rows.length > 0 && (
            <BuildingPermissionFilterBar
              certificateTypeOptions={certificateTypeOptions}
              selectedCertTypeValue={selectedCertTypeValue}
              selectedCertType={selectedCertType}
              selectedLevel={selectedLevel}
              levelCounts={levelCounts}
              hasFloorLevel={hasFloorLevel}
              societyDetailId={societyDetailId}
              wingDetailsId={wingDetailsId}
              isEditing={activeEditingKey === 'edit-all'}
              onFilterSelect={handleFilterSelect}
              onLevelSelect={handleLevelSelect}
              onSetLevelAll={() => setSelectedLevel('ALL')}
              onClearAllFilters={handleClearAllFilters}
              onEditRecord={() => handleEditRecord()}
            />
          )}

          {isLoading ? (
            <BuildingPermissionSkeleton />
          ) : rows.length === 0 ? (
            <BuildingPermissionEmptyState
              type="no-data"
              onAddOrEdit={() => handleEditRecord()}
            />
          ) : displayedRows.length === 0 ? (
            <BuildingPermissionEmptyState
              type="filter-empty"
              onClearFilter={handleClearAllFilters}
            />
          ) : (
            <div
              data-testid="building-permission-apartment-cards"
              className="w-full overflow-y-auto max-h-[238px] rounded-xl custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {displayedRows.map((row, index) => {
                  const rowKey = String(row.id || `cert-${row.certificateTypeId || 0}-${row.permitNo}-${index}`);
                  return (
                    <BuildingPermissionCard
                      key={rowKey}
                      row={row}
                      rowKey={rowKey}
                      index={index}
                      isViewingThis={activeViewingKey === rowKey}
                      isEditingThis={activeEditingKey === rowKey}
                      isCopied={copiedKey === rowKey}
                      onViewDocument={handleViewDocument}
                      onCopyNumber={handleCopyNumber}
                      onEditRecord={handleEditRecord}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

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

export default BuildingPermissionRecords;
