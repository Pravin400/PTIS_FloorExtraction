"use server";

import { 
  uploadDocument, 
  deleteDocument, 
  getDocumentByBinding, 
  getDocumentByReference, 
  getDocumentMetadata,
  getDocument
} from "@/lib/api/document.service";
import { logger } from "@/lib/utils/logger";
import { getTranslations } from "next-intl/server";
import { DocumentUploadParams, DocumentReferenceQuery } from "@/types/document.types";
import { ActionResult } from "@/types/common.types";

async function translateError(error: unknown, locale: string, defaultKey: string): Promise<string> {
  const t = await getTranslations({ locale: locale || "en", namespace: "quickDataEntry" });
  const errorMsg = error instanceof Error ? error.message : String(error);
  let errorKey = defaultKey;
  
  if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
    errorKey = "document.errors.unauthorized";
  } else if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
    errorKey = "document.errors.forbidden";
  } else if (errorMsg.includes("404") || errorMsg.includes("Not Found")) {
    errorKey = "document.errors.notFound";
  }
  
  try {
    return t(errorKey);
  } catch {
    return errorMsg || "An unexpected error occurred.";
  }
}

/**
 * Server Action to upload a document using the global document API.
 */
export async function globalUploadDocumentAction(formData: FormData, locale?: string): Promise<ActionResult> {
  try {
    const fileRaw = formData.get("File");
    const file = fileRaw instanceof File ? fileRaw : null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const getNumber = (key: string) => {
      const val = formData.get(key);
      return val ? Number(val) : undefined;
    };

    const getString = (key: string) => {
      const val = formData.get(key);
      return val ? String(val) : undefined;
    };

    const getBoolean = (key: string): boolean | undefined => {
      const val = formData.get(key);
      if (val === null) return undefined;
      return String(val) === "true";
    };

    const params: DocumentUploadParams = {
      ownerUserId: getNumber("OwnerUserId"),
      documentType: getString("DocumentType"),
      departmentId: getNumber("DepartmentId"),
      moduleId: getNumber("ModuleId"),
      referenceTableName: getString("ReferenceTableName"),
      referenceTableId: getNumber("ReferenceTableId"),
      referenceTableIdGuid: getString("ReferenceTableIdGuid"),
      referencePropertyName: getString("ReferencePropertyName"),
      bindingPurpose: getString("BindingPurpose"),
      isPrimaryDocument: getBoolean("IsPrimaryDocument"),
      authDepartmentId: getNumber("AuthDepartmentId"),
      authReferenceId: getNumber("AuthReferenceId"),
    };

    const result = await uploadDocument(file, params);
    return { success: true, data: result };
  } catch (error: unknown) {
    logger.error("Global upload document action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.uploadGeneral");
    return { success: false, error: message };
  }
}

/**
 * Server Action to soft delete a document using the global document API.
 */
export async function globalDeleteDocumentAction(documentGuid: string, locale?: string): Promise<ActionResult> {
  try {
    const response = await deleteDocument(documentGuid);
    if (!response.success) {
      return { success: false, error: response.error || "Failed to delete document" };
    }
    return { success: true };
  } catch (error: unknown) {
    logger.error("Global delete document action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.general");
    return { success: false, error: message };
  }
}

/**
 * Server Action to retrieve a document by binding ID.
 */
export async function getDocumentByBindingAction(bindingId: number, locale?: string): Promise<ActionResult> {
  try {
    const response = await getDocumentByBinding(bindingId);
    if (!response.success) {
      return { success: false, error: response.error || "Failed to find document" };
    }
    return { success: true, data: response.data };
  } catch (error: unknown) {
    logger.error("Get document by binding action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.general");
    return { success: false, error: message };
  }
}

/**
 * Server Action to retrieve a document by reference parameters.
 */
export async function getDocumentByReferenceAction(params: DocumentReferenceQuery, locale?: string): Promise<ActionResult> {
  try {
    const response = await getDocumentByReference(params);
    if (!response.success) {
      return { success: false, error: response.error || "Failed to find document" };
    }
    return { success: true, data: response.data };
  } catch (error: unknown) {
    logger.error("Get document by reference action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.general");
    return { success: false, error: message };
  }
}

/**
 * Server Action to retrieve document metadata by GUID.
 */
export async function getDocumentMetadataAction(documentGuid: string, locale?: string): Promise<ActionResult> {
  try {
    const response = await getDocumentMetadata(documentGuid);
    if (!response.success) {
      return { success: false, error: response.error || "Failed to fetch metadata" };
    }
    return { success: true, data: response.data };
  } catch (error: unknown) {
    logger.error("Get document metadata action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.general");
    return { success: false, error: message };
  }
}

/**
 * Server Action to retrieve a document as a base64 encoded string.
 */
export async function getDocumentAction(
  documentGuid: string, 
  action: 'view' | 'download', 
  locale?: string
): Promise<ActionResult<{ base64: string; contentType: string; contentDisposition: string }>> {
  try {
    const result = await getDocument(documentGuid, action);
    const base64 = Buffer.from(result.buffer).toString("base64");
    return {
      success: true,
      data: {
        base64,
        contentType: result.contentType,
        contentDisposition: result.contentDisposition
      }
    };
  } catch (error: unknown) {
    logger.error("Get document action error", { error: error instanceof Error ? error : new Error(String(error)) });
    const message = await translateError(error, locale || "en", "document.errors.general");
    return { success: false, error: message };
  }
}


