import { useState, useCallback } from "react";
import { useToast } from "@/components/common";
import { useTranslations } from "next-intl";
import {
  fetchLockUnlockPropertiesByExcelAction,
  bulkLockUnlockPropertiesAction,
  bulkLockUnlockByExcelSessionAction,
} from "@/app/[locale]/property-tax/lockunlock/action";
import {
  LockedScreen,
  LockUnlockPropertyItem,
  PaginationState,
  SEARCH_CATEGORY,
} from "@/types/lockunlock.types";
import { useLockUnlockMaster } from "./useLockUnlockMaster";
import { useLockUnlockColumns } from "./useLockUnlockColumns";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { executeToggleLock } from "@/lib/api/lockunlock/lockunlock.utils";

export interface UseLockUnlockExcelProps {
  wardIdFromUrl?: string;
  screens?: LockedScreen[];
  dropdownProperties?: { label: string; value: string; propertyId?: number; propertyNo?: string; partitionNo?: string }[];
  initialProperties?: LockUnlockPropertyItem[];
  initialPagination?: PaginationState;
}

export function useLockUnlockExcel(props: UseLockUnlockExcelProps = {}) {
  const t = useTranslations("lockUnlock");
  const toast = useToast();
  const { confirm } = useConfirm();

  const {
    wardIdFromUrl = "",
    screens = [],
    dropdownProperties = [],
    initialProperties = [],
    initialPagination,
  } = props;

  // Base master hook for standard search categories (1 to 4)
  const master = useLockUnlockMaster({
    wardIdFromUrl,
    screens,
    dropdownProperties,
    initialProperties,
    initialPagination,
  });

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [excelSessionId, setExcelSessionId] = useState<string>("");
  const [isExcelSearching, setIsExcelSearching] = useState(false);
  const [excelProperties, setExcelProperties] = useState<LockUnlockPropertyItem[]>([]);
  const [excelShowResults, setExcelShowResults] = useState(false);
  const [excelPagination, setExcelPagination] = useState<PaginationState>({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const resetExcelState = useCallback(() => {
    setExcelFile(null);
    setExcelFileName("");
    setExcelSessionId("");
    setExcelProperties([]);
    setExcelShowResults(false);
    setExcelPagination({ pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  }, []);

  // Fetch properties from Excel file via Server Action with duplicate notification
  const fetchExcelProperties = useCallback(
    async (
      pageNum: number = 1,
      pageSz: number = 10,
      searchTerm?: string,
      isShowClick: boolean = false
    ) => {
      if (!excelFile && !excelSessionId) {
        toast.error(t("selectPropertyCard.excelUploadRequired"));
        return null;
      }

      setIsExcelSearching(true);
      try {
        const normalizedSearch = searchTerm
          ? searchTerm.replace(/\s*-\s*/g, "-").trim()
          : undefined;

        const formDataObj = new FormData();
        // If we already uploaded the file and have a session ID, send only the session identifier
        if (excelSessionId) {
          formDataObj.append("FileSessionId", excelSessionId);
        } else if (excelFile) {
          formDataObj.append("File", excelFile);
        }

        formDataObj.append("PageNumber", pageNum.toString());
        formDataObj.append("PageSize", pageSz.toString());
        if (normalizedSearch) {
          formDataObj.append("SearchTerm", normalizedSearch);
        }

        const response = await fetchLockUnlockPropertiesByExcelAction(formDataObj);

        if (response?.fileSessionId) {
          setExcelSessionId(response.fileSessionId);
        }

        const duplicateCount = response?.duplicateCount ?? response?.dublicateCount ?? 0;

        if (response?.items?.length > 0) {
          setExcelProperties(response.items);
          setExcelPagination({
            pageNumber: response.pageNumber || pageNum,
            pageSize: response.pageSize || pageSz,
            totalCount: response.totalCount,
            totalPages: response.totalPages,
          });
          setExcelShowResults(true);

          if (isShowClick && duplicateCount > 0) {
            toast.info(
              t("messages.excelDuplicatesNotice", { count: duplicateCount })
            );
          }
        } else {
          setExcelProperties([]);
          setExcelPagination({
            pageNumber: 1,
            pageSize: pageSz,
            totalCount: 0,
            totalPages: 1,
          });
          setExcelShowResults(true);
          if (isShowClick) {
            toast.info(t("messages.fetchNoResults"));
          }
        }

        return response;
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : t("messages.fetchFailed");
        if (msg.includes("Get properties by excel failed:")) {
          msg = msg.replace("Get properties by excel failed:", "").trim();
        }
        if (
          msg.toLowerCase().includes("zoneno") ||
          msg.toLowerCase().includes("wardno") ||
          msg.toLowerCase().includes("propertyno") ||
          msg.toLowerCase().includes("column") ||
          msg.toLowerCase().includes("contain")
        ) {
          msg = `${t("selectPropertyCard.wrongExcelUploaded")} ${t("selectPropertyCard.missingColumns")}`;
        }
        toast.error(msg);
        return null;
      } finally {
        setIsExcelSearching(false);
      }
    },
    [excelFile, excelSessionId, t, toast]
  );

  // Resolve all property IDs across pages for Excel category bulk operations if needed
  const resolveExcelPropertyIds = useCallback(
    async (
      searchTerm?: string,
      excludedIds: number[] = []
    ): Promise<number[]> => {
      if (!excelFile && !excelSessionId) return [];

      const formDataObj = new FormData();
      if (excelSessionId) {
        formDataObj.append("FileSessionId", excelSessionId);
      } else if (excelFile) {
        formDataObj.append("File", excelFile);
      }
      formDataObj.append("PageNumber", "1");
      formDataObj.append("PageSize", "-1");
      if (searchTerm) {
        formDataObj.append("SearchTerm", searchTerm);
      }

      const allRes = await fetchLockUnlockPropertiesByExcelAction(formDataObj);
      if (allRes?.fileSessionId) {
        setExcelSessionId(allRes.fileSessionId);
      }
      const allIds = (allRes.items || []).map((p) => p.propertyId);
      return allIds.filter((id) => !excludedIds.includes(id));
    },
    [excelFile, excelSessionId]
  );

  const isExcelCategory = master.formData.searchCategory === SEARCH_CATEGORY.EXCEL;

  const currentProperties = isExcelCategory ? excelProperties : master.properties;
  const currentPagination = isExcelCategory ? excelPagination : master.pagination;
  const currentShowResults = isExcelCategory ? excelShowResults : master.showResults;
  const currentIsSearching = isExcelCategory ? isExcelSearching : master.isSearching;

  const handleShow = useCallback(
    (fromShowButton = false) => {
      if (isExcelCategory) {
        if (!excelFile && !excelSessionId) {
          toast.error(t("selectPropertyCard.excelUploadRequired"));
          return;
        }
        // fromShowButton correctly indicates whether duplicate/empty toasts should be shown
        fetchExcelProperties(1, currentPagination.pageSize, master.propertySearchTerm, fromShowButton);
        return;
      }
      master.handleShow(fromShowButton);
    },
    [
      isExcelCategory,
      excelFile,
      excelSessionId,
      fetchExcelProperties,
      currentPagination.pageSize,
      master,
      t,
      toast,
    ]
  );

  const handleToggleLock = useCallback(
    (row: LockUnlockPropertyItem) => {
      executeToggleLock({
        row,
        selectedScreenIds: master.selectedScreenIds.map(Number),
        t,
        confirm,
        setIsActionPending: master.setIsActionPending,
        toast,
        bulkLockUnlockAction: bulkLockUnlockPropertiesAction,
        onRefresh: () => handleShow(false),
        validateScreenState: false,
      });
    },
    [master.selectedScreenIds, master.setIsActionPending, t, confirm, toast, handleShow]
  );

  const columns = useLockUnlockColumns({
    screens,
    selectedPropertyIds: master.selectedPropertyIds,
    excludedPropertyIds: master.excludedPropertyIds,
    isAllPropertiesSelected: master.isAllPropertiesSelected,
    properties: currentProperties,
    isPending: master.isPending,
    isCategoryBulkAction:
      master.formData.searchCategory === SEARCH_CATEGORY.ZONE ||
      master.formData.searchCategory === SEARCH_CATEGORY.WARD,
    onSelectProperty: master.handleSelectProperty,
    onSelectAllProperties: master.handleSelectAllProperties,
    onToggleLock: isExcelCategory ? handleToggleLock : master.handleToggleLock,
    onManageLocks: master.handleManageLocks,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (isExcelCategory) {
        fetchExcelProperties(newPage, currentPagination.pageSize, master.propertySearchTerm, false);
        return;
      }
      master.handlePageChange(newPage);
    },
    [isExcelCategory, fetchExcelProperties, currentPagination.pageSize, master]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      if (isExcelCategory) {
        fetchExcelProperties(1, newSize, master.propertySearchTerm, false);
        return;
      }
      master.handlePageSizeChange(newSize);
    },
    [isExcelCategory, fetchExcelProperties, master]
  );

  const handleSearchButtonClick = useCallback(
    (termOverride?: unknown) => {
      const term = typeof termOverride === "string" ? termOverride : master.propertySearchTerm;
      if (isExcelCategory) {
        fetchExcelProperties(1, currentPagination.pageSize, term, false);
        return;
      }
      master.handleSearchButtonClick(termOverride);
    },
    [isExcelCategory, fetchExcelProperties, currentPagination.pageSize, master]
  );

  const handleScopeChange = useCallback(
    (categoryId: number) => {
      if (categoryId !== SEARCH_CATEGORY.EXCEL) {
        resetExcelState();
      }
      master.handleSelectChange("searchCategory", categoryId.toString());
    },
    [resetExcelState, master]
  );

  const handleClearAll = useCallback(() => {
    resetExcelState();
    master.handleClearAll();
  }, [resetExcelState, master]);

  const handleBulkAction = useCallback(
    (action: "lock" | "unlock") => {
      if (!isExcelCategory) {
        master.handleBulkAction(action);
        return;
      }

      if (master.selectedScreenIds.length === 0) {
        toast.error(t("messages.selectScreenRequired"));
        return;
      }

      const hasSelection = master.isAllPropertiesSelected
        ? excelProperties.length > 0 && (excelPagination.totalCount - master.excludedPropertyIds.length > 0)
        : master.selectedPropertyIds.length > 0;

      if (!hasSelection) {
        toast.error(t("messages.selectPropertyRequired"));
        return;
      }

      const propertyCount = master.isAllPropertiesSelected
        ? excelPagination.totalCount - master.excludedPropertyIds.length
        : master.selectedPropertyIds.length;

      const title = action === "lock" ? t("messages.lockConfirmTitle") : t("messages.unlockConfirmTitle");
      const description = t("messages.bulkConfirmDescription", {
        action: action === "lock" ? t("messages.lockText").toLowerCase() : t("messages.unlockText").toLowerCase(),
        screenCount: master.selectedScreenIds.length,
        propertyCount,
      });

      confirm({
        variant: action === "lock" ? "warning" : "info",
        title,
        description,
        confirmText: action === "lock" ? t("messages.lockButtonText") : t("messages.unlockButtonText"),
        onConfirm: async () => {
          master.setIsActionPending(true);
          try {
            let response: { success: boolean; message?: string; error?: string };

            if (master.isAllPropertiesSelected && excelSessionId) {
              // Direct Excel session bulk operation: process directly on the server without downloading/re-uploading IDs
              response = await bulkLockUnlockByExcelSessionAction({
                fileSessionId: excelSessionId,
                screenIds: master.selectedScreenIds.map(Number),
                action,
                searchTerm: master.propertySearchTerm,
                excludedPropertyIds: master.excludedPropertyIds,
              });
            } else {
              let targetPropertyIds: number[] = [];
              if (master.isAllPropertiesSelected) {
                targetPropertyIds = await resolveExcelPropertyIds(
                  master.propertySearchTerm,
                  master.excludedPropertyIds
                );
              } else {
                targetPropertyIds = master.selectedPropertyIds;
              }

              if (targetPropertyIds.length === 0) {
                toast.error(t("messages.selectPropertyRequired"));
                return;
              }

              response = await bulkLockUnlockPropertiesAction({
                propertyIds: targetPropertyIds.map(Number),
                screenIds: master.selectedScreenIds.map(Number),
                action,
              });
            }

            if (response.success) {
              toast.success(
                action === "lock"
                  ? t("messages.bulkSuccessLock", { count: propertyCount })
                  : t("messages.bulkSuccessUnlock", { count: propertyCount })
              );
              handleShow(false);
              master.resetSelectionState();
            } else {
              toast.error(response.error || t("messages.bulkFailed"));
            }
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t("messages.unexpectedError"));
          } finally {
            master.setIsActionPending(false);
          }
        },
      });
    },
    [
      isExcelCategory,
      master,
      excelProperties.length,
      excelPagination.totalCount,
      excelSessionId,
      t,
      toast,
      confirm,
      resolveExcelPropertyIds,
      handleShow,
    ]
  );

  return {
    ...master,
    columns,
    properties: currentProperties,
    pagination: currentPagination,
    showResults: currentShowResults,
    isSearching: currentIsSearching,
    handleShow,
    handlePageChange,
    handlePageSizeChange,
    handleSearchButtonClick,
    handleScopeChange,
    handleClearAll,
    handleBulkAction,
    // Excel specific states & handlers
    excelFile,
    setExcelFile,
    excelFileName,
    setExcelFileName,
    excelSessionId,
    setExcelSessionId,
    isExcelSearching,
    excelProperties,
    excelShowResults,
    excelPagination,
    fetchExcelProperties,
    resolveExcelPropertyIds,
    resetExcelState,
  };
}

