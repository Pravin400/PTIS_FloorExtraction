"use client";

import { useState, useCallback, useMemo, startTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { UploadDownloadFormModel } from "@/types/PropertyMedia/PropertyMedia.types";
import { useQueryTransition } from "@/hooks/useQueryTransition";
import { validateUploadDownloadForm } from "@/lib/validations/PropertyMedia/uploadDownload.validation";
import { mapPropertyMediaApiError } from "@/lib/utils/PropertyMedia/propertyMediaHelper";

import { useUploadDownloadFiles } from "./useUploadDownloadFiles";
import { usePropertyNumberOptions } from "./usePropertyNumberOptions";
import { useUploadDownloadNavigation } from "./useUploadDownloadNavigation";
import { useLocalDeviceUpload } from "./useLocalDeviceUpload";
import { useUploadDownloadSubmit } from "./useUploadDownloadSubmit";

interface UseUploadDownloadProps {
  onSuccess?: () => void;
  categoryOptions?: unknown;
}

export function useUploadDownload({
  onSuccess,
}: UseUploadDownloadProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("propertyMedia");
  const tCommon = useTranslations("common");

  // URL Query Parameters
  const currentCategory = searchParams?.get("category") || "";
  const currentSubCategory = searchParams?.get("subCategory") || "";
  const currentZone = searchParams?.get("zone") || "";
  const currentWardParam = searchParams?.get("ward") || "";
  const currentPreviewId = searchParams?.get("previewId") || "";
  const currentWards = useMemo(
    () => (currentWardParam ? currentWardParam.split(",").filter(Boolean) : []),
    [currentWardParam]
  );

  const { isPending, updateQueries } = useQueryTransition();

  // Navigation (Drawer open state and closing transitions)
  const { open, setOpen, closeAndRoute, handleCancel } = useUploadDownloadNavigation({
    locale,
  });

  // Tab State
  const [activeTab, setActiveTab] = useState<"upload" | "download">("upload");
  const uploadSourceTab =
    (searchParams?.get("sourceTab") as "server" | "device") ||
    (currentPreviewId ? "device" : "server");

  // Form Data State
  const [formData, setFormData] = useState<UploadDownloadFormModel>(() => ({
    activeTab: "upload",
    upload: {
      category: currentCategory,
      subCategory: currentSubCategory,
    },
    download: {
      category: "",
      subCategory: "",
      zone: currentZone,
      ward: currentWards,
      propertyFrom: "",
      propertyTo: "",
    },
  }));

  // Sync category, subCategory, zone, and ward with URL during render
  const wardKey = currentWards.join(",");
  const [prevUrlState, setPrevUrlState] = useState({
    category: currentCategory,
    subCategory: currentSubCategory,
    zone: currentZone,
    wardKey,
  });



  // Validation & Error State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Sync category, subCategory, zone, and ward with URL during render

  if (
    prevUrlState.category !== currentCategory ||
    prevUrlState.subCategory !== currentSubCategory ||
    prevUrlState.zone !== currentZone ||
    prevUrlState.wardKey !== wardKey
  ) {
    setPrevUrlState({
      category: currentCategory,
      subCategory: currentSubCategory,
      zone: currentZone,
      wardKey,
    });
    setFormData((prev) => {
      const isUploadSame =
        prev.upload.category === currentCategory &&
        prev.upload.subCategory === currentSubCategory;
      const isDownloadZoneSame = prev.download.zone === currentZone;
      const isDownloadWardSame =
        prev.download.ward?.length === currentWards.length &&
        prev.download.ward?.every((w, i) => w === currentWards[i]);

      if (isUploadSame && isDownloadZoneSame && isDownloadWardSame) {
        return prev;
      }

      return {
        ...prev,
        upload: {
          ...prev.upload,
          category: currentCategory,
          subCategory: currentSubCategory,
        },
        download: {
          ...prev.download,
          zone: currentZone,
          ward: currentWards,
        },
      };
    });
  }

  // File Upload State & Handlers
  const {
    fileInputRef,
    selectedFiles,
    fileDisplayValue,
    handleBrowseClick,
    handleFileInputChange,
    handleClearFiles,
    prepareFilesPayload,
  } = useUploadDownloadFiles({ t });

  // Property Numbers Fetching & Options for Download Tab
  const {
    propertyFromOptions,
    propertyToOptions,
    isLoadingPropertyFrom,
    isLoadingPropertyTo,
    resetAllPropertyOptions,
    resetPropertyToOptions,
  } = usePropertyNumberOptions({
    zone: formData.download.zone,
    ward: formData.download.ward,
    propertyFrom: formData.download.propertyFrom,
  });

  // API Error Mapping
  const mapApiError = useCallback(
    (result: { statusCode?: number; message?: string }) =>
      mapPropertyMediaApiError(result, t, tCommon),
    [t, tCommon]
  );

  // Local Device Media Upload
  const { isUploadingLocal, handleLocalUpload } = useLocalDeviceUpload({
    category: formData.upload.category,
    subCategory: formData.upload.subCategory,
    selectedFiles,
    onClearFiles: handleClearFiles,
    updateQueries,
    setTouched,
    setErrors,
    t,
    mapApiError,
  });

  // Validation Logic
  const validate = useCallback(
    (data: UploadDownloadFormModel): Record<string, string> =>
      validateUploadDownloadForm(data, t),
    [t]
  );

  const showError = useCallback(
    (field: string): boolean =>
      (submittedOnce || touched[field]) && Boolean(errors[field]),
    [submittedOnce, touched, errors]
  );

  // Submit Handler
  const { isSubmitting, handleSubmit } = useUploadDownloadSubmit({
    formData,
    activeTab,
    uploadSourceTab,
    previewId: currentPreviewId,
    validate,
    setErrors,
    setSubmittedOnce,
    onSuccess,
    closeAndRoute,
    t,
    mapApiError,
  });

  // Pagination Handlers
  const handlePageChange = useCallback(
    (page: number) => {
      updateQueries({ page });
    },
    [updateQueries]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      updateQueries({ pageSize, page: 1 });
    },
    [updateQueries]
  );

  // Tab Change Handler
  const handleTabChange = useCallback(
    (tab: "upload" | "download") => {
      setActiveTab(tab);
      setFormData({
        activeTab: tab,
        upload: {
          category: "",
          subCategory: "",
        },
        download: {
          category: "",
          subCategory: "",
          zone: "",
          ward: [],
          propertyFrom: "",
          propertyTo: "",
        },
      });

      handleClearFiles();
      resetAllPropertyOptions();
      setErrors({});
      setTouched({});
      setSubmittedOnce(false);

      startTransition(() => {
        router.replace(pathname, { scroll: false });
      });
    },
    [pathname, router, handleClearFiles, resetAllPropertyOptions]
  );

  const handleUploadSourceTabChange = useCallback(
    (tab: "server" | "device") => {
      handleClearFiles();
      updateQueries({ sourceTab: tab, previewId: null, page: 1 });
    },
    [handleClearFiles, updateQueries]
  );

  // Filter Handlers
  const handleFilterZoneChange = useCallback(
    (_name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        download: {
          ...prev.download,
          zone: value,
          ward: [],
          propertyFrom: "",
          propertyTo: "",
        },
      }));
      resetAllPropertyOptions();

      updateQueries({
        zone: value ? String(value) : null,
        ward: null,
        page: 1,
      });
    },
    [resetAllPropertyOptions, updateQueries]
  );

  const handleFilterWardsChange = useCallback(
    (selectedWards: string[]) => {
      setFormData((prev) => ({
        ...prev,
        download: {
          ...prev.download,
          ward: selectedWards,
          propertyFrom: "",
          propertyTo: "",
        },
      }));
      resetPropertyToOptions();

      updateQueries({
        ward: selectedWards && selectedWards.length > 0 ? selectedWards.join(",") : null,
        page: 1,
      });
    },
    [resetPropertyToOptions, updateQueries]
  );

  const handleFilterPropertyFromChange = useCallback(
    (_name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        download: {
          ...prev.download,
          propertyFrom: value,
          propertyTo: "",
        },
      }));
      resetPropertyToOptions();
    },
    [resetPropertyToOptions]
  );

  const handleFilterPropertyToChange = useCallback(
    (_name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        download: {
          ...prev.download,
          propertyTo: value,
        },
      }));
    },
    []
  );

  // Field Change Handlers
  const handleUploadFieldChange = useCallback(
    (field: keyof UploadDownloadFormModel["upload"], value: unknown) => {
      setFormData((prev) => {
        const updatedUpload = {
          ...prev.upload,
          [field]: value,
          ...(field === "category" ? { subCategory: "" } : {}),
        };

        const updated = {
          ...prev,
          upload: updatedUpload,
        };

        if (touched[`upload.${field}`] || submittedOnce) {
          const fieldErrors = validate(updated);
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            const errorKey = `upload.${field}`;
            if (fieldErrors[errorKey]) {
              nextErrors[errorKey] = fieldErrors[errorKey];
            } else {
              delete nextErrors[errorKey];
            }
            if (field === "category") {
              delete nextErrors["upload.subCategory"];
            }
            return nextErrors;
          });
        }

        return updated;
      });

      if (field === "category") {
        handleClearFiles();
        updateQueries({
          category: value ? String(value) : null,
          subCategory: null,
          page: 1,
          previewId: null,
        });
      }

      if (field === "subCategory") {
        handleClearFiles();
        updateQueries({
          subCategory: value ? String(value) : null,
          page: 1,
          previewId: null,
        });
      }
    },
    [touched, submittedOnce, validate, updateQueries, handleClearFiles]
  );

  const handleDownloadFieldChange = useCallback(
    (field: keyof UploadDownloadFormModel["download"], value: unknown) => {
      setFormData((prev) => {
        const updated = {
          ...prev,
          download: { ...prev.download, [field]: value },
        };

        if (touched[`download.${field}`] || submittedOnce) {
          const fieldErrors = validate(updated);
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            const errorKey = `download.${field}`;
            if (fieldErrors[errorKey]) {
              nextErrors[errorKey] = fieldErrors[errorKey];
            } else {
              delete nextErrors[errorKey];
            }
            return nextErrors;
          });
        }

        return updated;
      });

      if (field === "category") {
        updateQueries({
          category: value ? String(value) : null,
          subCategory: null,
        });
      }
    },
    [touched, submittedOnce, validate, updateQueries]
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => {
        const fieldErrors = validate(formData);
        const newErrors = { ...prev };
        if (fieldErrors[field]) {
          newErrors[field] = fieldErrors[field];
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    },
    [formData, validate]
  );

  const handleClearSelectedFiles = useCallback(() => {
    handleClearFiles();
    if (currentPreviewId) {
      updateQueries({ previewId: null, page: 1 });
    }
  }, [handleClearFiles, currentPreviewId, updateQueries]);

  return {
    // Drawer & Tab States
    open,
    setOpen,
    activeTab,
    setActiveTab: handleTabChange,
    uploadSourceTab,
    setUploadSourceTab: handleUploadSourceTabChange,
    isUploadingLocal,
    handleLocalUpload,

    // Form States & Errors
    formData,
    errors,
    touched,
    isSubmitting,
    showError,

    // Multiple Files Upload State & Handlers
    fileInputRef,
    selectedFiles,
    fileDisplayValue,
    handleBrowseClick,
    handleFileInputChange,
    handleClearFiles: handleClearSelectedFiles,
    prepareFilesPayload,

    // Pagination & URL State
    previewId: currentPreviewId,
    page: Number(searchParams?.get("page")) || 1,
    pageSize: Number(searchParams?.get("pageSize")) || 10,
    isPending,
    handlePageChange,
    handlePageSizeChange,

    // Filter Handlers
    handleFilterZoneChange,
    handleFilterWardsChange,
    propertyFromOptions,
    propertyToOptions,
    isLoadingPropertyFrom,
    isLoadingPropertyTo,
    handleFilterPropertyFromChange,
    handleFilterPropertyToChange,

    // Handlers
    handleUploadFieldChange,
    handleDownloadFieldChange,
    handleBlur,
    handleSubmit,
    handleCancel,
    closeAndRoute,

    t,
    tCommon,
  };
}
