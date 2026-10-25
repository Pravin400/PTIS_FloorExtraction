"use client";

import { useCallback } from "react";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import {
  validateGrievanceWorkflowStageData,
  GRIEVANCE_WORKFLOW_STAGE_LIMITS,
} from "@/lib/validation/asset/asset-masters/grievance-workflow-stage-validation";

interface UseGrievanceWorkflowStageMasterFormValidationProps {
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useGrievanceWorkflowStageMasterFormValidation({
  submittedOnce,
  touched,
  errors,
  t,
}: UseGrievanceWorkflowStageMasterFormValidationProps) {
  const validate = useCallback(
    (data: GrievanceWorkflowStageMasterFormModel): Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>> => {
      const { errors: validationErrors } = validateGrievanceWorkflowStageData(data);
      const formErrors: Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>> = {};

      if (validationErrors.stageCode === "REQUIRED") {
        formErrors.stageCode = t("form.validation.stageCodeRequired");
      } else if (validationErrors.stageCode === "MAX_LENGTH") {
        formErrors.stageCode = t("form.validation.stageCodeMaxLength", {
          count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_CODE_MAX,
        });
      } else if (validationErrors.stageCode === "ALL_ZEROS") {
        formErrors.stageCode = t("form.validation.invalidFormat");
      } else if (validationErrors.stageCode === "INVALID_FORMAT") {
        formErrors.stageCode = t("form.validation.stageCodeFormat");
      }

      if (validationErrors.stageName === "REQUIRED") {
        formErrors.stageName = t("form.validation.stageNameRequired");
      } else if (validationErrors.stageName === "MAX_LENGTH") {
        formErrors.stageName = t("form.validation.stageNameMaxLength", {
          count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_MAX,
        });
      } else if (validationErrors.stageName === "ALL_ZEROS" || validationErrors.stageName === "INVALID_FORMAT") {
        formErrors.stageName = t("form.validation.stageNameFormat");
      }

      if (validationErrors.stageNameLocal === "MAX_LENGTH") {
        formErrors.stageNameLocal = t("form.validation.stageNameLocalMaxLength", {
          count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_LOCAL_MAX,
        });
      } else if (validationErrors.stageNameLocal === "INVALID_FORMAT") {
        formErrors.stageNameLocal = t("form.validation.stageNameLocalFormat");
      }

      if (validationErrors.stageOrder === "REQUIRED") {
        formErrors.stageOrder = t("form.validation.stageOrderRequired");
      } else if (validationErrors.stageOrder === "OUT_OF_RANGE") {
        const num = Number(data.stageOrder);
        if (num > GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MAX) {
          formErrors.stageOrder = t("form.validation.stageOrderMax", {
            count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MAX,
          });
        } else {
          formErrors.stageOrder = t("form.validation.stageOrderInvalid");
        }
      }

      if (validationErrors.status === "REQUIRED") {
        formErrors.status = t("form.validation.statusRequired");
      } else if (validationErrors.status === "MAX_LENGTH") {
        formErrors.status = t("form.validation.statusMaxLength", {
          count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.STATUS_MAX,
        });
      } else if (validationErrors.status === "INVALID_FORMAT") {
        formErrors.status = t("form.validation.statusFormat");
      }

      if (validationErrors.description === "MAX_LENGTH") {
        formErrors.description = t("form.validation.descriptionMaxLength", {
          count: GRIEVANCE_WORKFLOW_STAGE_LIMITS.DESCRIPTION_MAX,
        });
      } else if (validationErrors.description === "ALL_ZEROS") {
        formErrors.description = t("form.validation.invalidFormat");
      } else if (validationErrors.description === "INVALID_FORMAT") {
        formErrors.description = t("form.validation.descriptionFormat");
      }

      return formErrors;
    },
    [t]
  );

  const showError = useCallback(
    (field: keyof GrievanceWorkflowStageMasterFormModel): boolean => {
      return (submittedOnce || touched[field]) && !!errors[field];
    },
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
