"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/common";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { saveGrievanceWorkflowStageMaster } from "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action";
import {
  CODE_SANITIZE,
  NAME_ONLY_SANITIZE,
  DESCRIPTION_SANITIZE,
  ENGLISH_SANITIZE,
} from "@/lib/utils/asset-validation-rules";
import { GRIEVANCE_WORKFLOW_STAGE_LIMITS } from "@/lib/validation/asset/asset-masters/grievance-workflow-stage-validation";
import {
  getGrievanceWorkflowStageMasterErrorMessage,
  parseGrievanceWorkflowStageMasterApiErrors,
} from "./error-mapping";

interface UseGrievanceWorkflowStageMasterFormHandlersProps {
  formData: GrievanceWorkflowStageMasterFormModel;
  setFormData: React.Dispatch<React.SetStateAction<GrievanceWorkflowStageMasterFormModel>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>>
  >;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmittedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (
    data: GrievanceWorkflowStageMasterFormModel
  ) => Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>;
  isEdit: boolean;
  locale: string;
  t: (key: string) => string;
}

export function useGrievanceWorkflowStageMasterFormHandlers({
  formData,
  setFormData,
  setTouched,
  setErrors,
  setIsSubmitting,
  setSubmittedOnce,
  setOpen,
  validate,
  isEdit,
  locale,
  t,
}: UseGrievanceWorkflowStageMasterFormHandlersProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [, startTransition] = useTransition();
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/grievance-workflow-stage`);
    }, 300);
  }, [router, locale, setOpen]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let sanitizedValue: string | number = value;

      if (name === "stageCode") {
        sanitizedValue = value
          .toUpperCase()
          .replace(CODE_SANITIZE, "")
          .slice(0, GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_CODE_MAX);
      } else if (name === "stageName" || name === "stageNameLocal") {
        sanitizedValue = value
          .replace(NAME_ONLY_SANITIZE, "")
          .trimStart()
          .replace(/\s{2,}/g, " ")
          .slice(0, GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_MAX);
      } else if (name === "description") {
        sanitizedValue = value
          .replace(DESCRIPTION_SANITIZE, "")
          .trimStart()
          .replace(/\s{2,}/g, " ")
          .slice(0, GRIEVANCE_WORKFLOW_STAGE_LIMITS.DESCRIPTION_MAX);
      } else if (name === "status") {
        sanitizedValue = value
          .replace(ENGLISH_SANITIZE, "")
          .trimStart()
          .replace(/\s{2,}/g, " ")
          .slice(0, GRIEVANCE_WORKFLOW_STAGE_LIMITS.STATUS_MAX);
      } else if (name === "stageOrder") {
        sanitizedValue = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
      } else if (name === "ulbTypeId") {
        sanitizedValue = value.replace(/[^0-9]/g, "");
      }

      setFormData((p) => ({ ...p, [name]: sanitizedValue }));
      setErrors((p) => ({ ...p, [name]: "" }));
    },
    [setFormData, setErrors]
  );

  const handleStatusToggle = useCallback(() => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, [setFormData, setErrors]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const fieldName = name as keyof GrievanceWorkflowStageMasterFormModel;

      setTouched((prev) => ({ ...prev, [name]: true }));

      let sanitizedValue: string | number = value;
      if (name === "status" && typeof value === "string") {
        sanitizedValue = value
          .replace(ENGLISH_SANITIZE, "")
          .trim()
          .replace(/\s{2,}/g, " ")
          .slice(0, GRIEVANCE_WORKFLOW_STAGE_LIMITS.STATUS_MAX);
      }

      const updatedFormData = {
        ...formData,
        [name]: sanitizedValue,
      };

      if (name === "status") {
        setFormData(updatedFormData);
      }

      const fieldErrors = validate(updatedFormData);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (fieldErrors[fieldName]) {
          newErrors[fieldName] = fieldErrors[fieldName];
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    },
    [formData, validate, setTouched, setErrors, setFormData]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittedOnce(true);

      const nextErrors = validate(formData);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        toast.error(t("form.validation.fixErrors"));
        return;
      }

      setIsSubmitting(true);
      try {
        const fd = new FormData();
        fd.set("locale", locale);
        fd.set("ulbTypeId", String(formData.ulbTypeId));
        fd.set("stageCode", formData.stageCode);
        fd.set("stageName", formData.stageName);
        fd.set("stageNameLocal", formData.stageNameLocal || "");
        fd.set("stageOrder", String(formData.stageOrder));
        fd.set("status", formData.status || "");
        fd.set("description", formData.description || "");
        fd.set("isActive", String(formData.isActive));

        const res = await saveGrievanceWorkflowStageMaster(
          isEdit ? String(formData.id ?? "") : "",
          fd
        );

        if (res?.ok) {
          toast.success(
            isEdit ? t("form.messages.updateSuccess") : t("form.messages.createSuccess")
          );
          setOpen(false);
          startTransition(() => {
            router.push(
              `/${locale}/assets/configuration/master-data/grievance-workflow-stage`
            );
          });
          return;
        }

        const errorPayload = res?.fieldErrors ? { fieldErrors: res.fieldErrors } : (res?.message || res?.error);
        const { fieldErrors, globalMessage } = parseGrievanceWorkflowStageMasterApiErrors(
          errorPayload,
          res?.statusCode,
          t,
          tCommon
        );

        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          setTouched((prev) => {
            const nextTouched = { ...prev };
            for (const key of Object.keys(fieldErrors)) {
              nextTouched[key] = true;
            }
            return nextTouched;
          });
        }

        toast.error(globalMessage || t("form.validation.fixErrors"));
      } catch (err) {
        toast.error(
          getGrievanceWorkflowStageMasterErrorMessage(
            err instanceof Error ? err.message : undefined,
            undefined,
            t,
            tCommon
          )
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      isEdit,
      locale,
      t,
      tCommon,
      validate,
      setErrors,
      setTouched,
      setSubmittedOnce,
      setIsSubmitting,
      setOpen,
      router,
      toast,
    ]
  );

  return {
    handleChange,
    handleStatusToggle,
    handleBlur,
    handleSubmit,
    handleClose,
  };
}
