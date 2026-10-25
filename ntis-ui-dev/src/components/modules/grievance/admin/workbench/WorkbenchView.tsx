'use client';

/**
 * Workbench View Orchestrator Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchView.tsx
 *
 * Coordinates Header with counter pills, Filter bar, Master table with expandable
 * assignment timeline and common ComplaintEvidenceCell, and modal drawers.
 * Line ceiling: <= 200 lines.
 */

import { cn } from '@/lib/utils/cn';
import { useWorkbench } from '@/hooks/grievance/admin/useWorkbench';
import { ComplaintDetailModal } from '@/components/modules/grievance/admin/complaints/ComplaintDetailModal';
import { ComplaintEvidenceModal } from '@/components/modules/grievance/admin/complaints/ComplaintEvidenceModal';
import { WorkbenchHeader } from './WorkbenchHeader';
import { WorkbenchFilters } from './WorkbenchFilters';
import { WorkbenchTable } from './WorkbenchTable';
import { WorkbenchAssignModal } from './WorkbenchAssignModal';

interface WorkbenchViewProps {
  className?: string;
}

export function WorkbenchView({ className = '' }: WorkbenchViewProps) {
  const {
    activeTab,
    setActiveTab,
    unassignedCount,
    assignedCount,
    totalCount,
    complaints,
    departments,
    officers,
    isLoading,
    searchInput,
    setSearchInput,
    departmentId,
    setDepartmentId,
    officerId,
    setOfficerId,
    statusId,
    setStatusId,
    sortOrder,
    setSortOrder,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    expandedIds,
    toggleRowExpand,
    timelines,
    loadingTimelines,
    assignComplaint,
    setAssignComplaint,
    detailComplaint,
    setDetailComplaint,
    evidenceComplaint,
    setEvidenceComplaint,
    refresh,
  } = useWorkbench();

  return (
    <div className={cn('flex flex-col space-y-4 pb-12', className)}>
      {/* 1. Header with Title & Common KPI Cards (DashboardCard) */}
      <WorkbenchHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={totalCount}
        unassignedCount={unassignedCount}
        assignedCount={assignedCount}
      />

      {/* 2. Common AdvanceFilter Bar */}
      <WorkbenchFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        departments={departments}
        officerId={officerId}
        onOfficerChange={setOfficerId}
        officers={officers}
        statusId={statusId}
        onStatusChange={setStatusId}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        onReset={resetFilters}
        isLoading={isLoading}
      />

      {/* 3. Workbench Master Table with Expandable Stepper and Evidence Thumbnail (Image 1 + Image 2) */}
      <WorkbenchTable
        complaints={complaints}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        expandedIds={expandedIds}
        onToggleExpand={toggleRowExpand}
        timelines={timelines}
        loadingTimelines={loadingTimelines}
        onAssignClick={setAssignComplaint}
        onViewClick={setDetailComplaint}
        onEnlargeEvidence={setEvidenceComplaint}
      />

      {/* 4. Assign / Reassign Modal */}
      <WorkbenchAssignModal
        isOpen={Boolean(assignComplaint)}
        complaint={assignComplaint}
        departments={departments}
        onClose={() => setAssignComplaint(null)}
        onSuccess={() => {
          refresh();
        }}
      />

      {/* 5. Comprehensive Details & Dossier Modal */}
      <ComplaintDetailModal
        isOpen={Boolean(detailComplaint)}
        complaint={detailComplaint}
        departments={departments}
        onClose={() => setDetailComplaint(null)}
        onSuccess={() => {
          refresh();
        }}
      />

      {/* 6. Enlarge Evidence Lightbox Modal (Reused) */}
      <ComplaintEvidenceModal
        isOpen={Boolean(evidenceComplaint)}
        complaint={evidenceComplaint}
        onClose={() => setEvidenceComplaint(null)}
      />
    </div>
  );
}
