import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useGrievanceWorkflowStageMasterFormValidation } from "@/hooks/asset-masters/grievance-workflow-stage-master/useGrievanceWorkflowStageMasterFormValidation";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";

describe("useGrievanceWorkflowStageMasterFormValidation", () => {
  const mockT = vi.fn((key: string, values?: Record<string, string | number | Date>) => {
    if (values && values.count !== undefined) {
      return `${key}:${values.count}`;
    }
    return key;
  });

  const validForm: GrievanceWorkflowStageMasterFormModel = {
    id: null,
    ulbTypeId: 1,
    stageCode: "STAGE_VERIFY",
    stageName: "Verification Stage",
    stageNameLocal: "पडताळणी टप्पा",
    stageOrder: 1,
    status: "ACTIVE",
    description: "Valid description",
    isActive: true,
  };

  it("should return no errors for a valid form payload", () => {
    const { result } = renderHook(() =>
      useGrievanceWorkflowStageMasterFormValidation({
        submittedOnce: false,
        touched: {},
        errors: {},
        t: mockT,
      })
    );

    const errors = result.current.validate(validForm);
    expect(errors.stageCode).toBeUndefined();
    expect(errors.stageName).toBeUndefined();
    expect(errors.stageOrder).toBeUndefined();
    expect(errors.status).toBeUndefined();
    expect(errors.description).toBeUndefined();
  });

  it("should validate required fields when empty", () => {
    const { result } = renderHook(() =>
      useGrievanceWorkflowStageMasterFormValidation({
        submittedOnce: true,
        touched: {},
        errors: {},
        t: mockT,
      })
    );

    const emptyForm: GrievanceWorkflowStageMasterFormModel = {
      id: null,
      ulbTypeId: 1,
      stageCode: "",
      stageName: "",
      stageOrder: "" as unknown as number,
      status: "",
      isActive: true,
    };

    const errors = result.current.validate(emptyForm);
    expect(errors.stageCode).toBe("form.validation.stageCodeRequired");
    expect(errors.stageName).toBe("form.validation.stageNameRequired");
    expect(errors.stageOrder).toBe("form.validation.stageOrderRequired");
    expect(errors.status).toBe("form.validation.statusRequired");
  });

  it("should validate field max lengths", () => {
    const { result } = renderHook(() =>
      useGrievanceWorkflowStageMasterFormValidation({
        submittedOnce: false,
        touched: {},
        errors: {},
        t: mockT,
      })
    );

    const longForm: GrievanceWorkflowStageMasterFormModel = {
      ...validForm,
      stageCode: "A".repeat(25),
      stageName: "B".repeat(105),
      status: "C".repeat(55),
      description: "D".repeat(260),
    };

    const errors = result.current.validate(longForm);
    expect(errors.stageCode).toBe("form.validation.stageCodeMaxLength:20");
    expect(errors.stageName).toBe("form.validation.stageNameMaxLength:100");
    expect(errors.status).toBe("form.validation.statusMaxLength:50");
    expect(errors.description).toBe("form.validation.descriptionMaxLength:250");
  });

  it("should validate invalid formats and non-positive stage order", () => {
    const { result } = renderHook(() =>
      useGrievanceWorkflowStageMasterFormValidation({
        submittedOnce: false,
        touched: {},
        errors: {},
        t: mockT,
      })
    );

    const invalidForm: GrievanceWorkflowStageMasterFormModel = {
      ...validForm,
      stageCode: "00000",
      stageOrder: -5,
      status: "INVALID@STATUS!",
    };

    const errors = result.current.validate(invalidForm);
    expect(errors.stageCode).toBe("form.validation.invalidFormat");
    expect(errors.stageOrder).toBe("form.validation.stageOrderInvalid");
    expect(errors.status).toBe("form.validation.statusFormat");
  });

  it("should return truthy value in showError when field was touched or form submitted", () => {
    const { result } = renderHook(() =>
      useGrievanceWorkflowStageMasterFormValidation({
        submittedOnce: false,
        touched: { stageCode: true },
        errors: { stageCode: "Required" },
        t: mockT,
      })
    );

    expect(Boolean(result.current.showError("stageCode"))).toBe(true);
    expect(Boolean(result.current.showError("stageName"))).toBe(false);
  });
});
