import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAliasMasterFormValidation } from "@/hooks/configuration-settings/alias-master/useAliasMasterFormValidation";
import type { AliasMasterFormModel } from "@/types/alias-master.types";

const baseData: AliasMasterFormModel = {
  id: null,
  keyName: "Ward_No",
  labelName: "Ward No",
  englishName: "Sector",
  regionalName: "सेक्टर",
  hindiName: "सेक्टर",
  isActive: true,
};

function setup(isEdit: boolean) {
  const t = (key: string, values?: Record<string, string | number | Date>) =>
    values ? `${key}:${JSON.stringify(values)}` : key;
  const { result } = renderHook(() =>
    useAliasMasterFormValidation({ submittedOnce: false, touched: {}, errors: {}, isEdit, t })
  );
  return result.current;
}

describe("useAliasMasterFormValidation", () => {
  describe("keyName", () => {
    it("requires keyName when creating (isEdit=false)", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, keyName: "" });
      expect(errors.keyName).toBe("form.validation.keyNameRequired");
    });

    it("does not validate keyName at all when editing (isEdit=true)", () => {
      const { validate } = setup(true);
      const errors = validate({ ...baseData, keyName: "" });
      expect(errors.keyName).toBeUndefined();
    });

    it("rejects a keyName longer than 50 characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, keyName: "A".repeat(51) });
      expect(errors.keyName).toContain("form.validation.keyNameMaxLength");
    });

    it("rejects an all-zero keyName", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, keyName: "000" });
      expect(errors.keyName).toBe("form.validation.keyNameFormat");
    });

    it("rejects a keyName with invalid characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, keyName: "Ward@No" });
      expect(errors.keyName).toBe("form.validation.keyNameFormat");
    });

    it("accepts a well-formed keyName", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, keyName: "Ward_No" });
      expect(errors.keyName).toBeUndefined();
    });
  });

  describe("labelName", () => {
    it("requires labelName regardless of edit mode", () => {
      const { validate } = setup(true);
      const errors = validate({ ...baseData, labelName: "" });
      expect(errors.labelName).toBe("form.validation.labelNameRequired");
    });

    it("rejects a labelName longer than 100 characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, labelName: "A".repeat(101) });
      expect(errors.labelName).toContain("form.validation.labelNameMaxLength");
    });

    it("rejects an invalid labelName format", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, labelName: "Ward##No" });
      expect(errors.labelName).toBe("form.validation.labelNameFormat");
    });
  });

  describe("optional multilingual names", () => {
    it("allows englishName, regionalName, hindiName to be empty", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, englishName: "", regionalName: "", hindiName: "" });
      expect(errors.englishName).toBeUndefined();
      expect(errors.regionalName).toBeUndefined();
      expect(errors.hindiName).toBeUndefined();
    });

    it("rejects englishName longer than 100 characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, englishName: "A".repeat(101) });
      expect(errors.englishName).toContain("form.validation.englishNameMaxLength");
    });

    it("rejects regionalName longer than 100 characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, regionalName: "अ".repeat(101) });
      expect(errors.regionalName).toContain("form.validation.regionalNameMaxLength");
    });

    it("rejects hindiName longer than 100 characters", () => {
      const { validate } = setup(false);
      const errors = validate({ ...baseData, hindiName: "अ".repeat(101) });
      expect(errors.hindiName).toContain("form.validation.hindiNameMaxLength");
    });
  });

  describe("showError", () => {
    it("returns false when the field hasn't been touched and form hasn't been submitted", () => {
      const t = (key: string) => key;
      const { result } = renderHook(() =>
        useAliasMasterFormValidation({
          submittedOnce: false,
          touched: {},
          errors: { labelName: "Required" },
          isEdit: false,
          t,
        })
      );
      expect(result.current.showError("labelName")).toBeFalsy();
    });

    it("returns true once the field has been touched and an error exists", () => {
      const t = (key: string) => key;
      const { result } = renderHook(() =>
        useAliasMasterFormValidation({
          submittedOnce: false,
          touched: { labelName: true },
          errors: { labelName: "Required" },
          isEdit: false,
          t,
        })
      );
      expect(result.current.showError("labelName")).toBe(true);
    });

    it("returns true after submittedOnce even if untouched, when an error exists", () => {
      const t = (key: string) => key;
      const { result } = renderHook(() =>
        useAliasMasterFormValidation({
          submittedOnce: true,
          touched: {},
          errors: { keyName: "Required" },
          isEdit: false,
          t,
        })
      );
      expect(result.current.showError("keyName")).toBe(true);
    });

    it("returns false when there is no error even if touched/submitted", () => {
      const t = (key: string) => key;
      const { result } = renderHook(() =>
        useAliasMasterFormValidation({
          submittedOnce: true,
          touched: { labelName: true },
          errors: {},
          isEdit: false,
          t,
        })
      );
      expect(result.current.showError("labelName")).toBe(false);
    });
  });
});
