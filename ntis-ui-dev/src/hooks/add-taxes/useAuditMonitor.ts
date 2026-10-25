import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/utils/logger';
import type { JobAuditItem } from '@/components/modules/property-tax/add-taxes/auditMonitorTab/AuditMonitorColumns';
import { fetchAuditListClient } from '@/lib/api/add-taxes/operations.client';
import { useAuditInitialStats } from './useAuditInitialStats';
import { useAuditJobDetailModal } from './useAuditJobDetailModal';

interface AuditListResult {
  items?: JobAuditItem[];
  totalCount?: number;
  totalPages?: number;
}

export interface UseAuditMonitorProps {
  financeYearId?: string;
  refreshKey?: number;
}

/**
 * Composes the Audit & Monitor tab's state: the filter inputs + paginated jobs table (owned here),
 * the initial stats/job-code suggestions (useAuditInitialStats), and the "view job details" modal
 * (useAuditJobDetailModal) — split into those two hooks per review feedback on this hook's size.
 * Pure relocation for the split-out pieces; what's left here is unchanged.
 */
export function useAuditMonitor({ financeYearId, refreshKey }: UseAuditMonitorProps) {
  const t = useTranslations('addTaxes');

  // Filter input states
  const [selectedJobCode, setSelectedJobCode] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Applied filter query states
  const [appliedJobCode, setAppliedJobCode] = useState<string>('');
  const [appliedStatus, setAppliedStatus] = useState<string>('');
  const [appliedDate, setAppliedDate] = useState<string>('');

  // Data & Refresh states
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [filteredJobs, setFilteredJobs] = useState<JobAuditItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const { allJobCodes, stats, setStats } = useAuditInitialStats({ financeYearId, refreshKey, manualRefreshKey });

  const {
    selectedJobId,
    setSelectedJobId,
    selectedJobDetails,
    detailProperties,
    detailTotalCount,
    detailPage,
    setDetailPage,
    detailPageSize,
    setDetailPageSize,
    isDetailLoading,
    handleViewJobDetails,
  } = useAuditJobDetailModal();

  // Fetch paginated jobs based on filters, pagination, financeYearId, and refreshKey
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const query: Record<string, string | number> = {
          PageNumber: pageNumber,
          PageSize: pageSize,
        };
        if (financeYearId) query.FinanceYearId = financeYearId;
        if (appliedJobCode) query.JobCode = appliedJobCode;
        if (appliedStatus) query.Status = appliedStatus;
        if (appliedDate) query.StartTime = appliedDate;

        const res: AuditListResult | null = await fetchAuditListClient(query);
        if (res) {
          const currentTotal = typeof res.totalCount === 'number' ? res.totalCount : (res.items?.length || 0);
          setFilteredJobs(res.items || []);
          setTotalCount(currentTotal);
          setTotalPages(res.totalPages || 0);

          if (!appliedJobCode && !appliedStatus && !appliedDate) {
            setStats((prev) => ({
              ...prev,
              total: currentTotal,
            }));
          }
        } else {
          setFilteredJobs([]);
          setTotalCount(0);
          setTotalPages(0);
        }
      } catch (err) {
        logger.error('Failed to fetch filtered audit page client-side', { error: err as Error });
        setFilteredJobs([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [appliedJobCode, appliedStatus, appliedDate, pageNumber, pageSize, financeYearId, refreshKey, manualRefreshKey, setStats]);

  const jobOptions = useMemo(() => {
    return [{ value: '', label: t('audit.filters.allJobs') }, ...allJobCodes.map((code) => ({ value: code, label: code }))];
  }, [allJobCodes, t]);

  const handleApplyFilter = () => {
    setAppliedJobCode(selectedJobCode);
    setAppliedStatus(selectedStatus);
    setAppliedDate(selectedDate);
    setPageNumber(1);
  };

  const handleResetFilters = () => {
    setSelectedJobCode('');
    setSelectedStatus('');
    setSelectedDate('');
    setAppliedJobCode('');
    setAppliedStatus('');
    setAppliedDate('');
    setPageNumber(1);
    setManualRefreshKey((prev) => prev + 1);
  };

  return {
    t,
    selectedJobCode,
    setSelectedJobCode,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    jobOptions,
    stats,
    filteredJobs,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    setPageNumber,
    setPageSize,
    isLoading,
    handleApplyFilter,
    handleResetFilters,
    handleViewJobDetails,
    selectedJobId,
    setSelectedJobId,
    selectedJobDetails,
    detailProperties,
    detailTotalCount,
    detailPage,
    detailPageSize,
    isDetailLoading,
    setDetailPage,
    setDetailPageSize,
  };
}
