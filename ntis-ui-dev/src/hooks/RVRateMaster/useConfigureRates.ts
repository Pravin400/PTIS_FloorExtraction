import { useState, useEffect } from "react";
import { logger } from "@/lib/utils/logger";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { getTypeOfUseDetailsAction, getUseGroupsPagedAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { ITypeOfUseDetails } from "@/types/RVRateMaster";
import type { UseGroup } from "@/types/typeOfUse.types";
import type { RateCategory } from "@/types/RVRateMaster";
import { useConfigureRatesValidation } from "./useConfigureRatesValidation";
import { useConfigureRatesActions } from "./useConfigureRatesActions";
import { useConfigureRatesInitialization } from "./useConfigureRatesInitialization";

interface GroupFormState {
  code: string;
  name: string;
  icon: string;
  errors: {
    code?: string;
    name?: string;
  };
  isSaved: boolean;
  isSaving: boolean;
  selectedExistingGroupId?: string;
  isMappingExisting: boolean;
}

interface UseConfigureRatesProps {
  open: boolean;
  isMatrixVisible: boolean;
  currentCategories: RateCategory[];
  onConfigureSelected?: (selectedTypes: ITypeOfUseDetails[]) => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  isOpenPlot?: boolean;
}

export function useConfigureRates({
  open,
  isMatrixVisible,
  currentCategories,
  onConfigureSelected,
  t,
}: UseConfigureRatesProps) {
  const [allUseTypes, setAllUseTypes] = useState<ITypeOfUseDetails[]>([]);
  const [paginatedUseTypes, setPaginatedUseTypes] = useState<ITypeOfUseDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [existingGroups, setExistingGroups] = useState<UseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});
  const [groupForms, setGroupForms] = useState<Record<number, GroupFormState>>({});
  const [savedAny, setSavedAny] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Load typeofuses and existing groups on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [typesResult, groupsResult] = await Promise.all([
          getTypeOfUseDetailsAction(1, -1),
          getUseGroupsPagedAction({ pageNumber: 1, pageSize: 9999 })
        ]);

        const types = typesResult.items || [];
        const sortedTypes = [...types].sort((a, b) => {
          if (a.typeOfUseCode === 'OP') return -1;
          if (b.typeOfUseCode === 'OP') return 1;
          return 0;
        });
        setAllUseTypes(sortedTypes);
        setExistingGroups(groupsResult.items || []);
      } catch (err) {
        toast.error(t("configureRates.toast.loadDataFailed"));
        logger.error("Failed to load configure rates data", { error: err as Error });
      } finally {
        setIsLoading(false);
      }
    }
    if (open) {
      loadData();
    }
  }, [open, t]);

  // Handle initialization and URL parameter sync
  useConfigureRatesInitialization({
    open,
    isMatrixVisible,
    currentCategories,
    allUseTypes,
    existingGroups,
    checkedIds,
    setCheckedIds,
    groupForms,
    setGroupForms,
    setSavedAny,
    setSearchTerm,
    pageNumber,
    setPageNumber,
    pageSize,
    debouncedSearch,
    setPaginatedUseTypes,
    setTotalCount,
    setTotalPages,
    setIsListLoading,
    hasInitialized,
    setHasInitialized,
    t,
  });

  // Handle form updates and validation rules
  const { handleFieldChange } = useConfigureRatesValidation({
    existingGroups,
    setGroupForms,
    t,
  });

  // Handle async group saving and submission checks
  const {
    handleCheckboxChange,
    handleSelectExistingGroup,
    handleToggleMode,
    handleSaveGroup,
    handleConfigureClick,
  } = useConfigureRatesActions({
    groupForms,
    setGroupForms,
    existingGroups,
    setExistingGroups,
    allUseTypes,
    setAllUseTypes,
    setPaginatedUseTypes,
    checkedIds,
    setCheckedIds,
    onConfigureSelected,
    setSavedAny,
    t,
  });

  return {
    allUseTypes,
    paginatedUseTypes,
    totalCount,
    totalPages,
    isListLoading,
    existingGroups,
    isLoading,
    checkedIds,
    groupForms,
    savedAny,
    searchTerm,
    setSearchTerm,
    pageNumber,
    setPageNumber,
    pageSize,
    setPageSize,
    debouncedSearch,
    handleCheckboxChange,
    handleSelectExistingGroup,
    handleToggleMode,
    handleFieldChange,
    handleSaveGroup,
    handleConfigureClick,
  };
}
