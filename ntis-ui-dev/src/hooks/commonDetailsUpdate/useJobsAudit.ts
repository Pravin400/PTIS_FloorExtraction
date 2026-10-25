/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/components/common";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToExcel } from "@/lib/utils/automation-dashboard/export/excelExport";
import {
  UpdateHistoryItem,
  UpdateHistoryDetailItem,
  CommonDetailsUpdateActions,
  UpdateHistoryFilterParams
} from "@/types/common-details-update/common-details-update.types";
import { PagedResponse } from "@/types/common.types";
import {
  getUpdateHistoryAction,
  getUpdateHistoryDetailAction,
  exportUpdateHistoryAction
} from "@/app/[locale]/property-tax/common-details-update/actions";

interface UseJobsAuditOptions {
  initialData?: PagedResponse<UpdateHistoryItem> | UpdateHistoryItem[] | null;
  initialAllData?: PagedResponse<UpdateHistoryItem> | UpdateHistoryItem[] | null;
  initialUpdateHistoryDetail?: PagedResponse<UpdateHistoryDetailItem> | null;
  actions?: Partial<CommonDetailsUpdateActions>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: any) => string;
  updateUrlParams?: (newParams: Record<string, string | number | undefined | null>) => void;
}

export const useJobsAudit = ({
  initialData = null,
  initialAllData: _initialAllData = null,
  initialUpdateHistoryDetail = null,
  actions,
  t,
  updateUrlParams: providedUpdateUrlParams,
}: UseJobsAuditOptions) => {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const auditPage = Number(searchParams.get("auditPage") || searchParams.get("pageNumber") || searchParams.get("page")) || 1;
  const auditPageSize = Number(searchParams.get("auditPageSize") || searchParams.get("pageSize")) || 10;
  const auditUser = searchParams.get("auditUser") || "all";
  const auditSearch = searchParams.get("auditSearch") || "";

  const [searchTerm, setSearchTerm] = useState<string>(auditSearch);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isModalExporting, setIsModalExporting] = useState<boolean>(false);

  const [selectedRow, setSelectedRow] = useState<UpdateHistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDetailsData, setModalDetailsData] = useState<UpdateHistoryDetailItem[]>([]);
  const [modalPage, setModalPage] = useState<number>(1);
  const [modalPageSize, setModalPageSize] = useState<number>(10);
  const [modalTotalCount, setModalTotalCount] = useState<number>(0);
  const [modalTotalPages, setModalTotalPages] = useState<number>(1);
  const [modalSearchTerm, setModalSearchTerm] = useState<string>("");
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [userOptionsState, setUserOptionsState] = useState<{ label: string; value: string }[]>([]);

  const [allHistoryItems, setAllHistoryItems] = useState<UpdateHistoryItem[]>([]);
  const [isLoadingAllHistoryStats, setIsLoadingAllHistoryStats] = useState<boolean>(true);
  const [statsTotalCount, setStatsTotalCount] = useState<number | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedModalSearchTerm = useDebounce(modalSearchTerm, 1000);

  const getUpdateHistoryDetailFn = actions?.getUpdateHistoryDetailAction || getUpdateHistoryDetailAction;
  const getUpdateHistoryFn = actions?.getUpdateHistoryAction || getUpdateHistoryAction;
  const exportUpdateHistoryFn = actions?.exportUpdateHistoryAction || exportUpdateHistoryAction;

  // Turn off table loading spinner when new initialData arrives
  useEffect(() => {
    setIsLoadingTable(false);
  }, [initialData]);

  const updateUrlParams = useCallback((params: Record<string, string | number | null | undefined>) => {
    if (providedUpdateUrlParams) {
      providedUpdateUrlParams(params);
      return;
    }
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || (key === 'auditUser' && value === 'all')) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    // Preserve tab
    newParams.set("tab", "auditMonitor");
    if (!newParams.has("auditPage")) {
      newParams.set("auditPage", String(auditPage));
    }
    if (!newParams.has("auditPageSize")) {
      newParams.set("auditPageSize", String(auditPageSize));
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, pathname, router, providedUpdateUrlParams, auditPage, auditPageSize]);

  const itemsList = useMemo(() => {
    if (!initialData) return [];
    if (Array.isArray(initialData)) return initialData;
    return initialData.items || [];
  }, [initialData]);

  const totalCount = useMemo(() => {
    if (!initialData) return 0;
    if (Array.isArray(initialData)) return initialData.length;
    return initialData.totalCount || 0;
  }, [initialData]);

  const completedCount = useMemo(() => {
    if (isLoadingAllHistoryStats) return "...";
    return allHistoryItems.filter((item) => {
      const status = item.activityStatus?.trim().toLowerCase();
      return status === "success" || status === "completed";
    }).length;
  }, [allHistoryItems, isLoadingAllHistoryStats]);

  const failedCount = useMemo(() => {
    if (isLoadingAllHistoryStats) return "...";
    return allHistoryItems.filter((item) => {
      const status = item.activityStatus?.trim().toLowerCase();
      return status === "failed" || status === "error";
    }).length;
  }, [allHistoryItems, isLoadingAllHistoryStats]);

  const summaryTotalCount = useMemo(() => {
    if (isLoadingAllHistoryStats) return "...";
    if (statsTotalCount !== null) return statsTotalCount;
    return allHistoryItems.length;
  }, [allHistoryItems.length, isLoadingAllHistoryStats, statsTotalCount]);

  const data = useMemo(() => {
    return itemsList.slice(0, auditPageSize);
  }, [itemsList, auditPageSize]);

  // Sync debounced search term to URL
  useEffect(() => {
    if (debouncedSearchTerm !== auditSearch) {
      setIsLoadingTable(true);
      updateUrlParams({ auditPage: 1, auditSearch: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, auditSearch, updateUrlParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setIsLoadingTable(true);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoadingTable(true);
    updateUrlParams({ auditPage: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setIsLoadingTable(true);
    updateUrlParams({ auditPage: 1, auditPageSize: newSize });
  };

  const handleUserChange = (user: string) => {
    setIsLoadingTable(true);
    updateUrlParams({ auditPage: 1, auditUser: user });
  };

  // Fetch full update history (PageSize: -1) for overall completed/failed stats and user filter list
  useEffect(() => {
    let isMounted = true;
    const fetchAllHistory = async () => {
      const usersSet = new Set<string>();

      itemsList.forEach((item) => {
        const u = item.doneBy || item.username || item.createdBy || item.user;
        if (u && typeof u === "string") usersSet.add(u.trim());
      });

      setIsLoadingAllHistoryStats(true);

      try {
        const response = await getUpdateHistoryFn({
          PageSize: -1,
          DoneBy: auditUser !== "all" ? auditUser : undefined,
          SearchTerm: debouncedSearchTerm || undefined,
        });

        if (response.success && response.data?.items) {
          if (isMounted) {
            setAllHistoryItems(response.data.items);
            if (response.data.totalCount !== undefined && response.data.totalCount !== null) {
              setStatsTotalCount(response.data.totalCount);
            } else {
              setStatsTotalCount(response.data.items.length);
            }
          }
          response.data.items.forEach((item: UpdateHistoryItem) => {
            const u = item.doneBy || item.username || item.createdBy || item.user;
            if (u && typeof u === "string") usersSet.add(u.trim());
          });
        }
      } catch {
        // Fallback to local data users
      } finally {
        if (isMounted) {
          setIsLoadingAllHistoryStats(false);
        }
      }

      if (isMounted) {
        const options = Array.from(usersSet).map((u) => ({ label: u, value: u }));
        setUserOptionsState(options);
      }
    };

    fetchAllHistory();
    return () => {
      isMounted = false;
    };
  }, [itemsList, auditUser, debouncedSearchTerm, getUpdateHistoryFn]);

  const userOptions = useMemo(() => {
    return [
      { label: t("jobsAudit.filters.allUsers"), value: "all" },
      ...userOptionsState,
    ];
  }, [userOptionsState, t]);

  const lastFetchRef = useRef<string>("");

  // Fetch modal details from server
  const fetchModalDetails = useCallback(
    async (activityId: string, page: number, size: number, search: string) => {
      const cacheKey = `${activityId}_${page}_${size}_${search}`;
      if (lastFetchRef.current === cacheKey) {
        return;
      }
      lastFetchRef.current = cacheKey;
      setIsLoadingDetails(true);
      try {
        const response = await getUpdateHistoryDetailFn(activityId, page, size, search);
        if (response.success && response.data) {
          const items = response.data.items || [];
          setModalDetailsData(items);
          setModalTotalCount(response.data.totalCount || 0);
          setModalTotalPages(response.data.totalPages || 1);

          if (items.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const first = items[0] as any;
            setSelectedRow((prev) => ({
              ...prev,
              id: prev?.id ?? first.activityId ?? Number(activityId),
              activityId: prev?.activityId ?? first.activityId ?? Number(activityId),
              updateName: first.updateName || prev?.updateName || "",
              doneBy: first.activityDoneBy || first.doneBy || prev?.doneBy || "",
              createdDate: first.createdDate || first.startTime || prev?.createdDate || "",
              ipAddress: first.ipAddress || prev?.ipAddress || "",
              remarks: first.activityRemark || first.remarks || prev?.remarks || "",
              activityStatus: first.activityStatus || prev?.activityStatus || "",
              activityType: first.activityType || prev?.activityType || "",
              records: first.records || response.data?.totalCount || prev?.records || 0,
              startTime: first.startTime || prev?.startTime,
              endTime: first.endTime || prev?.endTime,
              duration: first.duration || prev?.duration,
              activityRemark: first.activityRemark || prev?.activityRemark,
            }));
          }
        } else {
          setModalDetailsData([]);
          setModalTotalCount(0);
          setModalTotalPages(1);
        }
      } catch {
        setModalDetailsData([]);
        setModalTotalCount(0);
        setModalTotalPages(1);
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [getUpdateHistoryDetailFn]
  );

  const handleViewClick = useCallback(
    (row: UpdateHistoryItem) => {
      const isFailed = ["failed", "error"].includes(String(row.activityStatus || "").trim().toLowerCase());
      if (isFailed) {
        toast.info(t("jobsAudit.messages.activityFailedCannotView"));
        return;
      }

      lastFetchRef.current = "";
      setSelectedRow(row);
      setIsModalOpen(true);
      setModalPage(1);
      setModalSearchTerm("");

      const targetId = row.id != null ? String(row.id) : String(row.activityId || "");
      if (targetId) {
        updateUrlParams({ activityId: targetId });
      }
    },
    [updateUrlParams, t, toast]
  );

  // Reset modal page to 1 on debounced search change
  useEffect(() => {
    setModalPage(1);
  }, [debouncedModalSearchTerm]);

  // Sync modal details when open
  useEffect(() => {
    const targetId = selectedRow ? (selectedRow.id != null ? String(selectedRow.id) : String(selectedRow.activityId || "")) : "";
    if (isModalOpen && targetId) {
      fetchModalDetails(
        targetId,
        modalPage,
        modalPageSize,
        debouncedModalSearchTerm
      );
    } else if (!isModalOpen) {
      lastFetchRef.current = "";
    }
  }, [
    isModalOpen,
    selectedRow,
    modalPage,
    modalPageSize,
    debouncedModalSearchTerm,
    fetchModalDetails,
  ]);

  // Initial SSR sync for id / activityId in URL search params
  useEffect(() => {
    const targetId = searchParams.get("id") || searchParams.get("activityId");
    if (targetId && initialUpdateHistoryDetail && !isModalOpen) {
      const row = itemsList.find((item) => String(item.id) === targetId || String(item.activityId) === targetId);
      if (row && (!selectedRow || (String(selectedRow.id) !== targetId && String(selectedRow.activityId) !== targetId))) {
        setSelectedRow(row);
        setIsModalOpen(true);
        setModalDetailsData(initialUpdateHistoryDetail.items || []);
        setModalTotalCount(initialUpdateHistoryDetail.totalCount || 0);
        setModalTotalPages(initialUpdateHistoryDetail.totalPages || 1);
        lastFetchRef.current = `${targetId}_1_${modalPageSize}_`;
      }
    }
  }, [searchParams, itemsList, initialUpdateHistoryDetail, isModalOpen, selectedRow, modalPageSize]);

  const handleExportAudit = async (params: UpdateHistoryFilterParams) => {
    try {
      const result = await exportUpdateHistoryFn(params);
      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Audit_History_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t("messages.excelDownloadSuccess"));
      } else {
        toast.error(
          ("error" in result ? result.error : "") || t("messages.somethingWrong")
        );  
      }
    } catch {
      toast.error(t("messages.somethingWrong"));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await handleExportAudit({
        SearchTerm: auditSearch,
        DoneBy: auditUser !== "all" ? auditUser : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Build the modal table data (flattened from details)
  const buildModalTableData = useCallback(() => {
    return modalDetailsData.flatMap((detail) => {
      let oldVals: Record<string, unknown> = {};
      let newVals: Record<string, unknown> = {};

      const parseVal = (val: unknown) => {
        if (!val) return {};
        if (typeof val === "object") return val;
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            if (typeof parsed === "object" && parsed !== null) return parsed;
          } catch (_err) {
            // Ignore parse error
          }
        }
        return null;
      };

      const parsedOld = parseVal(detail.oldValue);
      const parsedNew = parseVal(detail.newValue);

      if (parsedOld && parsedNew) {
        oldVals = parsedOld;
        newVals = parsedNew;
      } else if (detail.updatedColumns) {
        // Fallback if not valid JSON objects
        const cols = String(detail.updatedColumns).split(",");
        if (cols.length === 1) {
          oldVals = { [cols[0]]: detail.oldValue };
          newVals = { [cols[0]]: detail.newValue };
        } else {
          oldVals = { Value: detail.oldValue };
          newVals = { Value: detail.newValue };
        }
      }

      const allKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

      return allKeys.map((key) => ({
        id: `${detail.property}-${key}`,
        property: detail.property || `${detail.wardNo}-${detail.propertyNo}-${detail.partitionNo}`,
        field: key,
        oldValue: oldVals[key] !== undefined && oldVals[key] !== null ? String(oldVals[key]) : "-",
        newValue: newVals[key] !== undefined && newVals[key] !== null ? String(newVals[key]) : "-",
      }));
    });
  }, [modalDetailsData]);

  const modalTableData = useMemo(() => {
    return buildModalTableData();
  }, [buildModalTableData]);

  const handleModalPageChange = (newPage: number) => {
    setModalPage(newPage);
  };

  const handleModalPageSizeChange = (newSize: number) => {
    setModalPage(1);
    setModalPageSize(newSize);
  };

  const handleModalExport = useCallback(async () => {
    const targetActivityId =
      searchParams.get("activityId") ||
      searchParams.get("id") ||
      (selectedRow ? String(selectedRow.activityId || selectedRow.id || "") : "");

    if (!targetActivityId) {
      toast.error(t("messages.somethingWrong"));
      return;
    }

    try {
      // Trigger API /CommonDetails/update-history/export-excel sending ONLY activityId
      const result = await exportUpdateHistoryFn({
        ActivityId: String(targetActivityId),
      });

      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filenamePrefix = selectedRow?.updateCode || selectedRow?.activityId || targetActivityId;
        a.download = `Update_Details_${filenamePrefix}_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t("messages.excelDownloadSuccess"));
        return;
      }
    } catch (_err) {
      // Fallback below if server API endpoint is unavailable
    }

    // Fallback: Client side export if server binary action is unavailable
    try {
      const fetchCount = modalTotalCount > 0 ? modalTotalCount : 100000;
      const res = await getUpdateHistoryDetailFn(
        String(targetActivityId),
        1,
        fetchCount,
        debouncedModalSearchTerm
      );

      const exportDataItems = res.success && res.data?.items ? res.data.items : modalDetailsData;

      const excelColumns = [
        { header: "Sr. No.", key: "srNo" },
        { header: t("jobsAudit.modal.property") || "Property", key: "propertyNo" },
        { header: "Partition No", key: "partitionNo" },
        { header: t("jobsAudit.modal.oldValue") || "Old Value", key: "oldValue" },
        { header: t("jobsAudit.modal.newValue") || "New Value", key: "newValue" },
      ];

      const modalTableExportData = exportDataItems.map((item: Record<string, unknown>, index: number) => ({
        srNo: index + 1,
        propertyNo: item.propertyNo || item.propertyNumber || "-",
        partitionNo: item.partitionNo || item.partitionNumber || "-",
        oldValue: item.oldValue || "-",
        newValue: item.newValue || "-",
      }));

      await exportToExcel({
        data: modalTableExportData,
        columns: excelColumns,
        fileName: `Update_Details_${targetActivityId}_${new Date().toISOString().split("T")[0]}`,
        reportTitle: `${t("jobsAudit.modal.updateDetailsPrefix")} (${targetActivityId})`,
        reportSubtitle: `${t("jobsAudit.modal.updatedBy")}: ${selectedRow?.doneBy || selectedRow?.username || "-"} | ${t("jobsAudit.modal.date")}: ${selectedRow?.createdDate || selectedRow?.doneOn ? new Date((selectedRow.createdDate || selectedRow.doneOn) as string | number | Date).toLocaleString() : "-"}`,
      });

      toast.success(t("messages.excelDownloadSuccess"));
    } catch {
      toast.error(t("messages.somethingWrong"));
    }
  }, [
    searchParams,
    selectedRow,
    exportUpdateHistoryFn,
    getUpdateHistoryDetailFn,
    modalTotalCount,
    debouncedModalSearchTerm,
    modalDetailsData,
    t,
    toast,
  ]);

  const onModalExportClick = async () => {
    setIsModalExporting(true);
    try {
      await handleModalExport();
    } finally {
      setIsModalExporting(false);
    }
  };

  return {
    auditPage,
    auditPageSize,
    auditUser,
    auditSearch,
    searchTerm,
    setSearchTerm,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleUserChange,
    userOptions,
    totalCount,
    summaryTotalCount,
    completedCount,
    failedCount,
    isLoadingAllHistoryStats,
    data,
    itemsList,
    selectedRow,
    setSelectedRow,
    isModalOpen,
    setIsModalOpen,
    modalDetailsData,
    modalPage,
    setModalPage,
    modalPageSize,
    setModalPageSize,
    modalTotalCount,
    modalTotalPages,
    modalSearchTerm,
    setModalSearchTerm,
    isLoadingDetails,
    isLoadingTable,
    userOptionsState,
    isExporting,
    isModalExporting,
    handleExport,
    onModalExportClick,
    modalTableData,
    handleModalPageChange,
    handleModalPageSizeChange,
    handleViewClick,
    handleExportAudit,
    handleModalExport,
    fetchModalDetails,
    updateUrlParams,
  };
};

