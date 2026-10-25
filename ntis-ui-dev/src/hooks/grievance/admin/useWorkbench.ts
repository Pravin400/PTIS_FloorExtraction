'use client';

/**
 * Admin Workbench Hook
 * Path: src/hooks/grievance/admin/useWorkbench.ts
 *
 * Manages operational dispatch state: counter tabs (All, Unassigned, Assigned),
 * debounced search, department/officer/status dropdown filters, pagination,
 * expandable rows with lazy assignment timeline caching, and modal states.
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  AdminGrievanceRecord,
  DepartmentOption,
  DepartmentOfficerOption,
  ComplaintsFilterParams,
} from '@/types/grievance/admin-complaints.types';
import type {
  GrievanceTimelineItemDto,
} from '@/types/grievance/tracking.types';
import type { PublicGrievancePhoto } from '@/types/grievance/public-dashboard.types';
import {
  fetchAdminComplaintsAction,
  fetchAdminDepartmentOptionsAction,
  fetchDepartmentOfficersAction,
} from '@/lib/actions/grievance/admin/admin-complaints.actions';
import {
  fetchPublicGrievancesAction,
  trackGrievanceDetailsAction,
} from '@/lib/actions/grievance/citizen/track-grievance.actions';

export type WorkbenchTab = 'all' | 'unassigned' | 'assigned';

export function useWorkbench() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('all');
  const [complaints, setComplaints] = useState<AdminGrievanceRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [officers, setOfficers] = useState<DepartmentOfficerOption[]>([]);
  const photosMapRef = useRef<Map<number, PublicGrievancePhoto[]>>(new Map());
  const reqIdRef = useRef<number>(0);

  // Filters
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<number | 'all'>('all');
  const [officerId, setOfficerId] = useState<number | 'all'>('all');
  const [statusId, setStatusId] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [unassignedTotal, setUnassignedTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Expandable Rows & Timeline Stepper Cache
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [timelines, setTimelines] = useState<Map<number, GrievanceTimelineItemDto[]>>(new Map());
  const [loadingTimelines, setLoadingTimelines] = useState<Set<number>>(new Set());

  // Modals
  const [assignComplaint, setAssignComplaint] = useState<AdminGrievanceRecord | null>(null);
  const [detailComplaint, setDetailComplaint] = useState<AdminGrievanceRecord | null>(null);
  const [evidenceComplaint, setEvidenceComplaint] = useState<AdminGrievanceRecord | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Department Options
  useEffect(() => {
    let active = true;
    fetchAdminDepartmentOptionsAction().then((res) => {
      if (active && res.success && res.data) {
        setDepartments(res.data);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Load Officers (when department filter changes or initially all)
  useEffect(() => {
    let active = true;
    const targetDept = departmentId === 'all' ? undefined : departmentId;
    fetchDepartmentOfficersAction(targetDept).then((res) => {
      if (active && res.success && res.data) {
        setOfficers(res.data);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [departmentId]);

  // Pre-load public complaints photos map once for zero-waterfall instant evidence rendering
  useEffect(() => {
    let active = true;
    fetchPublicGrievancesAction().then((res) => {
      if (active && res.success && res.data) {
        const map = new Map<number, PublicGrievancePhoto[]>();
        for (const app of res.data) {
          if (app.photos && app.photos.length > 0) {
            map.set(app.id, app.photos);
          }
        }
        photosMapRef.current = map;
        setComplaints((prev) =>
          prev.map((c) => {
            if ((!c.photos || c.photos.length === 0) && map.has(c.id)) {
              return { ...c, photos: map.get(c.id) };
            }
            return c;
          })
        );
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch Complaints
  const fetchComplaints = useCallback(async () => {
    const currentReqId = ++reqIdRef.current;
    setIsLoading(true);
    try {
      const effectiveStatusId = activeTab === 'unassigned' ? 1 : statusId;
      const params: ComplaintsFilterParams = {
        search: debouncedSearch.trim() || undefined,
        departmentId,
        statusId: effectiveStatusId,
        sortOrder,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        pageSize,
      };

      const res = await fetchAdminComplaintsAction(params);
      if (currentReqId !== reqIdRef.current) return;

      if (res.success && res.data) {
        const enrichedItems = res.data.items.map((c) => {
          if ((!c.photos || c.photos.length === 0) && photosMapRef.current.has(c.id)) {
            return { ...c, photos: photosMapRef.current.get(c.id) };
          }
          return c;
        });

        setComplaints(enrichedItems);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);

        if (activeTab === 'unassigned') {
          setUnassignedTotal(res.data.totalCount);
        } else {
          // Probe exact database-wide unassigned count
          fetchAdminComplaintsAction({
            search: debouncedSearch.trim() || undefined,
            departmentId,
            statusId: 1,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            page: 1,
            pageSize: 1,
          })
            .then((countRes) => {
              if (countRes.success && countRes.data) {
                setUnassignedTotal(countRes.data.totalCount);
              }
            })
            .catch(() => {});
        }
      } else {
        setComplaints([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (currentReqId === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeTab, debouncedSearch, departmentId, statusId, sortOrder, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) void fetchComplaints();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchComplaints]);

  // Filter complaints based on active counter tab
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const isUnassigned = c.currentStateId === 1;
      if (activeTab === 'unassigned') return isUnassigned;
      if (activeTab === 'assigned') return !isUnassigned;
      return true;
    });
  }, [complaints, activeTab]);

  // Tab Counts: accurate server-wide counts for pills
  const unassignedCount = unassignedTotal;
  const assignedCount = Math.max(0, totalCount - unassignedTotal);

  // Toggle Row Expansion & Lazy Load Assignment Stepper
  const toggleRowExpand = useCallback(async (complaint: AdminGrievanceRecord) => {
    const id = complaint.id;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // If expanding and not yet cached, fetch timeline details
    if (!timelines.has(id)) {
      setLoadingTimelines((prev) => new Set(prev).add(id));
      try {
        const res = await trackGrievanceDetailsAction(complaint.grievanceNo);
        if (res.success && res.data?.timeline) {
          setTimelines((prev) => new Map(prev).set(id, res.data!.timeline));
        } else {
          setTimelines((prev) => new Map(prev).set(id, []));
        }
      } catch {
        setTimelines((prev) => new Map(prev).set(id, []));
      } finally {
        setLoadingTimelines((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  }, [timelines]);

  // Filter Handlers
  const handleTabChange = useCallback((tab: WorkbenchTab) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const handleDepartmentChange = useCallback((dept: number | 'all') => {
    setDepartmentId(dept);
    setOfficerId('all');
    setPage(1);
  }, []);

  const handleOfficerChange = useCallback((off: number | 'all') => {
    setOfficerId(off);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((status: number | 'all') => {
    setStatusId(status);
    setPage(1);
  }, []);

  const handleSortOrderChange = useCallback((order: 'asc' | 'desc') => {
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleFromDateChange = useCallback((val: string) => {
    setFromDate(val);
    setPage(1);
  }, []);

  const handleToDateChange = useCallback((val: string) => {
    setToDate(val);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setDepartmentId('all');
    setOfficerId('all');
    setStatusId('all');
    setSortOrder('desc');
    setFromDate('');
    setToDate('');
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchComplaints();
  }, [fetchComplaints]);

  // Domain Sub-Facades (Clean Architecture Facade Pattern)
  const tabsFacade = {
    activeTab,
    setActiveTab: handleTabChange,
    unassignedCount,
    assignedCount,
    totalCount,
  };

  const filtersFacade = {
    searchInput,
    setSearchInput,
    departmentId,
    setDepartmentId: handleDepartmentChange,
    officerId,
    setOfficerId: handleOfficerChange,
    statusId,
    setStatusId: handleStatusChange,
    sortOrder,
    setSortOrder: handleSortOrderChange,
    fromDate,
    setFromDate: handleFromDateChange,
    toDate,
    setToDate: handleToDateChange,
    resetFilters,
    departments,
    officers,
  };

  const paginationFacade = {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
  };

  const tableFacade = {
    complaints: filteredComplaints,
    allLoadedComplaints: complaints,
    isLoading,
    expandedIds,
    toggleRowExpand,
    timelines,
    loadingTimelines,
    refresh: handleRefresh,
  };

  const modalsFacade = {
    assignComplaint,
    setAssignComplaint,
    detailComplaint,
    setDetailComplaint,
    evidenceComplaint,
    setEvidenceComplaint,
  };

  return {
    // 1. Structured Domain Facades
    tabs: tabsFacade,
    filters: filtersFacade,
    pagination: paginationFacade,
    table: tableFacade,
    modals: modalsFacade,

    // 2. Direct Flat Properties (Backwards compatibility)
    ...tabsFacade,
    ...filtersFacade,
    ...paginationFacade,
    ...tableFacade,
    ...modalsFacade,
  };
}
