'use client';

/**
 * Admin Complaints Management Hook
 * Path: src/hooks/grievance/admin/useAdminComplaints.ts
 *
 * Orchestrates pagination, 300ms debounced search, department & status filtering,
 * and quick detail modal drawer state.
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AdminGrievanceRecord,
  DepartmentOption,
  ComplaintsFilterParams,
} from '@/types/grievance/admin-complaints.types';
import type { PublicGrievancePhoto } from '@/types/grievance/public-dashboard.types';
import {
  fetchAdminComplaintsAction,
  fetchAdminDepartmentOptionsAction,
} from '@/lib/actions/grievance/admin/admin-complaints.actions';
import { fetchPublicGrievancesAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';

export function useAdminComplaints() {
  const [complaints, setComplaints] = useState<AdminGrievanceRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const photosMapRef = useRef<Map<number, PublicGrievancePhoto[]>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeptLoading, setIsDeptLoading] = useState<boolean>(false);

  // Filters
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<number | 'all'>('all');
  const [statusId, setStatusId] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Detail Modal / Drawer
  const [selectedComplaint, setSelectedComplaint] = useState<AdminGrievanceRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // 300ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search term
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load department options from GrievanceDepartmentMasterService & listen to live updates
  const loadDepartments = useCallback(async () => {
    setIsDeptLoading(true);
    try {
      const res = await fetchAdminDepartmentOptionsAction();
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } finally {
      setIsDeptLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) void loadDepartments();
    }, 0);

    const handleUpdate = () => {
      void loadDepartments();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('amravati_department_count_updated', handleUpdate);
    }

    return () => {
      ignore = true;
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('amravati_department_count_updated', handleUpdate);
      }
    };
  }, [loadDepartments]);

  // Pre-load public complaints photos map once for zero-waterfall instant evidence rendering
  useEffect(() => {
    let ignore = false;
    fetchPublicGrievancesAction().then((res) => {
      if (ignore || !res.success || !res.data) return;
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
    }).catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ComplaintsFilterParams = {
        search: debouncedSearch.trim() || undefined,
        departmentId,
        statusId,
        sortOrder,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        pageSize,
      };

      const res = await fetchAdminComplaintsAction(params);
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
      } else {
        setComplaints([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, departmentId, statusId, sortOrder, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) void fetchComplaints();
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [fetchComplaints]);

  // Filter change handlers
  const handleDepartmentChange = useCallback((dept: number | 'all') => {
    setDepartmentId(dept);
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
    setStatusId('all');
    setSortOrder('desc');
    setFromDate('');
    setToDate('');
    setPage(1);
  }, []);

  // Modal actions
  const openDetailModal = useCallback((complaint: AdminGrievanceRecord) => {
    setSelectedComplaint(complaint);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedComplaint(null);
  }, []);

  const refresh = useCallback(() => {
    void fetchComplaints();
    void loadDepartments();
  }, [fetchComplaints, loadDepartments]);

  return {
    complaints,
    departments,
    isLoading,
    isDeptLoading,
    searchInput,
    setSearchInput,
    departmentId,
    setDepartmentId: handleDepartmentChange,
    statusId,
    setStatusId: handleStatusChange,
    sortOrder,
    setSortOrder: handleSortOrderChange,
    fromDate,
    setFromDate: handleFromDateChange,
    toDate,
    setToDate: handleToDateChange,
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,
    resetFilters,
    selectedComplaint,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    refresh,
  };
}
