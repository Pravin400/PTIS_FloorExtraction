"use client";

import React from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import type {
  SearchCriteria,
  SearchFieldErrorMap,
  UsePropertySearchFormProps,
} from "@/types/property-search";
import { validateSearchCriteria } from "@/components/modules/property-tax/search-property/validateSearchCriteria";
import { INITIAL_SEARCH_CRITERIA } from "@/components/modules/property-tax/search-property/constants";
import { sanitizePropertySearchField } from "@/lib/validations/property-search-input-sanitizers";
import {
  getPropertySearchFieldErrors,
  hasPropertySearchFieldErrors,
  trimFieldValue,
} from "@/lib/validations/property-search-field-rules";


type FormDraft = {
  criteriaKey: string;
  formState: SearchCriteria;
  validationError: string | null;
  submitAttempted: boolean;
  touchedFields: Set<keyof SearchCriteria>;
};

const EMPTY_TOUCHED_FIELDS = new Set<keyof SearchCriteria>();

function getVisibleFieldErrors(
  errors: SearchFieldErrorMap,
  touchedFields: Set<keyof SearchCriteria>,
  submitAttempted: boolean
): SearchFieldErrorMap {
  if (submitAttempted) return errors;

  const visible: SearchFieldErrorMap = {};
  for (const [field, message] of Object.entries(errors) as Array<
    [keyof SearchCriteria, string]
  >) {
    if (touchedFields.has(field)) {
      visible[field] = message;
    }
  }
  return visible;
}

/**
 * Owns the controlled form state for Property Search.
 * SSR-driven: when `initialCriteria` changes (URL → server → props),
 * the form re-syncs without any client-side API call.
 */
export function usePropertySearchForm({
  initialCriteria,
  activeTab,
  selectedStatus = null,
  onSearch,
  onReset,
  onZoneChange,
  onWardChange,
  validationT,
}: UsePropertySearchFormProps) {
  const criteriaKey = JSON.stringify(initialCriteria);
  const [draft, setDraft] = React.useState<FormDraft>({
    criteriaKey,
    formState: initialCriteria,
    validationError: null,
    submitAttempted: false,
    touchedFields: new Set(),
  });
  const validationRef = React.useRef<HTMLDivElement | null>(null);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const searchParams = useSearchParams();
  const isSearchActive = searchParams.get("isActive") === "1";

  React.useEffect(() => {
    setDraft({
      criteriaKey,
      formState: initialCriteria,
      validationError: null,
      submitAttempted: false,
      touchedFields: new Set(),
    });
  }, [criteriaKey, initialCriteria]);

  const isDraftSynced = draft.criteriaKey === criteriaKey;
  const formState = isDraftSynced ? draft.formState : initialCriteria;
  const validationError = isDraftSynced ? draft.validationError : null;
  const submitAttempted = isDraftSynced ? draft.submitAttempted : false;

  const fieldErrors = React.useMemo(
    () => getPropertySearchFieldErrors(formState, activeTab, validationT),
    [activeTab, formState, validationT]
  );

  const visibleFieldErrors = React.useMemo(() => {
    const touchedFields = isDraftSynced
      ? draft.touchedFields
      : EMPTY_TOUCHED_FIELDS;
    return getVisibleFieldErrors(fieldErrors, touchedFields, submitAttempted);
  }, [draft.touchedFields, fieldErrors, isDraftSynced, submitAttempted]);

  const isSubmitDisabled = React.useMemo(() => {
    const validation = validateSearchCriteria(
      formState,
      activeTab,
      validationT,
      selectedStatus
    );
    return !validation.valid || hasPropertySearchFieldErrors(fieldErrors);
  }, [activeTab, selectedStatus, fieldErrors, formState, validationT]);

  const getBaseFormState = React.useCallback(
    (prev: FormDraft): SearchCriteria =>
      prev.criteriaKey === criteriaKey ? prev.formState : initialCriteria,
    [criteriaKey, initialCriteria]
  );

  const markFieldTouched = React.useCallback((field: keyof SearchCriteria) => {
    setDraft((prev) => {
      const nextTouched = new Set(prev.touchedFields);
      nextTouched.add(field);
      return { ...prev, touchedFields: nextTouched };
    });
  }, []);

  const setField = React.useCallback(
    (field: keyof SearchCriteria, value: string | number) => {
      const nextValue =
        typeof value === "string"
          ? sanitizePropertySearchField(field, value)
          : value;
      setDraft((prev) => ({
        criteriaKey,
        formState: { ...getBaseFormState(prev), [field]: nextValue },
        validationError: null,
        submitAttempted: prev.criteriaKey === criteriaKey ? prev.submitAttempted : false,
        touchedFields:
          prev.criteriaKey === criteriaKey ? prev.touchedFields : new Set(),
      }));
    },
    [criteriaKey, getBaseFormState]
  );

  const handleInputChange = React.useCallback(
    (field: keyof SearchCriteria) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setField(field, e.target.value);
      },
    [setField]
  );

  const handleInputBlur = React.useCallback(
    (field: keyof SearchCriteria) =>
      (e: React.FocusEvent<HTMLInputElement>) => {
        markFieldTouched(field);
        const trimmed = trimFieldValue(e.target.value);
        setField(field, trimmed);
        // Note: We intentionally do NOT call updateDraftCriteria here.
        // Syncing to URL on blur causes race conditions when clicking Search
        // (blur fires first, then submit). Values persist in React state and
        // are synced to URL when Search is clicked via handleSubmit.
      },
    [markFieldTouched, setField]
  );

  const handleSelectChange = React.useCallback(
    (field: keyof SearchCriteria) =>
      (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
        const nextValue = sanitizePropertySearchField(field, value);

        setDraft((prev) => {
          const nextFormState = { ...getBaseFormState(prev), [field]: nextValue };

          if (field === "valuationMethod") {
            nextFormState.rateableValueFilter = "";
            nextFormState.rateableValueFrom = "";
            nextFormState.rateableValueTo = "";
          }
          if (field === "rateableValueFilter") {
            nextFormState.rateableValueFrom = "";
            nextFormState.rateableValueTo = "";
          }
          if (field === "capitalValueFilter") {
            nextFormState.capitalValueFrom = "";
            nextFormState.capitalValueTo = "";
          }

          return {
            criteriaKey,
            formState: nextFormState,
            validationError: null,
            submitAttempted: prev.criteriaKey === criteriaKey ? prev.submitAttempted : false,
            touchedFields: prev.criteriaKey === criteriaKey ? prev.touchedFields : new Set(),
          };
        });
      },
    [criteriaKey, getBaseFormState]
  );

  const handleZoneChange = React.useCallback(
    (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      const zoneId = Number(value) || 0;
      const currentDraftState =
        draftRef.current.criteriaKey === criteriaKey
          ? draftRef.current.formState
          : initialCriteria;
      const nextFormState = { ...currentDraftState, zoneId, wardId: 0 };

      setDraft({
        criteriaKey,
        formState: nextFormState,
        validationError: null,
        submitAttempted: false,
        touchedFields: new Set(),
      });
      onZoneChange?.(zoneId, nextFormState);
    },
    [criteriaKey, initialCriteria, onZoneChange]
  );

  const handleWardChange = React.useCallback(
    (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      const wardId = Number(value) || 0;
      const currentDraftState =
        draftRef.current.criteriaKey === criteriaKey
          ? draftRef.current.formState
          : initialCriteria;
      const nextFormState = { ...currentDraftState, wardId };

      setDraft((prev) => {
        const nextTouched = new Set(
          prev.criteriaKey === criteriaKey ? prev.touchedFields : EMPTY_TOUCHED_FIELDS
        );
        nextTouched.add("wardId");
        return {
          criteriaKey,
          formState: nextFormState,
          validationError: null,
          submitAttempted: prev.criteriaKey === criteriaKey ? prev.submitAttempted : false,
          touchedFields: nextTouched,
        };
      });

      onWardChange?.(wardId, nextFormState);
    },
    [criteriaKey, initialCriteria, onWardChange]
  );

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const trimmedState = { ...formState };
      for (const key of Object.keys(trimmedState) as Array<keyof SearchCriteria>) {
        const value = trimmedState[key];
        if (typeof value === "string") {
          (trimmedState[key] as string) = trimFieldValue(value);
        }
      }

      const validation = validateSearchCriteria(
        trimmedState,
        activeTab,
        validationT,
        selectedStatus
      );

      if (!validation.valid) {
        setDraft({
          criteriaKey,
          formState: trimmedState,
          validationError: validation.message,
          submitAttempted: true,
          touchedFields: new Set(
            Object.keys(fieldErrors) as Array<keyof SearchCriteria>
          ),
        });
        toast.error(validation.message);
        validationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
        return;
      }

      setDraft({
        criteriaKey,
        formState: trimmedState,
        validationError: null,
        submitAttempted: false,
        touchedFields: new Set(),
      });
      onSearch(trimmedState, activeTab);
    },
    [
      activeTab,
      criteriaKey,
      selectedStatus,
      fieldErrors,
      formState,
      onSearch,
      validationT,
    ]
  );

  const handleReset = React.useCallback(() => {
    setDraft({
      criteriaKey,
      formState: INITIAL_SEARCH_CRITERIA,
      validationError: null,
      submitAttempted: false,
      touchedFields: new Set(),
    });
    onReset();
  }, [criteriaKey, onReset]);

  const handleClearField = React.useCallback(
    (field: keyof SearchCriteria) => {
      let nextFormState: SearchCriteria;
      if (field === "zoneId") {
        nextFormState = { ...formState, zoneId: 0, wardId: 0 };
      } else if (field === "wardId") {
        nextFormState = { ...formState, wardId: 0 };
      } else if (field === "rateableValueFilter") {
        nextFormState = {
          ...formState,
          rateableValueFilter: "",
          rateableValueFrom: "",
          rateableValueTo: "",
        };
      } else if (field === "capitalValueFilter") {
        nextFormState = {
          ...formState,
          capitalValueFilter: "",
          capitalValueFrom: "",
          capitalValueTo: "",
        };
      } else if (field === "valuationMethod") {
        nextFormState = {
          ...formState,
          valuationMethod: "",
          rateableValueFilter: "",
          rateableValueFrom: "",
          rateableValueTo: "",
        };
      } else {
        nextFormState = { ...formState, [field]: "" };
      }

      setDraft((prev) => ({
        criteriaKey,
        formState: nextFormState,
        validationError: null,
        submitAttempted: prev.criteriaKey === criteriaKey ? prev.submitAttempted : false,
        touchedFields:
          prev.criteriaKey === criteriaKey ? prev.touchedFields : new Set(),
      }));

      if (isSearchActive) {
        onSearch(nextFormState, activeTab);
      } else {
        if (field === "zoneId") {
          onZoneChange?.(0, nextFormState);
        } else if (field === "wardId") {
          onWardChange?.(0, nextFormState);
        }
      }
    },
    [criteriaKey, formState, activeTab, isSearchActive, onSearch, onZoneChange, onWardChange]
  );

  return {
    formState,
    validationError,
    validationRef,
    fieldErrors: visibleFieldErrors,
    isSubmitDisabled,
    setField,
    handleInputChange,
    handleInputBlur,
    handleSelectChange,
    handleZoneChange,
    handleWardChange,
    handleSubmit,
    handleReset,
    handleClearField,
  };
}

