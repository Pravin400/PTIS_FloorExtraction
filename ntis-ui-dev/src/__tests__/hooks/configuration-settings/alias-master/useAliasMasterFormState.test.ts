import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAliasMasterFormState } from "@/hooks/configuration-settings/alias-master/useAliasMasterFormState";
import type { AliasMaster } from "@/types/alias-master.types";

describe("useAliasMasterFormState", () => {
  it("should initialize with empty defaults and isEdit=false when adding", () => {
    const { result } = renderHook(() => useAliasMasterFormState({ initialData: null }));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData).toEqual({
      id: null,
      keyName: "",
      labelName: "",
      englishName: "",
      regionalName: "",
      hindiName: "",
      isActive: true,
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.open).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submittedOnce).toBe(false);
  });

  it("should initialize from initialData and set isEdit=true when editing", () => {
    const initialData: AliasMaster = {
      id: 47,
      aliasKey: "ALS-000047",
      keyName: "Ward_No",
      labelName: "Ward No",
      englishName: "Sector",
      regionalName: "सेक्टर",
      hindiName: "सेक्टर",
      isActive: false,
    };

    const { result } = renderHook(() => useAliasMasterFormState({ initialData }));

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData).toEqual({
      id: 47,
      keyName: "Ward_No",
      labelName: "Ward No",
      englishName: "Sector",
      regionalName: "सेक्टर",
      hindiName: "सेक्टर",
      isActive: false,
    });
  });

  it("should default missing optional name fields to empty strings", () => {
    const initialData: AliasMaster = {
      id: 9,
      aliasKey: null,
      keyName: "BuildingType",
      labelName: "Building Type",
      englishName: null,
      regionalName: null,
      hindiName: null,
      isActive: true,
    };

    const { result } = renderHook(() => useAliasMasterFormState({ initialData }));

    expect(result.current.formData.englishName).toBe("");
    expect(result.current.formData.regionalName).toBe("");
    expect(result.current.formData.hindiName).toBe("");
  });
});
