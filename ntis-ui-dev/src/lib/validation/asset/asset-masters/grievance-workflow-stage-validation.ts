import {
  isAllZeros,
  CODE_REGEX,
  NAME_ONLY_REGEX,
  DESCRIPTION_REGEX,
  ENGLISH_REGEX,
  ENGLISH_SANITIZE,
} from "@/lib/utils/asset-validation-rules";

export { ENGLISH_REGEX, ENGLISH_SANITIZE };

export const GRIEVANCE_WORKFLOW_STAGE_LIMITS = {
  STAGE_CODE_MAX: 20,
  STAGE_NAME_MAX: 100,
  STAGE_NAME_LOCAL_MAX: 100,
  STAGE_ORDER_MIN: 1,
  STAGE_ORDER_MAX: 100,
  STATUS_MAX: 50,
  DESCRIPTION_MAX: 250,
} as const;

export type GrievanceWorkflowStageErrorCode =
  | "REQUIRED"
  | "MAX_LENGTH"
  | "INVALID_FORMAT"
  | "ALL_ZEROS"
  | "OUT_OF_RANGE";

export interface GrievanceWorkflowStageValidationResult {
  isValid: boolean;
  errors: Partial<Record<string, GrievanceWorkflowStageErrorCode>>;
}

export function validateGrievanceWorkflowStageData(data: {
  stageCode?: unknown;
  stageName?: unknown;
  stageNameLocal?: unknown;
  stageOrder?: unknown;
  status?: unknown;
  description?: unknown;
}): GrievanceWorkflowStageValidationResult {
  const errors: Partial<Record<string, GrievanceWorkflowStageErrorCode>> = {};

  // stageCode
  const stageCode = String(data.stageCode ?? "").trim();
  if (!stageCode) {
    errors.stageCode = "REQUIRED";
  } else if (stageCode.length > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_CODE_MAX) {
    errors.stageCode = "MAX_LENGTH";
  } else if (isAllZeros(stageCode)) {
    errors.stageCode = "ALL_ZEROS";
  } else if (!CODE_REGEX.test(stageCode)) {
    errors.stageCode = "INVALID_FORMAT";
  }

  // stageName
  const stageName = String(data.stageName ?? "").trim();
  if (!stageName) {
    errors.stageName = "REQUIRED";
  } else if (stageName.length > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_MAX) {
    errors.stageName = "MAX_LENGTH";
  } else if (isAllZeros(stageName) || !NAME_ONLY_REGEX.test(stageName)) {
    errors.stageName = "INVALID_FORMAT";
  }

  // stageNameLocal
  const stageNameLocal = String(data.stageNameLocal ?? "").trim();
  if (stageNameLocal) {
    if (stageNameLocal.length > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_LOCAL_MAX) {
      errors.stageNameLocal = "MAX_LENGTH";
    } else if (!NAME_ONLY_REGEX.test(stageNameLocal)) {
      errors.stageNameLocal = "INVALID_FORMAT";
    }
  }

  // stageOrder
  if (data.stageOrder === "" || data.stageOrder === null || data.stageOrder === undefined) {
    errors.stageOrder = "REQUIRED";
  } else {
    const stageOrderNum = Number(data.stageOrder);
    if (
      !Number.isInteger(stageOrderNum) ||
      stageOrderNum < GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MIN ||
      stageOrderNum > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MAX
    ) {
      errors.stageOrder = "OUT_OF_RANGE";
    }
  }

  // status
  const status = String(data.status ?? "").trim();
  if (!status) {
    errors.status = "REQUIRED";
  } else if (status.length > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STATUS_MAX) {
    errors.status = "MAX_LENGTH";
  } else if (!ENGLISH_REGEX.test(status)) {
    errors.status = "INVALID_FORMAT";
  }

  // description
  const description = String(data.description ?? "").trim();
  if (description) {
    if (description.length > GRIEVANCE_WORKFLOW_STAGE_LIMITS.DESCRIPTION_MAX) {
      errors.description = "MAX_LENGTH";
    } else if (isAllZeros(description)) {
      errors.description = "ALL_ZEROS";
    } else if (!DESCRIPTION_REGEX.test(description)) {
      errors.description = "INVALID_FORMAT";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
