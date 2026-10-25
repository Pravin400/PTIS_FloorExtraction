import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import type { JobPropertyItem } from '@/types/addTaxes.types';
import type { JobAuditItem } from '@/components/modules/property-tax/add-taxes/auditMonitorTab/AuditMonitorColumns';
import { fetchAuditDetailClient, fetchJobPropertiesClient } from '@/lib/api/add-taxes/operations.client';

/**
 * Owns the Audit & Monitor tab's "view job details" modal — split out of useAuditMonitor.ts
 * verbatim (pure relocation, no logic change) per review feedback on that hook's size. Fully
 * self-contained: shares no state with the rest of useAuditMonitor.ts.
 */
export function useAuditJobDetailModal() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobAuditItem | null>(null);
  const [detailProperties, setDetailProperties] = useState<JobPropertyItem[]>([]);
  const [detailTotalCount, setDetailTotalCount] = useState(0);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Load Modal Details on demand
  useEffect(() => {
    if (!selectedJobId) {
      const timer = setTimeout(() => {
        setSelectedJobDetails(null);
        setDetailProperties([]);
        setDetailTotalCount(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    const fetchDetails = async () => {
      setIsDetailLoading(true);
      try {
        const numericJobId = selectedJobId.split('-').pop() || '';
        const [detailsRes, propertiesRes] = await Promise.all([
          fetchAuditDetailClient(numericJobId),
          fetchJobPropertiesClient(numericJobId, detailPage, detailPageSize)
        ]);

        if (cancelled) return;

        setSelectedJobDetails(detailsRes);

        let properties: JobPropertyItem[] = [];
        let total = 0;
        const pRes = propertiesRes as Record<string, unknown> | null;
        const dRes = detailsRes as Record<string, unknown> | null;

        if (pRes) {
          if (Array.isArray(pRes)) {
            properties = pRes as JobPropertyItem[];
            total = pRes.length;
          } else {
            properties = (pRes.items as JobPropertyItem[]) || [];
            total = typeof pRes.totalCount === 'number'
              ? (pRes.totalCount as number)
              : (properties.length || 0);
          }
        }

        const summaryObj = dRes?.summary as Record<string, unknown> | undefined;
        const summaryTotal = (summaryObj?.totalSelected as number) || (summaryObj?.TotalSelected as number);
        if (summaryTotal && summaryTotal > total) {
          total = summaryTotal;
        }

        setDetailProperties(properties);
        setDetailTotalCount(total);
      } catch (err) {
        logger.error('Failed to fetch job details client-side', { error: err as Error });
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      void fetchDetails();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedJobId, detailPage, detailPageSize]);

  const handleViewJobDetails = (job: JobAuditItem) => {
    setSelectedJobId(job.jobId);
    setDetailPage(1);
  };

  return {
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
  };
}
