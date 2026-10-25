import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { getTypeOfUseDetailsAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { ITypeOfUseDetails, RateCategory } from "@/types/RVRateMaster";
import type { UseGroup } from "@/types/typeOfUse.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

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

interface ConfigureRatesInitializationProps {
  open: boolean;
  isMatrixVisible: boolean;
  currentCategories: RateCategory[];
  allUseTypes: ITypeOfUseDetails[];
  existingGroups: UseGroup[];
  checkedIds: Record<number, boolean>;
  setCheckedIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  groupForms: Record<number, GroupFormState>;
  setGroupForms: React.Dispatch<React.SetStateAction<Record<number, GroupFormState>>>;
  setSavedAny: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  debouncedSearch: string;
  setPaginatedUseTypes: React.Dispatch<React.SetStateAction<ITypeOfUseDetails[]>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  setIsListLoading: React.Dispatch<React.SetStateAction<boolean>>;
  hasInitialized: boolean;
  setHasInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function useConfigureRatesInitialization({
  open,
  isMatrixVisible,
  currentCategories,
  allUseTypes,
  existingGroups,
  checkedIds,
  setCheckedIds,
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
}: ConfigureRatesInitializationProps) {
  const typeOfUse = useAliasLabel("Type_Of_Use", useAliasLabel("Type of Use", t("aliasFallback.typeOfUse")));

  // Reset initialization state when drawer closes
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
    }
  }, [open, setHasInitialized]);

  // Load checkedIds from URL or currentCategories on drawer open, or reset state
  useEffect(() => {
    if (open && !hasInitialized && allUseTypes.length > 0) {
      setCheckedIds({});
      setGroupForms({});
      setSavedAny(false);
      setSearchTerm("");
      setPageNumber(1);

      const initialChecked: Record<number, boolean> = {};
      const initialForms: Record<number, GroupFormState> = {};

      const opType = allUseTypes.find(t => t.typeOfUseCode === 'OP');
      if (opType) {
        initialChecked[opType.id] = true;
        const targetGroup = existingGroups.find(g => g.typeOfUseGroupId === opType.typeOfUseGroupId);
        const hasGroup = !!targetGroup && !!targetGroup.isOpenPlot;

        initialForms[opType.id] = {
          code: hasGroup ? (opType.typeOfUseGroupCode || "") : "",
          name: hasGroup ? (opType.groupName || "") : "",
          icon: "home-icon",
          errors: {},
          isSaved: hasGroup,
          isSaving: false,
          selectedExistingGroupId: hasGroup ? String(opType.typeOfUseGroupId) : "",
          isMappingExisting: true
        };
      }

      if (isMatrixVisible && currentCategories && currentCategories.length > 0) {
        currentCategories.forEach(cat => {
          const typeOfUseId = Number(cat.constructionId);
          if (typeOfUseId && cat.constructionCode !== 'OP') {
            initialChecked[typeOfUseId] = true;
            const tu = allUseTypes.find(t => t.id === typeOfUseId);
            if (!tu) return;
            const targetGroup = existingGroups.find(g => g.typeOfUseGroupId === tu.typeOfUseGroupId);
            const hasGroup = !!targetGroup && !!targetGroup.isOpenPlot;

            initialForms[typeOfUseId] = {
              code: hasGroup ? (tu.typeOfUseGroupCode || "") : "",
              name: hasGroup ? (tu.groupName || "") : "",
              icon: "home-icon",
              errors: {},
              isSaved: hasGroup,
              isSaving: false,
              selectedExistingGroupId: hasGroup ? String(tu.typeOfUseGroupId) : "",
              isMappingExisting: true
            };
          }
        });
        setCheckedIds(initialChecked);
        setGroupForms(initialForms);
      } else {
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const checkedParam = searchParams.get("checkedUseTypes");
          if (checkedParam) {
            const ids = checkedParam.split(",").map(Number).filter(Boolean);
            ids.forEach(id => {
              initialChecked[id] = true;
              const tu = allUseTypes.find(t => t.id === id);
              if (!tu) return;
              const targetGroup = existingGroups.find(g => g.typeOfUseGroupId === tu.typeOfUseGroupId);
              const hasGroup = !!targetGroup && !!targetGroup.isOpenPlot;

              initialForms[id] = {
                code: hasGroup ? (tu.typeOfUseGroupCode || "") : "",
                name: hasGroup ? (tu.groupName || "") : "",
                icon: "home-icon",
                errors: {},
                isSaved: hasGroup,
                isSaving: false,
                selectedExistingGroupId: hasGroup ? String(tu.typeOfUseGroupId) : "",
                isMappingExisting: true
              };
            });
          }
          setCheckedIds(initialChecked);
          setGroupForms(initialForms);
        }
      }
      setHasInitialized(true);
    }
  }, [open, isMatrixVisible, currentCategories, hasInitialized, allUseTypes, existingGroups, setCheckedIds, setGroupForms, setSavedAny, setSearchTerm, setPageNumber, setHasInitialized, t]);

  // Sync checkedIds state to URL query parameters
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const activeIds = Object.keys(checkedIds)
        .filter(id => checkedIds[Number(id)])
        .join(",");

      const searchParams = new URLSearchParams(window.location.search);
      if (activeIds) {
        searchParams.set("checkedUseTypes", activeIds);
      } else {
        searchParams.delete("checkedUseTypes");
      }
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [checkedIds, open]);

  // Load paginated list of typeofuses
  useEffect(() => {
    async function loadPaginatedData() {
      if (!open || allUseTypes.length === 0) return;
      try {
        setIsListLoading(true);
        const result = await getTypeOfUseDetailsAction(pageNumber, pageSize, debouncedSearch);
        const items = result.items || [];
        const sortedItems = [...items].sort((a, b) => {
          if (a.typeOfUseCode === 'OP') return -1;
          if (b.typeOfUseCode === 'OP') return 1;
          return 0;
        });

        setPaginatedUseTypes(sortedItems);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 0);
      } catch (err) {
        toast.error(t("configureRates.toast.loadTypesOfUseFailed", { typeOfUse }));
        logger.error("Failed to load types of use", { error: err as Error });
      } finally {
        setIsListLoading(false);
      }
    }
    loadPaginatedData();
  }, [open, pageNumber, pageSize, debouncedSearch, allUseTypes, setPaginatedUseTypes, setTotalCount, setTotalPages, setIsListLoading, t, typeOfUse]);
}

