/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryRow, InventoryType, InventoryInvoice } from "@/types/asset/furniture-fixture.types";
import { toast } from "sonner";

export function convertBatchesToRows(batches: any[]): InventoryRow[] {
  return batches.map((batch) => ({
    id: batch.batchId, // Use batchId as row id
    category: (batch.names?.inventoryType || batch.inventoryType || "").toLowerCase().replace(/\s+/g, "-") as InventoryType,
    itemName: batch.names?.itemName || batch.itemName || "",
    modelName: batch.names?.modelBrand || batch.modelBrand || "",
    specifications: batch.specifications ?? "NA",
    purchaseDate: batch.purchaseDate?.split("T")[0], // Extract date part
    condition: batch.names?.condition || batch.condition || "",
    quantity: batch.quantity,
    unitValue: batch.unitValue,
    total: batch.totalBatchValue,
    owningDepartment: batch.names?.owningDepartment || batch.owningDepartment || undefined,
    photoName: batch.photoFileName ?? undefined,
    invoice: batch.invoiceNumber
      ? {
        invoiceMode: "direct",
        invoiceNumber: batch.invoiceNumber,
        invoiceDate: batch.invoiceDate?.split("T")[0] ?? "",
        invoiceFileName: batch.invoiceFileName ?? "",
      }
      : undefined,
    unitCV: batch.totalBatchCV / batch.quantity,
    totalCV: batch.totalBatchCV,
    batchId: batch.batchId,
    isRegistered: !!batch.batchId || batch.isRegistered,
    documents: batch.documents || [],
    registeredUnits: batch.units?.map((u: any) => ({
      assetId: u.assetId,
      assetNo: u.assetNo,
      assetName: u.assetName,
      unitNumber: u.unitNumber,
      unitPurchaseValue: u.unitPurchaseValue ?? batch.unitValue,
      unitCapitalValue: u.unitCapitalValue ?? 0,
      ageInYears: 0,
      depreciationRate: u.depreciationRate ?? 0.1,
      conditionFactor: u.conditionFactor ?? 1.0,
      cvFormula: u.cvFormula ?? "",
      condition: u.condition ?? "",
      serialNumber: u.serialNumber,
      assetTag: u.assetTag,
      dynamicAttributes: u.dynamicAttributes,
    })),
  }));
}

export async function uploadBatchDocuments(
  batchId: number,
  _finalModuleId: number,
  photoFile?: File,
  invoiceFile?: File,
  _draftInvoice?: InventoryInvoice | null,
  showIndividualToasts: boolean = false
): Promise<{ photoSuccess: boolean; invoiceSuccess: boolean; allSuccess: boolean }> {
  let uploadInventoryDocumentAction: any;
  let fetchInventoryDocumentTypesAction: any;
  let types: any[] = [];
  
  const isNewWizard = typeof window !== 'undefined' && window.location.pathname.includes("new-add-new-asset");
  
  try {
    if (isNewWizard) {
      const actions = await import("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions");
      uploadInventoryDocumentAction = actions.uploadInventoryDocumentAction;
      fetchInventoryDocumentTypesAction = actions.fetchInventoryDocumentTypesAction;
    } else {
      const actions = await import("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions");
      uploadInventoryDocumentAction = actions.uploadInventoryDocumentAction;
      fetchInventoryDocumentTypesAction = actions.fetchInventoryDocumentTypesAction;
    }
    
    const typesRes = await fetchInventoryDocumentTypesAction();
    if (typesRes.success && typesRes.data) {
      types = typesRes.data;
    }
  } catch (e) {
    console.error("Failed to fetch inventory document types", e);
  }

  // Find the appropriate Type IDs
  let photoTypeId = 1;
  let invoiceTypeId = 2;
  
  if (types.length > 0) {
    const photoType = types.find(t => t.documentTypeName?.toLowerCase().includes("photo") || t.documentTypeCode?.toLowerCase().includes("photo"));
    if (photoType) photoTypeId = photoType.id || photoType.inventoryDocumentTypeId || photoType.InventoryDocumentTypeId || 1;
    
    const invoiceType = types.find(t => t.documentTypeName?.toLowerCase().includes("invoice") || t.documentTypeCode?.toLowerCase().includes("invoice"));
    if (invoiceType) invoiceTypeId = invoiceType.id || invoiceType.inventoryDocumentTypeId || invoiceType.InventoryDocumentTypeId || 2;
  }

  const uploadSingle = async (file: File, isPhoto: boolean) => {
    const fd = new FormData();
    const uniqueName = `${isPhoto ? 'photo' : 'invoice'}_${file.name}`;
    const renamedFile = new File([file], uniqueName, { type: file.type });
    fd.append("File", renamedFile);
    fd.append("InventoryBatchId", String(batchId));
    fd.append("DocumentTypeId", String(isPhoto ? photoTypeId : invoiceTypeId));
    fd.append("DisplayOrder", "1");
    fd.append("Remarks", isPhoto ? "Inventory Photo" : "Inventory Invoice");
    fd.append("ModuleId", "2");
    
    return await uploadInventoryDocumentAction(fd);
  };

  let photoSuccess = true;
  let invoiceSuccess = true;

  if (photoFile) {
    try {
      const res = await uploadSingle(photoFile, true);
      if (!res.success) {
        photoSuccess = false;
        if (showIndividualToasts) toast.error(`Photo upload failed: ${res.error || "Unknown error"}`);
      } else if (showIndividualToasts) {
        toast.success(`Photo updated successfully!`);
      }
    } catch (e: any) {
      photoSuccess = false;
      if (showIndividualToasts) toast.error(`Photo upload exception: ${e.message}`);
    }
  }

  if (invoiceFile) {
    try {
      const res = await uploadSingle(invoiceFile, false);
      if (!res.success) {
        invoiceSuccess = false;
        if (showIndividualToasts) toast.error(`Invoice upload failed: ${res.error || "Unknown error"}`);
      } else if (showIndividualToasts) {
        toast.success(`Invoice updated successfully!`);
      }
    } catch (e: any) {
      invoiceSuccess = false;
      if (showIndividualToasts) toast.error(`Invoice upload exception: ${e.message}`);
    }
  }

  if (!showIndividualToasts && (photoFile || invoiceFile)) {
    if (!photoSuccess || !invoiceSuccess) {
      toast.error(`Some documents failed to upload. Please check and try again.`);
    } else {
      toast.success(`Batch documents uploaded successfully!`);
    }
  }

  return { photoSuccess, invoiceSuccess, allSuccess: photoSuccess && invoiceSuccess };
}

export async function handlePreviewDocument(row: InventoryRow, type: 'photo' | 'invoice') {
  // If not registered yet, preview the local ObjectURL/Blob
  if (!row.isRegistered) {
    if (type === 'photo' && row.photoUrl) {
      window.open(row.photoUrl, "_blank");
    } else if (type === 'invoice' && row.invoice?.invoiceFile) {
      window.open(URL.createObjectURL(row.invoice.invoiceFile), "_blank");
    } else {
      toast.error("No file available to preview locally.");
    }
    return;
  }

  // If registered, fetch from API
  const batchId = row.batchId;
  if (!batchId) {
    return toast.error("Batch ID not found for this row.");
  }

  try {
    // Use Server Actions to securely fetch documents and avoid CORS/Auth issues
    const { fetchInventoryDocumentsAction, fetchDocumentByGuidAction } = await import("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions");

    const docResponse = await fetchInventoryDocumentsAction(batchId);
    if (!docResponse.success || !docResponse.data) {
      return toast.error((docResponse as any).error || (docResponse as any).message || "Failed to fetch documents");
    }

    const documents = docResponse.data as any[];
    let targetDoc = null;

    if (type === 'photo' && row.photoName) {
      targetDoc = documents.find((d: any) =>
        d.fileName === row.photoName || d.fileName === `photo_${row.photoName}` ||
        d.originalFileName === row.photoName || d.originalFileName === `photo_${row.photoName}`
      );
      // Fallback: match by document type code if filename doesn't exactly match
      if (!targetDoc) {
        targetDoc = documents.find((d: any) => d.documentTypeCode?.toLowerCase().includes("photo"));
      }
    } else if (type === 'invoice' && row.invoice?.invoiceFileName) {
      targetDoc = documents.find((d: any) =>
        d.fileName === row.invoice!.invoiceFileName || d.fileName === `invoice_${row.invoice!.invoiceFileName}` ||
        d.originalFileName === row.invoice!.invoiceFileName || d.originalFileName === `invoice_${row.invoice!.invoiceFileName}`
      );
      // Fallback: match by document type code if filename doesn't exactly match
      if (!targetDoc) {
        targetDoc = documents.find((d: any) => d.documentTypeCode?.toLowerCase().includes("invoice"));
      }
    }

    if (!targetDoc) {
      return toast.error("Document not found on the server.");
    }

    // Use documentGuid instead of id for the new API
    const guid = targetDoc.documentGuid || targetDoc.DocumentGuid;
    if (!guid) {
      return toast.error("Document GUID is missing, cannot preview.");
    }

    const fileRes = await fetchDocumentByGuidAction(guid);
    if (!fileRes.success || !fileRes.data) {
      return toast.error(fileRes.error || "Failed to download document");
    }

    // Convert base64 to Blob
    const byteCharacters = atob(fileRes.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileRes.mimeType || 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

  } catch (e: any) {
    toast.error("Error previewing document: " + e.message);
  }
}
