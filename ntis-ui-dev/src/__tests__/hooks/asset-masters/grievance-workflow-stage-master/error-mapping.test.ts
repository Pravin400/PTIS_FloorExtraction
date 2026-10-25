import { describe, it, expect } from "vitest";
import {
  getGrievanceWorkflowStageMasterErrorMessage,
  parseGrievanceWorkflowStageMasterApiErrors,
  extractRawErrorMessage,
} from "@/hooks/asset-masters/grievance-workflow-stage-master/error-mapping";

const mockT = (key: string, values?: Record<string, string | number | Date>) => {
  const translations: Record<string, string> = {
    "title": "Grievance Workflow Stage",
    "form.messages.duplicate": "This workflow stage already exists for this ULB Type",
    "form.validation.stageCodeDuplicate": "Stage Code already exists",
    "form.validation.stageNameDuplicate": "Stage Name already exists",
    "form.validation.stageOrderDuplicate": "Stage Order already exists",
    "form.validation.stageCodeAndStageOrderDuplicate": "Stage Code and Stage Order already exist",
    "form.validation.stageCodeAndStageNameDuplicate": "Stage Code and Stage Name already exist",
    "form.validation.stageNameAndStageOrderDuplicate": "Stage Name and Stage Order already exist",
    "form.validation.stageAllDuplicate": "Stage Code, Stage Name and Stage Order already exist",
    "form.validation.duplicate": "Workflow Stage Code already exists",
    "form.validation.stageCodeFormat": "Invalid Stage Code format",
    "form.validation.stageNameFormat": "Invalid Stage Name format",
    "form.validation.stageNameLocalFormat": "Invalid Local Stage Name format",
    "form.validation.stageOrderInvalid": "Stage Order must be a positive number",
    "form.validation.statusFormat": "Invalid status format",
    "form.validation.descriptionFormat": "Invalid description format",
    "apiErrors.operationFailed": "Operation failed",
    "apiErrors.inUse": "Record is in use.",
    "apiErrors.deleteBlockedInUse": "This workflow stage cannot be deleted because it is in use.",
    "apiErrors.deactivateBlockedInUse": "This workflow stage cannot be deactivated because it is in use.",
    "apiErrors.GrievanceWorkflowStage_StageCode_Duplicate": "Stage Code already exists",
    "apiErrors.GrievanceWorkflowStage_StageName_Duplicate": "Stage Name already exists",
    "apiErrors.GrievanceWorkflowStage_StageOrder_Duplicate": "Stage Order already exists",
    "apiErrors.referenceBlocked.workflowStage.deleteInUse": "This Workflow Stage cannot be deleted because it is in use.",
    "apiErrors.referenceBlocked.workflowStage.deactivateInUse": "This Workflow Stage cannot be deactivated because it is in use.",
    "apiErrors.referenceBlocked.workflowStage.deleteHasMasters": "This Workflow Stage cannot be deleted because it has {masters}. Please delete all {masters} for this Workflow Stage first.",
    "apiErrors.referenceBlocked.workflowStage.deactivateHasMasters": "This Workflow Stage cannot be deactivated because it has {masters}. Please delete all {masters} for this Workflow Stage first.",
    "apiErrors.referenceMasters.stageAccessControl": "Stage Access Control",
    "apiErrors.referenceMasters.and": "and",
  };

  let template = translations[key] || key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      template = template.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return template;
};

const mockTCommon = (key: string) => {
  const translations: Record<string, string> = {
    "errors.generic": "Failed to connect to the server",
    "errors.deleteError": "Failed to delete",
  };
  return translations[key] || key;
};

describe("error-mapping for grievance workflow stage master", () => {
  describe("extractRawErrorMessage", () => {
    it("should extract string message from plain string", () => {
      expect(extractRawErrorMessage("Simple error")).toBe("Simple error");
    });

    it("should extract message from JSON with message property", () => {
      const json = JSON.stringify({ message: "Inner error message" });
      expect(extractRawErrorMessage(json)).toBe("Inner error message");
    });

    it("should extract message from JSON with errors property", () => {
      const json = JSON.stringify({ errors: { StageCode: ["StageCode is duplicate"] } });
      expect(extractRawErrorMessage(json)).toBe("StageCode is duplicate");
    });
  });

  describe("getGrievanceWorkflowStageMasterErrorMessage", () => {
    it("maps 409 conflict to default duplicate message", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Conflict occurred",
        409,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("This workflow stage already exists for this ULB Type");
    });

    it("maps explicit stageCode duplicate error to corresponding field duplicate translation", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Code 'VERIFY' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Code already exists");
    });

    it("maps explicit stageName duplicate error to corresponding field duplicate translation", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Name 'Verification' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Name already exists");
    });

    it("maps explicit stageOrder duplicate error to corresponding field duplicate translation", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Order '1' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Order already exists");
    });

    it("maps grievanceworkflowstage duplicate error codes", () => {
      expect(
        getGrievanceWorkflowStageMasterErrorMessage(
          "GrievanceWorkflowStage_StageCode_Duplicate",
          400,
          mockT,
          mockTCommon
        )
      ).toBe("Stage Code already exists");

      expect(
        getGrievanceWorkflowStageMasterErrorMessage(
          "GrievanceWorkflowStage_StageName_Duplicate",
          400,
          mockT,
          mockTCommon
        )
      ).toBe("Stage Name already exists");

      expect(
        getGrievanceWorkflowStageMasterErrorMessage(
          "GrievanceWorkflowStage_StageOrder_Duplicate",
          400,
          mockT,
          mockTCommon
        )
      ).toBe("Stage Order already exists");
    });

    it("extracts error message from structured JSON payload", () => {
      const jsonError = JSON.stringify({
        errors: {
          StageCode: ["Stage Code 'INIT' already exists for the selected ULB Type."],
        },
      });
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        jsonError,
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Code already exists");
    });

    it("maps reference-blocked in-use delete message accurately", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "This Workflow Stage cannot be deleted because it is in use.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("This Workflow Stage cannot be deleted because it is in use.");
    });

    it("maps reference-blocked in-use deactivate message accurately", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "This Workflow Stage cannot be deactivated because it is in use.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("This Workflow Stage cannot be deactivated because it is in use.");
    });

    it("maps reference-blocked with child masters message accurately", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "This Workflow Stage cannot be deleted because it has Stage Access Control. Please delete all Stage Access Control for this Workflow Stage first.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe(
        "This Workflow Stage cannot be deleted because it has Stage Access Control. Please delete all Stage Access Control for this Workflow Stage first."
      );
    });

    it("falls back to operationFailed translation for 500 status code", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "",
        500,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Operation failed");
    });

    it("maps 409 delete conflict responses to deleteBlockedInUse message", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Record is referenced in another workflow",
        409,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("This workflow stage cannot be deleted because it is in use.");
    });

    it("falls back to raw message for unrecognized non-empty string", () => {
      const customMsg = "Something custom went wrong";
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        customMsg,
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe(customMsg);
    });

    it("maps combination duplicate errors (Stage Code and Stage Order)", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Code 'WERGEWRG' already exists for the selected ULB Type. Stage Order '4' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Code and Stage Order already exist");
    });

    it("maps combination duplicate errors from structured JSON", () => {
      const json = JSON.stringify({
        message: "Stage Code 'WERGEWRG' already exists for the selected ULB Type. Stage Order '4' already exists for the selected ULB Type.",
        errors: {
          StageCode: "Stage Code 'WERGEWRG' already exists for the selected ULB Type.",
          StageOrder: "Stage Order '4' already exists for the selected ULB Type.",
        },
      });
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        json,
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Code and Stage Order already exist");
    });

    it("maps combination duplicate errors (Stage Code and Stage Name)", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Code 'CODE' already exists. Stage Name 'NAME' already exists.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Code and Stage Name already exist");
    });

    it("does not falsely trigger stage order duplicate when stage name contains the word 'Order'", () => {
      const msg = getGrievanceWorkflowStageMasterErrorMessage(
        "Stage Name 'Work Order Review' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );
      expect(msg).toBe("Stage Name already exists");
    });
  });

  describe("parseGrievanceWorkflowStageMasterApiErrors", () => {
    it("maps multiple distinct structured validation errors to their corresponding field messages", () => {
      const structuredError = JSON.stringify({
        errors: {
          StageCode: ["Stage Code 'VERIFY' already exists for the selected ULB Type."],
          UlbTypeId: ["Invalid ULB Type"],
          StageName: ["Stage Name 'Verification' already exists for the selected ULB Type."],
          StageOrder: ["Stage Order '2' already exists for the selected ULB Type."],
        },
      });

      const { fieldErrors, globalMessage } = parseGrievanceWorkflowStageMasterApiErrors(
        structuredError,
        400,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.stageCode).toBe("Stage Code already exists");
      expect(fieldErrors.ulbTypeId).toBe(globalMessage);
      expect(fieldErrors.stageName).toBe("Stage Name already exists");
      expect(fieldErrors.stageOrder).toBe("Stage Order already exists");
    });

    it("correctly identifies duplicate on a specific field inside structured errors", () => {
      const structuredError = JSON.stringify({
        errors: {
          StageOrder: ["Stage Order '1' already exists for the selected ULB Type."],
        },
      });

      const { fieldErrors } = parseGrievanceWorkflowStageMasterApiErrors(
        structuredError,
        400,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.stageOrder).toBe("Stage Order already exists");
      expect(fieldErrors.stageCode).toBeUndefined();
      expect(fieldErrors.stageName).toBeUndefined();
    });

    it("correctly identifies stageCode duplicate from string message without JSON", () => {
      const { fieldErrors } = parseGrievanceWorkflowStageMasterApiErrors(
        "Stage Code 'CORRECTION' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.stageCode).toBe("Stage Code already exists");
      expect(fieldErrors.stageName).toBeUndefined();
      expect(fieldErrors.stageOrder).toBeUndefined();
    });

    it("correctly identifies stageName duplicate from string message without JSON", () => {
      const { fieldErrors } = parseGrievanceWorkflowStageMasterApiErrors(
        "Stage Name 'Correction' already exists for the selected ULB Type.",
        400,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.stageName).toBe("Stage Name already exists");
      expect(fieldErrors.stageCode).toBeUndefined();
      expect(fieldErrors.stageOrder).toBeUndefined();
    });

    it("should not assign field errors for generic 409 conflict, sets globalMessage", () => {
      const { fieldErrors, globalMessage } = parseGrievanceWorkflowStageMasterApiErrors(
        "Conflict",
        409,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.stageOrder).toBeUndefined();
      expect(fieldErrors.stageCode).toBeUndefined();
      expect(fieldErrors.stageName).toBeUndefined();
      expect(globalMessage).toBe("This workflow stage already exists for this ULB Type");
    });

    it("should assign stageCode duplicate when message indicates stageCode conflict", () => {
      const { fieldErrors } = parseGrievanceWorkflowStageMasterApiErrors(
        "GrievanceWorkflowStage_StageCode_Duplicate",
        409,
        mockT,
        mockTCommon
      );
      expect(fieldErrors.stageCode).toBe("Stage Code already exists");
    });

    it("routes deactivate in-use reference blocked error to isActive field", () => {
      const inUseMsg = "This Workflow Stage cannot be deactivated because it is in use.";
      const { fieldErrors, globalMessage } = parseGrievanceWorkflowStageMasterApiErrors(
        inUseMsg,
        400,
        mockT,
        mockTCommon
      );

      expect(fieldErrors.isActive).toBe(globalMessage);
      expect(globalMessage).toBe("This Workflow Stage cannot be deactivated because it is in use.");
    });

    it("should map structured deactivation error to isActive field", () => {
      const json = JSON.stringify({
        message: "This Workflow Stage cannot be deactivated because it is in use.",
      });

      const res = parseGrievanceWorkflowStageMasterApiErrors(json, 400, mockT, mockTCommon);
      expect(res.fieldErrors.isActive).toBeDefined();
      expect(res.fieldErrors.isActive).toContain("cannot be deactivated");
      expect(res.globalMessage).toContain("cannot be deactivated");
    });
  });
});
