import { useCallback } from "react";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { createUseGroupAndAssignToTypeAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { getIconKey } from "@/components/modules/property-tax/typeofusemaster/GroupIconSelector";
import { CODE_REGEX, TEXT_ALLOWED } from "@/lib/utils/validation-rules";
import { normalize } from "@/lib/utils/sanitization";
import type { ITypeOfUseDetails } from "@/types/RVRateMaster";
import type { UseGroup, UseGroupIconKey } from "@/types/typeOfUse.types";
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

const isAllZeros = (str: string) => /^[0]+$/.test(str);

interface UseConfigureRatesActionsProps {
  groupForms: Record<number, GroupFormState>;
  setGroupForms: React.Dispatch<React.SetStateAction<Record<number, GroupFormState>>>;
  existingGroups: UseGroup[];
  setExistingGroups: React.Dispatch<React.SetStateAction<UseGroup[]>>;
  allUseTypes: ITypeOfUseDetails[];
  setAllUseTypes: React.Dispatch<React.SetStateAction<ITypeOfUseDetails[]>>;
  setPaginatedUseTypes: React.Dispatch<React.SetStateAction<ITypeOfUseDetails[]>>;
  checkedIds: Record<number, boolean>;
  setCheckedIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  onConfigureSelected?: (selectedTypes: ITypeOfUseDetails[]) => void;
  setSavedAny: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function useConfigureRatesActions({
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
}: UseConfigureRatesActionsProps) {
  const typeOfUse = useAliasLabel("Type_Of_Use", useAliasLabel("Type of Use", t("aliasFallback.typeOfUse")));
  const use = useAliasLabel("Use", t("aliasFallback.use"));

  const handleCheckboxChange = useCallback((id: number) => {
    const tu = allUseTypes.find(t => t.id === id);
    if (!tu || tu.typeOfUseCode === 'OP') return;

    setCheckedIds(prev => {
      const isChecked = !prev[id];
      if (isChecked && !groupForms[id]) {
        const targetGroup = existingGroups.find(g => g.typeOfUseGroupId === tu.typeOfUseGroupId);
        const hasGroup = !!targetGroup && !!targetGroup.isOpenPlot;

        setGroupForms(prevForms => ({
          ...prevForms,
          [id]: {
            code: hasGroup ? (tu.typeOfUseGroupCode || "") : "",
            name: hasGroup ? (tu.groupName || "") : "",
            icon: "home-icon",
            errors: {},
            isSaved: hasGroup,
            isSaving: false,
            selectedExistingGroupId: hasGroup ? String(tu.typeOfUseGroupId) : "",
            isMappingExisting: true
          }
        }));
      }
      return { ...prev, [id]: isChecked };
    });
  }, [allUseTypes, existingGroups, groupForms, setCheckedIds, setGroupForms]);

  const handleSelectExistingGroup = useCallback((id: number, groupIdStr: string) => {
    setGroupForms(prev => {
      const form = prev[id];
      if (!form) return prev;

      if (!groupIdStr) {
        return {
          ...prev,
          [id]: {
            ...form,
            selectedExistingGroupId: "",
            code: "",
            name: "",
            icon: "home-icon",
            errors: {},
            isSaved: false
          }
        };
      }

      const selectedGroup = existingGroups.find(g => String(g.typeOfUseGroupId) === groupIdStr);
      if (!selectedGroup) return prev;

      return {
        ...prev,
        [id]: {
          ...form,
          selectedExistingGroupId: groupIdStr,
          code: selectedGroup.typeOfUseGroupCode || "",
          name: selectedGroup.groupName || "",
          icon: selectedGroup.groupIcon || "home-icon",
          errors: {},
          isSaved: false
        }
      };
    });
  }, [existingGroups, setGroupForms]);

  const handleToggleMode = useCallback((id: number) => {
    setGroupForms(prev => {
      const form = prev[id];
      if (!form) return prev;
      return {
        ...prev,
        [id]: {
          ...form,
          isMappingExisting: !form.isMappingExisting,
          selectedExistingGroupId: "",
          code: "",
          name: "",
          icon: "home-icon",
          errors: {},
          isSaved: false
        }
      };
    });
  }, [setGroupForms]);

  const handleSaveGroup = useCallback(async (id: number, typeofuse: ITypeOfUseDetails) => {
    const form = groupForms[id];
    if (!form || form.isSaved || form.isSaving) return;

    if (form.isMappingExisting) {
      if (!form.selectedExistingGroupId) return;
      try {
        setGroupForms(prev => ({
          ...prev,
          [id]: { ...prev[id]!, isSaving: true }
        }));

        const res = await createUseGroupAndAssignToTypeAction({
          code: "",
          name: "",
          icon: "home",
          typeOfUseId: typeofuse.id,
          typeOfUseGroupId: Number(form.selectedExistingGroupId)
        });

        if (res.success && res.typeOfUseGroupId) {
          toast.success(t("configureRates.toast.groupAssociated", { typeDescription: typeofuse.description || typeofuse.typeOfUseCode || "" }));
          setGroupForms(prev => ({
            ...prev,
            [id]: { ...prev[id]!, isSaved: true, isSaving: false }
          }));

          const groupCode = form.code;
          const groupName = form.name;

          const updater = (t: ITypeOfUseDetails) => {
            if (t.id === typeofuse.id) {
              return {
                ...t,
                typeOfUseGroupId: res.typeOfUseGroupId,
                typeOfUseGroupCode: groupCode,
                groupName: groupName
              };
            }
            return t;
          };

          setAllUseTypes(prev => prev.map(updater));
          setPaginatedUseTypes(prev => prev.map(updater));
          setSavedAny(true);
        } else {
          toast.error(res.message || t("configureRates.toast.failedToAssociate"));
          setGroupForms(prev => ({
            ...prev,
            [id]: { ...prev[id]!, isSaving: false }
          }));
        }
      } catch (err) {
        toast.error(t("configureRates.toast.saveError"));
        logger.error("Failed to save configure rates group", { error: err as Error });
        setGroupForms(prev => ({
          ...prev,
          [id]: { ...prev[id]!, isSaving: false }
        }));
      }
      return;
    }

    const codeTrimmed = form.code.trim();
    const nameTrimmed = form.name.trim();

    const errors: { code?: string; name?: string } = {};
    if (!codeTrimmed) {
      errors.code = t("configureRates.validation.codeRequired");
    } else if (isAllZeros(codeTrimmed)) {
      errors.code = t("configureRates.validation.codeAllZeros");
    } else if (codeTrimmed.length > 10) {
      errors.code = t("configureRates.validation.codeTooLong");
    } else if (!CODE_REGEX.test(codeTrimmed)) {
      errors.code = t("configureRates.validation.codeAlphanumericOnly");
    } else {
      const normalized = normalize(codeTrimmed);
      if (existingGroups.some(g => normalize(g.typeOfUseGroupCode || '') === normalized)) {
        errors.code = t("configureRates.validation.codeExists");
      }
    }

    if (!nameTrimmed) {
      errors.name = t("configureRates.validation.nameRequired");
    } else if (isAllZeros(nameTrimmed)) {
      errors.name = t("configureRates.validation.nameAllZeros");
    } else if (nameTrimmed.length > 50) {
      errors.name = t("configureRates.validation.nameTooLong");
    } else if (!TEXT_ALLOWED.test(nameTrimmed)) {
      errors.name = t("configureRates.validation.nameInvalidChars");
    } else {
      const normalized = normalize(nameTrimmed);
      if (existingGroups.some(g => normalize(g.groupName || '') === normalized)) {
        errors.name = t("configureRates.validation.nameExists");
      }
    }

    if (Object.keys(errors).length > 0) {
      setGroupForms(prev => ({
        ...prev,
        [id]: { ...prev[id]!, errors }
      }));
      return;
    }

    try {
      setGroupForms(prev => ({
        ...prev,
        [id]: { ...prev[id]!, isSaving: true }
      }));

      const res = await createUseGroupAndAssignToTypeAction({
        code: codeTrimmed,
        name: nameTrimmed,
        icon: getIconKey(form.icon) as UseGroupIconKey,
        typeOfUseId: typeofuse.id,
        isOpenPlot: true
      });

      if (res.success && res.typeOfUseGroupId) {
        toast.success(t("configureRates.toast.groupConfigured", { typeDescription: typeofuse.description || typeofuse.typeOfUseCode || "" }));
        setGroupForms(prev => ({
          ...prev,
          [id]: { ...prev[id]!, isSaved: true, isSaving: false }
        }));

        const newlyCreatedGroup: UseGroup = {
          typeOfUseGroupId: res.typeOfUseGroupId,
          typeOfUseGroupCode: codeTrimmed,
          groupName: nameTrimmed,
          groupIcon: getIconKey(form.icon),
          isOpenPlot: true,
          isActive: true
        };
        setExistingGroups(prev => [...prev, newlyCreatedGroup]);

        const updater = (t: ITypeOfUseDetails) => {
          if (t.id === typeofuse.id) {
            return {
              ...t,
              typeOfUseGroupId: res.typeOfUseGroupId,
              typeOfUseGroupCode: codeTrimmed,
              groupName: nameTrimmed
            };
          }
          return t;
        };

        setAllUseTypes(prev => prev.map(updater));
        setPaginatedUseTypes(prev => prev.map(updater));
        setSavedAny(true);
      } else {
        toast.error(res.message || t("configureRates.toast.failedToConfigure"));
        setGroupForms(prev => ({
          ...prev,
          [id]: { ...prev[id]!, isSaving: false }
        }));
      }
    } catch (err) {
      toast.error(t("configureRates.toast.saveError"));
      logger.error("Failed to save configure rates group", { error: err as Error });
      setGroupForms(prev => ({
        ...prev,
        [id]: { ...prev[id]!, isSaving: false }
      }));
    }
  }, [existingGroups, groupForms, setAllUseTypes, setExistingGroups, setGroupForms, setPaginatedUseTypes, setSavedAny, t]);

  const handleConfigureClick = useCallback(() => {
    const selected = allUseTypes.filter(tu => checkedIds[tu.id]);

    const hasInvalidSelection = selected.some(tu => {
      if (!tu.typeOfUseGroupId) return true;
      const group = existingGroups.find(g => g.typeOfUseGroupId === tu.typeOfUseGroupId);
      return !group || !group.isOpenPlot;
    });

    if (hasInvalidSelection) {
      toast.error(t("configureRates.toast.invalidSelection", { typeOfUse, use }));
      return;
    }

    const selectedGroupIds = selected
      .map(tu => tu.typeOfUseGroupId)
      .filter((id): id is number => !!id && id > 0);

    const hasDuplicateGroupIds = selectedGroupIds.length !== new Set(selectedGroupIds).size;

    if (hasDuplicateGroupIds) {
      toast.error(t("configureRates.toast.duplicateGroup", { typeOfUse, use }));
      return;
    }

    const distinctSelected: ITypeOfUseDetails[] = [];
    const seenGroupIds = new Set<number>();

    selected.forEach(tu => {
      const groupId = tu.typeOfUseGroupId;
      if (groupId && groupId > 0) {
        if (!seenGroupIds.has(groupId)) {
          seenGroupIds.add(groupId);
          distinctSelected.push(tu);
        }
      } else {
        distinctSelected.push(tu);
      }
    });

    if (distinctSelected.length === 0) {
      toast.info(t("configureRates.toast.useGroupsNotConfigured", { use }) || "Use Groups not Configured, so default use groups are shown.");
      onConfigureSelected?.([]);
      return;
    }

    onConfigureSelected?.(distinctSelected);
  }, [allUseTypes, checkedIds, existingGroups, onConfigureSelected, t, typeOfUse, use]);

  return {
    handleCheckboxChange,
    handleSelectExistingGroup,
    handleToggleMode,
    handleSaveGroup,
    handleConfigureClick,
  };
}
