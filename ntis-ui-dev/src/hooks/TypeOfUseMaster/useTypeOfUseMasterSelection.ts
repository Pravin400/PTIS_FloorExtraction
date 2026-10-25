import { useState, useEffect, useMemo, useCallback } from 'react';
import type { UseGroup, UseType } from '@/types/typeOfUse.types';

function getTypeApiId(t: UseType) {
  return String(t.typeOfUseId);
}

function getGroupApiId(g: UseGroup): string {
  return String(g.typeOfUseGroupId);
}

interface UseTypeOfUseMasterSelectionParams {
  allGroups: UseGroup[];
  allTypes: UseType[];
  urlGroupId: string;
  urlTypeId: string;
  pageSize: number;
  pushUrl: (params: {
    groupId?: string;
    typeId?: string;
    pn?: number;
    ps?: number;
    q?: string;
  }) => void;
}

export function useTypeOfUseMasterSelection({
  allGroups,
  allTypes,
  urlGroupId,
  urlTypeId,
  pageSize,
  pushUrl,
}: UseTypeOfUseMasterSelectionParams) {
  const findGroupByApiId = useCallback(
    (apiId: string) => allGroups.find((g) => getGroupApiId(g) === apiId) ?? null,
    [allGroups]
  );

  const firstGroup = allGroups?.[0] ?? null;
  const firstGroupApiId = firstGroup ? getGroupApiId(firstGroup) : "";
  const firstTypeInFirstGroup = allTypes.find((t) => String(t.typeOfUseGroupId) === firstGroupApiId);
  const firstTypeInFirstGroupId = firstTypeInFirstGroup ? String(getTypeApiId(firstTypeInFirstGroup)) : "";

  const initialSelectedTypeId = urlTypeId || firstTypeInFirstGroupId || "";

  const initialSelectedGroupId = (() => {
    if (urlGroupId) {
      if (urlGroupId === "ALL") return "ALL";
      const groupByApiId = findGroupByApiId(urlGroupId);
      if (groupByApiId) return groupByApiId.typeOfUseGroupId;
    }

    if (initialSelectedTypeId) {
      const type = allTypes.find((t) => getTypeApiId(t) === String(initialSelectedTypeId));
      if (type) {
        const group = findGroupByApiId(String(type.typeOfUseGroupId));
        if (group) return group.typeOfUseGroupId;
      }
    }
    return "ALL";
  })();

  const [selectedGroupId, setSelectedGroupId] = useState<string | number>(initialSelectedGroupId);

  const selectedTypeId = urlTypeId || initialSelectedTypeId;

  useEffect(() => {
    if (!urlGroupId) return;

    if (urlGroupId === "ALL") {
      if (selectedGroupId !== "ALL") {
        setTimeout(() => setSelectedGroupId("ALL"), 0);
      }
      return;
    }

    const groupByApiId = findGroupByApiId(urlGroupId);
    if (groupByApiId && groupByApiId.typeOfUseGroupId !== selectedGroupId) {
      setTimeout(() => setSelectedGroupId(groupByApiId.typeOfUseGroupId), 0);
    }
  }, [urlGroupId, allGroups, selectedGroupId, findGroupByApiId]);

  useEffect(() => {
    if (!selectedTypeId) return;
    if (urlGroupId) return;

    const type = allTypes.find((t) => getTypeApiId(t) === String(selectedTypeId));
    if (!type) return;

    const group = findGroupByApiId(String(type.typeOfUseGroupId));
    if (!group) return;

    if (group.typeOfUseGroupId !== selectedGroupId) {
      setTimeout(() => setSelectedGroupId(group.typeOfUseGroupId), 0);
    }
  }, [selectedTypeId, allTypes, allGroups, urlGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedTypeId && selectedTypeId !== "__NONE__") return;
    if (urlGroupId) return;

    const group = allGroups.find((g) => g.typeOfUseGroupId === selectedGroupId);
    if (!group) return;

    const groupApiId = getGroupApiId(group);
    const firstType = allTypes.find((t) => String(t.typeOfUseGroupId) === groupApiId);

    if (!firstType) return;

    const firstTypeId = getTypeApiId(firstType);
    const currentGroupApiId = getGroupApiId(group);

    pushUrl({
      groupId: currentGroupApiId,
      typeId: firstTypeId,
      pn: 1,
      ps: pageSize,
      q: "",
    });
  }, [selectedTypeId, selectedGroupId, allTypes, allGroups, pushUrl, pageSize, urlGroupId]);

  const selectedType = useMemo(() => {
    if (!selectedTypeId || selectedTypeId === "__NONE__") return null;
    return allTypes.find((t) => getTypeApiId(t) === String(selectedTypeId));
  }, [selectedTypeId, allTypes]);

  return {
    selectedGroupId,
    selectedTypeId,
    selectedType,
  };
}
