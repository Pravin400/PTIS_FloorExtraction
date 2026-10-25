import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchDocumentDefinitionsAction,
  fetchUploadedDocumentsAction,
  saveDocumentWithUploadAction,
  deleteUploadedDocAction,
  fetchAssetDocumentFileAction,
  fetchAssetDocumentFileByGuidAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";
import * as serverService from "@/lib/api/asset/municipal-Asset/new-add-new-asset/ownership.server.service";
import type { ActionResult } from "@/types/common.types";
import type { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

vi.mock("@/lib/api/asset/municipal-Asset/new-add-new-asset/ownership.server.service", () => ({
  fetchDocumentDefinitionsService: vi.fn(),
  fetchUploadedDocumentsService: vi.fn(),
  saveDocumentWithUploadService: vi.fn(),
  deleteUploadedDocService: vi.fn(),
  fetchAssetDocumentFileService: vi.fn(),
  fetchAssetDocumentFileByGuidService: vi.fn(),
}));

describe("Ownership Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchDocumentDefinitionsAction calls fetchDocumentDefinitionsService with correct params", async () => {
    const mockResult = { success: true, data: [{ id: 1, documentName: "Property Card" }] };
    vi.mocked(serverService.fetchDocumentDefinitionsService).mockResolvedValue(mockResult as unknown as ActionResult<AssetDocumentDefinitionDto[]>);

    const result = await fetchDocumentDefinitionsAction(1, 2);
    expect(serverService.fetchDocumentDefinitionsService).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual(mockResult);
  });

  it("fetchUploadedDocumentsAction calls fetchUploadedDocumentsService with assetId", async () => {
    const mockResult = { success: true, data: [{ id: 10, fileName: "test.pdf" }] };
    vi.mocked(serverService.fetchUploadedDocumentsService).mockResolvedValue(mockResult as unknown as ActionResult<AssetDocumentDto[]>);

    const result = await fetchUploadedDocumentsAction(101, true, true);
    expect(serverService.fetchUploadedDocumentsService).toHaveBeenCalledWith(101, true, true);
    expect(result).toEqual(mockResult);
  });

  it("saveDocumentWithUploadAction delegates to saveDocumentWithUploadService", async () => {
    const mockResult = { success: true, data: { id: 5 } };
    vi.mocked(serverService.saveDocumentWithUploadService).mockResolvedValue(mockResult as unknown as ActionResult<AssetDocumentDto>);

    const formData = new FormData();
    formData.append("AssetId", "101");

    const result = await saveDocumentWithUploadAction(formData);
    expect(serverService.saveDocumentWithUploadService).toHaveBeenCalledWith(formData);
    expect(result).toEqual(mockResult);
  });

  it("deleteUploadedDocAction delegates to deleteUploadedDocService", async () => {
    const mockResult = { success: true, message: "Deleted" };
    vi.mocked(serverService.deleteUploadedDocService).mockResolvedValue(mockResult as unknown as ActionResult<unknown>);

    const result = await deleteUploadedDocAction("guid-123-abc");
    expect(serverService.deleteUploadedDocService).toHaveBeenCalledWith("guid-123-abc");
    expect(result).toEqual(mockResult);
  });

  it("fetchAssetDocumentFileAction delegates to fetchAssetDocumentFileService", async () => {
    const mockResult = { base64: "SGVsbG8=", contentType: "application/pdf", contentDisposition: null, error: null };
    vi.mocked(serverService.fetchAssetDocumentFileService).mockResolvedValue(mockResult);

    const result = await fetchAssetDocumentFileAction(42);
    expect(serverService.fetchAssetDocumentFileService).toHaveBeenCalledWith(42);
    expect(result).toEqual(mockResult);
  });

  it("fetchAssetDocumentFileByGuidAction delegates to fetchAssetDocumentFileByGuidService", async () => {
    const mockResult = { base64: "SGVsbG8=", contentType: "application/pdf", contentDisposition: null, error: null };
    vi.mocked(serverService.fetchAssetDocumentFileByGuidService).mockResolvedValue(mockResult);

    const result = await fetchAssetDocumentFileByGuidAction("guid-999", "download");
    expect(serverService.fetchAssetDocumentFileByGuidService).toHaveBeenCalledWith("guid-999", "download");
    expect(result).toEqual(mockResult);
  });
});
