"use client";

import { useTransition, useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useTypeOfUseUrl } from "./useTypeOfUseUrl";
import { useDebounce } from "@/hooks/useDebounce";
import { AssetTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import { validateAndPrepareSearchTerm } from "./validation";
import { TEXT_SANITIZE } from "@/lib/utils/asset-validation-rules";
import { useTypeOfUseMasterActions } from "./useTypeOfUseMasterActions";

interface UseTypeOfUseMasterStateProps {
  selectedGroupId: number | null;
  selectedTypeOfUseId: number | null;
  typePageNumber: number;
  typePageSize: number;
  typeTotalPages: number;
  subTypePageNumber: number;
  subTypePageSize: number;
  subTypeTotalPages: number;
}

export function useTypeOfUseMasterState({
  selectedGroupId,
  selectedTypeOfUseId,
  typePageNumber,
  typePageSize,
  typeTotalPages,
  subTypePageNumber,
  subTypePageSize,
  subTypeTotalPages,
}: UseTypeOfUseMasterStateProps) {

  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetTypeOfUse");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  const [, startTransition] = useTransition();

  const {
    urlTypeSearch,
    urlSubTypeSearch,
    pushUrl,
  } = useTypeOfUseUrl();

  const [typeSearch, setTypeSearch] = useState(urlTypeSearch);
  const [subTypeSearch, setSubTypeSearch] = useState(urlSubTypeSearch);

  const debouncedTypeSearch = useDebounce(typeSearch, 300);
  const debouncedSubTypeSearch = useDebounce(subTypeSearch, 300);

  const lastPushedTypeRef = useRef(urlTypeSearch);
  const lastPushedSubTypeRef = useRef(urlSubTypeSearch);

  // Sync state with URL changes ONLY when external (e.g. back/forward navigation or reset)
  useEffect(() => {
    if (urlTypeSearch.trim() === lastPushedTypeRef.current.trim()) {
      return;
    }
    startTransition(() => {
      setTypeSearch(urlTypeSearch);
      lastPushedTypeRef.current = urlTypeSearch;
    });
  }, [urlTypeSearch, startTransition]);

  useEffect(() => {
    if (urlSubTypeSearch.trim() === lastPushedSubTypeRef.current.trim()) {
      return;
    }
    startTransition(() => {
      setSubTypeSearch(urlSubTypeSearch);
      lastPushedSubTypeRef.current = urlSubTypeSearch;
    });
  }, [urlSubTypeSearch, startTransition]);


  // Adjust out-of-bounds pagination parameters
  useEffect(() => {
    let hasChanged = false;
    const nextParams: { typePn?: number; subTypePn?: number; typePs?: number; subTypePs?: number } = {};
    const allowed = [10, 20, 30, 40, 50];

    if (typePageSize && !allowed.includes(typePageSize)) {
      nextParams.typePs = allowed.reduce((prev, curr) =>
        Math.abs(curr - typePageSize) < Math.abs(prev - typePageSize) ? curr : prev
      );
      hasChanged = true;
    }
    if (subTypePageSize && !allowed.includes(subTypePageSize)) {
      nextParams.subTypePs = allowed.reduce((prev, curr) =>
        Math.abs(curr - subTypePageSize) < Math.abs(prev - subTypePageSize) ? curr : prev
      );
      hasChanged = true;
    }

    if (typePageNumber < 1) {
      nextParams.typePn = 1;
      hasChanged = true;
    } else if (typeTotalPages > 0 && typePageNumber > typeTotalPages) {
      nextParams.typePn = typeTotalPages;
      hasChanged = true;
    }

    if (subTypePageNumber < 1) {
      nextParams.subTypePn = 1;
      hasChanged = true;
    } else if (subTypeTotalPages > 0 && subTypePageNumber > subTypeTotalPages) {
      nextParams.subTypePn = subTypeTotalPages;
      hasChanged = true;
    }

    if (hasChanged) {
      pushUrl(nextParams);
    }
  }, [typePageNumber, typeTotalPages, subTypePageNumber, subTypeTotalPages, typePageSize, subTypePageSize, pushUrl]);

  // Debounced search updates with sanitization, validation, and race-condition guards
  useEffect(() => {
    const cleanSearch = validateAndPrepareSearchTerm(debouncedTypeSearch) ?? "";
    const trimmed = cleanSearch.trim();
    const current = urlTypeSearch.trim();
    if (trimmed === current || lastPushedTypeRef.current.trim() === trimmed) return;
    lastPushedTypeRef.current = trimmed;
    startTransition(() => pushUrl({ typeSearch: trimmed, typePn: 1 }));
  }, [debouncedTypeSearch, urlTypeSearch, pushUrl, startTransition]);

  useEffect(() => {
    const cleanSubSearch = validateAndPrepareSearchTerm(debouncedSubTypeSearch) ?? "";
    const trimmed = cleanSubSearch.trim();
    const current = urlSubTypeSearch.trim();
    if (trimmed === current || lastPushedSubTypeRef.current.trim() === trimmed) return;
    lastPushedSubTypeRef.current = trimmed;
    startTransition(() => pushUrl({ subTypeSearch: trimmed, subTypePn: 1 }));
  }, [debouncedSubTypeSearch, urlSubTypeSearch, pushUrl, startTransition]);

  const handleGroupSelect = useCallback((groupId: number | null) => {
    startTransition(() => {
      pushUrl({
        selectedGroupId: groupId ? String(groupId) : null,
        selectedTypeOfUseId: null, // clear selected type
        typePn: 1,
        subTypePn: 1,
      });
    });
  }, [pushUrl]);

  const handleRowClick = useCallback((row: AssetTypeOfUse) => {
    startTransition(() => {
      pushUrl({
        selectedTypeOfUseId: String(row.id),
        subTypePn: 1,
      });
    });
  }, [pushUrl]);

  const handleTypeSearchChange = useCallback((val: string) => {
    let sanitized = val.replace(TEXT_SANITIZE, "");
    sanitized = sanitized.trimStart().replace(/\s{2,}/g, " ");
    setTypeSearch(sanitized);
  }, []);

  const handleSubTypeSearchChange = useCallback((val: string) => {
    let sanitized = val.replace(TEXT_SANITIZE, "");
    sanitized = sanitized.trimStart().replace(/\s{2,}/g, " ");
    setSubTypeSearch(sanitized);
  }, []);

  const actions = useTypeOfUseMasterActions({
    locale,
    sp,
    selectedGroupId,
    selectedTypeOfUseId,
    pushUrl,
    confirm,
    t,
    tCommon,
  });

  return {
    t,
    tCommon,
    typeSearch,
    subTypeSearch,
    handleGroupSelect,
    handleRowClick,
    ...actions,
    pushUrl,
    setTypeSearch: handleTypeSearchChange,
    setSubTypeSearch: handleSubTypeSearchChange,
  };
}




