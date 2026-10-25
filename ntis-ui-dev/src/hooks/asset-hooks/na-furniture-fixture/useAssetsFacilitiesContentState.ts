/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/common";
import { type InventoryRow } from "@/types/asset/furniture-fixture.types";
import { type InventoryLookups } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";
import { type InventoryBatchListResponse } from '@/types/asset/municipal-Asset/new-add-new-asset/inventory-batch.types';
import { convertBatchesToRows, } from "@/lib/utils/asset-utils/furnitureFixtureUtils";
import {
  resolveInventoryIds,
  buildInventoryDocumentFiles,
  buildInventoryBatchApiPayload,
  buildInventoryBatchFormData,
} from '@/lib/utils/asset-utils/new-add-new-asset/inventory-batch-payload.utils';
import {
  saveInventoryBatchForNewAssetAction,
  deleteInventoryBatchForNewAssetAction,
  getInventoryBatchesForNewAssetAction,
  updateInventoryBatchForNewAssetAction,
  fetchInventoryLookupsAction,

} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";
import { DESCRIPTION_REGEX } from "@/lib/utils/asset-validation-rules";

interface UseAssetsFacilitiesContentStateProps {
  parentAssetId: number | null;
  initialLookups: InventoryLookups;
  initialBatches: InventoryBatchListResponse | null;
}

export function useAssetsFacilitiesContentState({
  parentAssetId,
  initialLookups,
  initialBatches,
}: UseAssetsFacilitiesContentStateProps) {
  const t = useTranslations("newAddNewAsset");
  const { confirm } = useConfirm();

  const [lookups, setLookups] = useState<InventoryLookups>(() => initialLookups || {
    categories: [],
    conditions: [],
    itemNames: [],
    itemModels: [],
    departments: [],
  });

  const hasFetchedLookupsRef = useRef(false);

  useEffect(() => {
    const hasInitial = Boolean(initialLookups && (initialLookups.categories?.length || initialLookups.departments?.length));
    if (!hasInitial && !hasFetchedLookupsRef.current) {
      hasFetchedLookupsRef.current = true;
      fetchInventoryLookupsAction().then((res) => {
        if (res.success) {
          setLookups({
            categories: res.categories || [],
            conditions: res.conditions || [],
            itemNames: res.itemNames || [],
            itemModels: res.itemModels || [],
            departments: res.departments || [],
          });
        }
      }).catch((_e) => {
        console.error("Failed to load inventory lookups:", _e);
      });
    }
  }, [initialLookups]);

  const [filters, setFilters] = useState({
    category: "",
    condition: "",
  });
  const [rows, setRows] = useState<InventoryRow[]>(() => convertBatchesToRows(initialBatches?.batches || []));

  const filteredRows = rows.filter((r) => {
    const matchesCategory =
      !filters.category ||
      r.category.toLowerCase().replace(/\s+/g, "-") ===
      filters.category.toLowerCase().replace(/\s+/g, "-");
    const matchesCondition =
      !filters.condition ||
      r.condition.toLowerCase().trim() === filters.condition.toLowerCase().trim();
    return matchesCategory && matchesCondition;
  });

  const reloadRows = useCallback(async () => {
    if (!parentAssetId) return;
    try {
      const res = await getInventoryBatchesForNewAssetAction(parentAssetId);
      if (res.success && res.data) {
        const fetchedBatches = res.data as InventoryBatchListResponse;
        setRows(convertBatchesToRows(fetchedBatches.batches || []));
      }
    } catch (_e) {
      console.error("Failed to reload inventory batches:", _e);
    }
  }, [parentAssetId]);

  const hasLoadedBatchesRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialBatches && parentAssetId && hasLoadedBatchesRef.current !== parentAssetId) {
      hasLoadedBatchesRef.current = parentAssetId;
      reloadRows();
    }
  }, [initialBatches, parentAssetId, reloadRows]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<InventoryRow | null>(null);

  const [form, setForm] = useState({
    category: "",
    itemName: "",
    modelName: "",
    condition: "",
    purchaseDate: "",
    specifications: "",
    quantity: "1",
    unitValue: "",
    photoName: "",
    photoFile: null as File | null,
    owningDepartment: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceMode: "upload",
    existingInvoiceKey: "",
    invoiceNumber: "",
    invoiceDate: "",
    invoiceFileName: "",
    invoiceFile: null as File | null,
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      const documentGuid = selectedPreviewDoc?.documentGuid;
      if (!documentGuid) {
        setPreviewFile(null);
        setPreviewLoading(false);
        setPreviewError(null);
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewFile(null);

      try {
        const { fetchAssetDocumentFileByGuid } = await import(
          "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
        );
        const res = await fetchAssetDocumentFileByGuid(documentGuid, "view");
        if (cancelled) return;
        if (!res || res.error || !res.base64) {
          throw new Error(res?.error || "Failed to load file");
        }

        const binaryStr = atob(res.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
          type: res.contentType || "application/octet-stream",
        });

        const objectUrl = URL.createObjectURL(blob);
        setPreviewFile({
          objectUrl,
          contentType: res.contentType || "application/octet-stream",
          fileName: selectedPreviewDoc.fileName || "document",
        });
        setPreviewLoading(false);
      } catch (error) {
        if (cancelled) return;
        setPreviewFile(null);
        setPreviewLoading(false);
        setPreviewError(
          error instanceof Error ? error.message : "Failed to load file"
        );
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selectedPreviewDoc]);

  const handlePreview = async (row: InventoryRow, type: "photo" | "invoice") => {
    if (!row.isRegistered) {
      if (type === "photo" && form.photoFile) {
        window.open(URL.createObjectURL(form.photoFile), "_blank");
      } else if (type === "invoice" && invoiceForm.invoiceFile) {
        window.open(URL.createObjectURL(invoiceForm.invoiceFile), "_blank");
      } else {
        toast.error("No file available to preview locally.");
      }
      return;
    }

    const doc = row.documents?.find(
      (d: any) =>
        (type === "photo" &&
          (d.documentTypeId === 1 ||
            String(d.documentTypeCode || "")
              .toLowerCase()
              .includes("image"))) ||
        (type === "invoice" &&
          (d.documentTypeId === 2 ||
            String(d.documentTypeCode || "")
              .toLowerCase()
              .includes("invoice")))
    );

    if (doc) {
      setSelectedPreviewDoc({
        name:
          doc.fileName ||
          (type === "photo" ? "Inventory Photo" : "Inventory Invoice"),
        fileName: doc.fileName,
        documentGuid: doc.documentGuid,
      });
    } else {
      toast.error("Document not found on the server.");
    }
  };

  const triggerFileDownload = async (guid: string, fileName: string) => {
    try {
      const { fetchAssetDocumentFileByGuid } = await import(
        "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
      );
      const res = await fetchAssetDocumentFileByGuid(guid, "download");
      if (!res || res.error || !res.base64) {
        throw new Error(res?.error || "Failed to download file");
      }

      const binaryStr = atob(res.base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: res.contentType || "application/octet-stream",
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (_e) {
      toast.error("Failed to download file");
    }
  };

  const handleDownload = (row: InventoryRow, type: "photo" | "invoice") => {
    if (!row.isRegistered) {
      if (type === "photo" && form.photoFile) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(form.photoFile);
        link.download = form.photoName || "inventory-photo";
        link.click();
      } else if (type === "invoice" && invoiceForm.invoiceFile) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(invoiceForm.invoiceFile);
        link.download = invoiceForm.invoiceFileName || "invoice";
        link.click();
      } else {
        toast.error("No local file available to download.");
      }
      return;
    }

    const doc = row.documents?.find(
      (d: any) =>
        (type === "photo" &&
          (d.documentTypeId === 1 ||
            String(d.documentTypeCode || "")
              .toLowerCase()
              .includes("image"))) ||
        (type === "invoice" &&
          (d.documentTypeId === 2 ||
            String(d.documentTypeCode || "")
              .toLowerCase()
              .includes("invoice")))
    );

    if (doc && doc.documentGuid) {
      triggerFileDownload(doc.documentGuid, doc.fileName || "document");
    } else {
      toast.error("Document not available for download.");
    }
  };

  const resetForm = () => {
    setForm({
      category: "",
      itemName: "",
      modelName: "",
      condition: "",
      purchaseDate: "",
      specifications: "",
      quantity: "1",
      unitValue: "",
      photoName: "",
      photoFile: null,
      owningDepartment: "",
    });
    setInvoiceForm({
      invoiceMode: "upload",
      existingInvoiceKey: "",
      invoiceNumber: "",
      invoiceDate: "",
      invoiceFileName: "",
      invoiceFile: null,
    });
    setEditingRow(null);
  };

  const openDrawerForCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (row: InventoryRow) => {
    setEditingRow(row);
    const matchedCat = (initialLookups.categories || []).find(
      (c: any) =>
        c.typeCode === row.category ||
        c.typeName.toLowerCase().replace(/\s+/g, "-") === row.category
    );
    const categoryName = matchedCat?.typeName || "";

    const rowPhotoDoc = row.documents?.find(
      (d: any) => d.documentTypeId === 1 || String(d.documentTypeCode || '').toLowerCase().includes("photo") || String(d.documentTypeCode || '').toLowerCase().includes("image")
    );
    const rowInvoiceDoc = row.documents?.find(
      (d: any) => d.documentTypeId === 2 || String(d.documentTypeCode || '').toLowerCase().includes("invoice")
    );
    const resolvedPhotoName = row.photoName || rowPhotoDoc?.fileName || rowPhotoDoc?.originalFileName || "";
    const resolvedInvoiceFileName = row.invoice?.invoiceFileName || rowInvoiceDoc?.fileName || rowInvoiceDoc?.originalFileName || "";

    setForm({
      category: categoryName,
      itemName: row.itemName,
      modelName: row.modelName,
      condition: row.condition,
      purchaseDate: row.purchaseDate || "",
      specifications: row.specifications === "NA" ? "" : row.specifications,
      quantity: String(row.quantity),
      unitValue: String(row.unitValue),
      photoName: resolvedPhotoName,
      photoFile: null,
      owningDepartment: row.owningDepartment || "",
    });

    if (row.invoice) {
      setInvoiceForm({
        invoiceMode: "upload",
        existingInvoiceKey: "",
        invoiceNumber: row.invoice.invoiceNumber || "",
        invoiceDate: row.invoice.invoiceDate || "",
        invoiceFileName: resolvedInvoiceFileName,
        invoiceFile: null,
      });
    } else {
      setInvoiceForm({
        invoiceMode: "upload",
        existingInvoiceKey: "",
        invoiceNumber: "",
        invoiceDate: "",
        invoiceFileName: resolvedInvoiceFileName,
        invoiceFile: null,
      });
    }

    setIsDrawerOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        photoFile: file,
        photoName: file.name,
      }));
    }
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceForm((prev) => ({
        ...prev,
        invoiceFile: file,
        invoiceFileName: file.name,
      }));
    }
  };

  const handleSaveFacility = async () => {
    if (!parentAssetId) {
      toast.error(t("parentAssetIdWarning"));
      return;
    }
    if (
      !form.category ||
      !form.itemName ||
      !form.condition ||
      !form.owningDepartment ||
      !form.quantity ||
      !form.unitValue
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    if (Number(form.unitValue) <= 0) {
      toast.error("Unit Value must be greater than 0.");
      return;
    }

    if (form.specifications && form.specifications !== "NA") {
      if (!DESCRIPTION_REGEX.test(form.specifications)) {
        toast.error(
          "Invalid specifications. Please avoid duplicate spaces, consecutive punctuation, or invalid characters."
        );
        return;
      }
    }

    try {
      const ids = resolveInventoryIds(
        form,
        lookups.categories,
        lookups.itemNames,
        lookups.itemModels,
        lookups.conditions,
        lookups.departments
      );

      if (editingRow && editingRow.batchId) {
        const photoReplaced = !!form.photoFile;
        const photoDeleted = !form.photoName && !form.photoFile;
        const invoiceReplaced = !!invoiceForm.invoiceFile;
        const invoiceDeleted = !invoiceForm.invoiceFileName && !invoiceForm.invoiceFile;

        // ── Step 1: Clean up deleted document records on the server ──────
        const existingPhotoDoc = editingRow.documents?.find(
          (d: any) =>
            d.documentTypeId === 1 ||
            String(d.documentTypeCode || '').toLowerCase().includes("photo") ||
            String(d.documentTypeCode || '').toLowerCase().includes("image")
        );
        const existingInvoiceDoc = editingRow.documents?.find(
          (d: any) =>
            d.documentTypeId === 2 ||
            String(d.documentTypeCode || '').toLowerCase().includes("invoice")
        );

        const { deleteInventoryDocumentAction } = await import(
          "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions"
        );

        if (existingPhotoDoc && (photoReplaced || photoDeleted)) {
          const docId = existingPhotoDoc.id || existingPhotoDoc.inventoryDocumentId;
          if (docId) {
            try { await deleteInventoryDocumentAction(docId); } catch (_e) {
              console.warn("Failed to delete stale photo record:", _e);
            }
          }
        }

        if (existingInvoiceDoc && (invoiceReplaced || invoiceDeleted)) {
          const docId = existingInvoiceDoc.id || existingInvoiceDoc.inventoryDocumentId;
          if (docId) {
            try { await deleteInventoryDocumentAction(docId); } catch (_e) {
              console.warn("Failed to delete stale invoice record:", _e);
            }
          }
        }

        // ── Step 2: Build filename strings for the batch record ───────────
        const targetPhotoFileName = photoReplaced
          ? form.photoFile!.name
          : photoDeleted
            ? ""
            : form.photoName || "";

        const targetInvoiceFileName = invoiceReplaced
          ? invoiceForm.invoiceFile!.name
          : invoiceDeleted
            ? ""
            : invoiceForm.invoiceFileName || "";

        // ── Step 3: Build files and metadata for the batch update ────────
        const { documentFiles, documentMetadata } = buildInventoryDocumentFiles(
          form.photoFile,
          invoiceForm.invoiceFile
        );

        // ── Step 4: In-place UPDATE of the existing batchId with files ─────
        const updatePayload: any = {
          itemName: form.itemName,
          modelBrand: form.modelName,
          specifications: form.specifications?.trim() || "NA",
          purchaseDate: form.purchaseDate,
          condition: form.condition,
          unitValue: Number(form.unitValue),
          invoiceNumber: invoiceForm.invoiceNumber || "",
          invoiceDate: invoiceForm.invoiceDate || "",
          invoiceFileName: targetInvoiceFileName,
          owningDepartment: form.owningDepartment,
          photoFileName: targetPhotoFileName,
          InventoryItemNameId: ids.n || undefined,
          InventoryItemModelId: ids.m || undefined,
          InventoryItemConditionId: ids.cond?.id || undefined,
          OwningDepartmentId: ids.d || undefined,
          DocumentFiles: documentFiles.length > 0 ? documentFiles : undefined,
          documentMetadataJson: documentMetadata ? JSON.stringify(documentMetadata) : undefined,
        };

        const res = await updateInventoryBatchForNewAssetAction(
          editingRow.batchId,
          updatePayload
        );
        if (!res.success) {
          toast.error(res.error || "Failed to update asset.");
          return;
        }

        toast.success("Asset / Facility updated successfully!");
      } else {
        // ── CREATE / ADD NEW ROW path ──────────────────────────────────────
        const apiPayload = buildInventoryBatchApiPayload(parentAssetId, ids, {
          specifications: form.specifications,
          purchaseDate: form.purchaseDate,
          quantity: Number(form.quantity),
          unitValue: Number(form.unitValue),
          invoiceNumber: invoiceForm.invoiceNumber,
          invoiceDate: invoiceForm.invoiceDate,
          invoiceFileName: invoiceForm.invoiceFileName,
          photoName: form.photoName,
        });

        const { documentFiles, documentMetadata } = buildInventoryDocumentFiles(
          form.photoFile,
          invoiceForm.invoiceFile
        );

        const formDataPayload = buildInventoryBatchFormData(
          apiPayload,
          documentFiles,
          documentMetadata
        );

        const res = await saveInventoryBatchForNewAssetAction(formDataPayload);
        if (!res.success) {
          toast.error(res.error || "Failed to save asset.");
          return;
        }

        toast.success("Asset / Facility saved successfully!");
      }

      setIsDrawerOpen(false);
      resetForm();
      await setTimeout(() => { reloadRows(); }, 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to save batch.");
    }
  };

  const handleDeleteRow = (id: number | string) => {
    const rowToDelete = rows.find((r) => String(r.id) === String(id));
    if (!rowToDelete) return;

    confirm({
      title: "Delete Asset / Facility",
      description: "Are you sure you want to delete this asset/facility?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "delete",
      onConfirm: async () => {
        if (!rowToDelete.isRegistered) {
          setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          toast.success("Item removed.");
          return;
        }

        const batchId = rowToDelete.batchId || Number(id);
        const toastId = toast.loading("Deleting item...");
        try {
          const res = await deleteInventoryBatchForNewAssetAction(batchId);
          if (res.success) {
            toast.success("Deleted successfully!", { id: toastId });
            await setTimeout(() => { reloadRows(); }, 0);
          } else {
            toast.error(res.error || "Failed to delete.", { id: toastId });
          }
        } catch (_e) {
          toast.error("An error occurred while deleting.", { id: toastId });
        }
      },
    });
  };

  return {
    t,
    lookups,
    filters,
    setFilters,
    rows,
    filteredRows,
    isDrawerOpen,
    setIsDrawerOpen,
    isInvoiceDrawerOpen,
    setIsInvoiceDrawerOpen,
    editingRow,
    form,
    setForm,
    invoiceForm,
    setInvoiceForm,
    photoInputRef,
    invoiceInputRef,
    selectedPreviewDoc,
    setSelectedPreviewDoc,
    previewFile,
    previewLoading,
    previewError,
    handlePreview,
    handleDownload,
    openDrawerForCreate,
    openDrawerForEdit,
    handlePhotoUpload,
    handleInvoiceUpload,
    handleSaveFacility,
    handleDeleteRow,
    resetForm,
  };
}
