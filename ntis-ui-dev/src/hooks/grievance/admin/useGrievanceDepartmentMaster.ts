'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type {
  GrievanceDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilterParams,
  DepartmentStats,
} from '@/types/grievance/department-master.types';
import {
  fetchDepartmentsAction,
  fetchDepartmentByIdAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  fetchDepartmentStatsAction,
  addGrievanceTypeToDepartmentAction,
  removeGrievanceTypeFromDepartmentAction,
} from '@/lib/actions/grievance/admin/grievance-department-master.actions';
import { notifyDepartmentCountChanged } from '@/hooks/grievance/shared/useDepartmentCount';

// Module-level in-memory detail cache to eliminate redundant detail fetches across views
const deptDetailCache = new Map<string, GrievanceDepartment>();

export function useGrievanceDepartmentMaster() {
  const t = useTranslations('grievance');
  const [isPending, startTransition] = useTransition();

  const [departments, setDepartments] = useState<GrievanceDepartment[]>([]);
  const [stats, setStats] = useState<DepartmentStats>({ total: 0, active: 0, inactive: 0, totalGrievances: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Drawer Selection State
  const [selectedDeptForView, setSelectedDeptForView] = useState<GrievanceDepartment | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<GrievanceDepartment | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedDeptForDelete, setSelectedDeptForDelete] = useState<GrievanceDepartment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Debounce search input by 300ms to eliminate rapid keystroke requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Fetch global department stats (decoupled from list pagination)
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await fetchDepartmentStatsAction();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        notifyDepartmentCountChanged(statsRes.data.active);
      }
    } catch {
      // Retain existing stats on error
    }
  }, []);

  // 3. Fetch departments (list items only - zero stats re-querying during pagination)
  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParams: DepartmentFilterParams = { search: debouncedSearch, status, page, pageSize };
      const res = await fetchDepartmentsAction(filterParams);
      if (res.success && res.data) {
        setDepartments(res.data.items);
        setTotalCount(res.data.total);
        setTotalPages(res.data.totalPages);
        if (stats.total === 0 && !debouncedSearch && status === 'all') {
          setStats((prev) => ({ ...prev, total: res.data!.total }));
        }
      } else {
        toast.error(res.message || 'Failed to fetch departments');
      }
    } catch (err) {
      toast.error((err as Error).message || 'An error occurred while loading departments');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, status, page, pageSize, stats.total]);

  // Initial load: Fetch stats once, and fetch department list
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => { if (!ignore) void fetchStats(); }, 0);
    return () => { ignore = true; clearTimeout(timer); };
  }, [fetchStats]);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => { if (!ignore) void fetchDepartments(); }, 0);
    return () => { ignore = true; clearTimeout(timer); };
  }, [fetchDepartments]);

  // 4. Fetch single department by ID with error handling
  const fetchDepartmentById = async (id: string | number): Promise<GrievanceDepartment | null> => {
    try {
      const res = await fetchDepartmentByIdAction(id);
      if (res.success && res.data) return res.data;
      toast.error(res.message || 'Department not found');
      return null;
    } catch (err) {
      toast.error((err as Error).message);
      return null;
    }
  };

  // 5. Open View Drawer with in-memory detail cache (0 network requests if cached)
  const openViewDrawer = async (deptOrId: GrievanceDepartment | string) => {
    const id = String(typeof deptOrId === 'string' ? deptOrId : deptOrId?.id || '');
    if (!id || id === 'undefined' || id === '0') return;

    const cached = deptDetailCache.get(id);
    if (cached && cached.id && (cached.nameEn || cached.nameMr)) {
      setSelectedDeptForView(cached);
      setIsViewDrawerOpen(true);
      return;
    }
    if (typeof deptOrId !== 'string' && deptOrId?.id) setSelectedDeptForView(deptOrId);
    setIsViewDrawerOpen(true);

    const fresh = await fetchDepartmentById(id);
    if (fresh && fresh.id) {
      deptDetailCache.set(id, fresh);
      setSelectedDeptForView(fresh);
    }
  };

  // 6. Save Department (Create or Update) with grievance types persistence
  const handleSaveDepartment = async (formData: CreateDepartmentDto | UpdateDepartmentDto) => {
    setIsSaving(true);
    try {
      if (selectedDeptForEdit?.id) {
        const id = selectedDeptForEdit.id;
        const res = await updateDepartmentAction(id, { ...formData, id });
        if (res.success) {
          // Reconcile added and removed grievance types
          const initialTypes = selectedDeptForEdit.grievanceTypes || [];
          const updatedTypes = formData.grievanceTypes || [];
          const toAdd = updatedTypes.filter((t) => !initialTypes.includes(t));
          const toRemove = initialTypes.filter((t) => !updatedTypes.includes(t));

          if (toAdd.length > 0 || toRemove.length > 0) {
            const mutResults = await Promise.allSettled([
              ...toAdd.map((t) => addGrievanceTypeToDepartmentAction(id, t)),
              ...toRemove.map((t) => removeGrievanceTypeFromDepartmentAction(id, t)),
            ]);
            const failures = mutResults.filter(
              (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)
            );
            if (failures.length > 0) {
              toast.warning(t('deptUpdatedPartialWarning', { count: failures.length }));
            } else {
              toast.success(t('deptUpdatedSuccess'));
            }
          } else {
            toast.success(t('deptUpdatedSuccess'));
          }

          deptDetailCache.delete(String(id));
          setIsFormModalOpen(false);
          setSelectedDeptForEdit(null);
          await Promise.all([fetchDepartments(), fetchStats()]);
        } else {
          toast.error(res.message || 'Failed to update department');
        }
      } else {
        const res = await createDepartmentAction(formData as CreateDepartmentDto);
        if (res.success) {
          const newDeptId = res.data?.id;
          if (newDeptId && formData.grievanceTypes && formData.grievanceTypes.length > 0) {
            const mutResults = await Promise.allSettled(
              formData.grievanceTypes.map((t) => addGrievanceTypeToDepartmentAction(newDeptId, t))
            );
            const failures = mutResults.filter(
              (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)
            );
            if (failures.length > 0) {
              toast.warning(t('deptCreatedPartialWarning', { count: failures.length }));
            } else {
              toast.success(t('deptCreatedSuccess'));
            }
          } else {
            toast.success(t('deptCreatedSuccess'));
          }
          setIsFormModalOpen(false);
          await Promise.all([fetchDepartments(), fetchStats()]);
        } else {
          toast.error(res.message || 'Failed to create department');
        }
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save department');
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Confirm Delete + evict from cache
  const handleConfirmDelete = async () => {
    if (!selectedDeptForDelete?.id) return;
    setIsDeleting(true);
    const id = String(selectedDeptForDelete.id);
    try {
      const res = await deleteDepartmentAction(selectedDeptForDelete.id);
      if (res.success) {
        deptDetailCache.delete(id);
        toast.success(t('deptDeletedSuccess'));
        setIsDeleteDialogOpen(false);
        setSelectedDeptForDelete(null);
        if (departments.length === 1 && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        } else {
          await Promise.all([fetchDepartments(), fetchStats()]);
        }
      } else {
        toast.error(res.message || 'Failed to delete department');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  // 8. Add Grievance Type to Department with cache update
  const handleAddGrievanceType = async (departmentId: string, grievanceType: string) => {
    if (!departmentId || Number(departmentId) <= 0) {
      toast.error('Invalid department ID');
      return;
    }
    try {
      const res = await addGrievanceTypeToDepartmentAction(departmentId, grievanceType);
      if (res.success && res.data) {
        toast.success(t('grievanceTypeAddedSuccess') || 'Grievance type registered');
        deptDetailCache.set(String(departmentId), res.data);
        setSelectedDeptForView(res.data);
        setDepartments((prev) => prev.map((d) => (String(d.id) === String(departmentId) ? res.data! : d)));
      } else {
        toast.error(res.message || 'Failed to add grievance type');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add grievance type');
    }
  };

  // 9. Remove Grievance Type from Department with cache update
  const handleRemoveGrievanceType = async (departmentId: string, grievanceType: string) => {
    if (!departmentId || Number(departmentId) <= 0) {
      toast.error('Invalid department ID');
      return;
    }
    try {
      const res = await removeGrievanceTypeFromDepartmentAction(departmentId, grievanceType);
      if (res.success && res.data) {
        toast.success(t('grievanceTypeRemovedSuccess') || 'Grievance type removed');
        deptDetailCache.set(String(departmentId), res.data);
        setSelectedDeptForView(res.data);
        setDepartments((prev) => prev.map((d) => (String(d.id) === String(departmentId) ? res.data! : d)));
      } else {
        toast.error(res.message || 'Failed to remove grievance type');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to remove grievance type');
    }
  };

  const refreshAll = useCallback(async () => {
    deptDetailCache.clear();
    await Promise.all([fetchDepartments(), fetchStats()]);
  }, [fetchDepartments, fetchStats]);

  return {
    departments,
    stats,
    isLoading: isLoading || isPending,
    isSaving,
    isDeleting,
    search,
    status,
    page,
    pageSize,
    totalCount,
    totalPages,
    selectedDeptForView,
    isViewDrawerOpen,
    selectedDeptForEdit,
    isFormModalOpen,
    selectedDeptForDelete,
    isDeleteDialogOpen,
    setPage,
    setPageSize: (size: number) => startTransition(() => { setPageSize(size); setPage(1); }),
    handleSearchChange: (query: string) => startTransition(() => setSearch(query)),
    handleStatusChange: (st: 'all' | 'active' | 'inactive') => startTransition(() => { setStatus(st); setPage(1); }),
    openCreateModal: () => { setSelectedDeptForEdit(null); setIsFormModalOpen(true); },
    openEditModal: (dept: GrievanceDepartment) => { setSelectedDeptForEdit(dept); setIsFormModalOpen(true); },
    openViewDrawer,
    openDeleteDialog: (dept: GrievanceDepartment) => { setSelectedDeptForDelete(dept); setIsDeleteDialogOpen(true); },
    closeViewDrawer: () => setIsViewDrawerOpen(false),
    closeFormModal: () => setIsFormModalOpen(false),
    closeDeleteDialog: () => setIsDeleteDialogOpen(false),
    handleSaveDepartment,
    handleConfirmDelete,
    handleAddGrievanceType,
    handleRemoveGrievanceType,
    refresh: refreshAll,
  };
}
