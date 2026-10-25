import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNALegalDocumentsView } from "@/hooks/asset/municipal-Asset/new-add-new-asset/ownership/useNALegalDocumentsView";
import { useNALegalDocumentsUpload } from "@/hooks/asset/municipal-Asset/new-add-new-asset/ownership/useNALegalDocumentsUpload";
import * as actions from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";
import * as ownershipUtils from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";
import type { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";
import type { AssetFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

vi.mock("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action", () => ({
  fetchDocumentDefinitionsAction: vi.fn(),
  fetchUploadedDocumentsAction: vi.fn(),
  saveDocumentWithUploadAction: vi.fn(),
  deleteUploadedDocAction: vi.fn(),
  fetchAssetDocumentFileAction: vi.fn(),
  fetchAssetDocumentFileByGuidAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Ownership Hooks Unit Tests", () => {
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useNALegalDocumentsView", () => {
    it("should open local file preview when file is staged", async () => {
      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://mock");

      const { result } = renderHook(() => useNALegalDocumentsView(mockT));
      const dummyFile = new File(["test"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.handleView(1, { definitionId: 1, status: "uploaded", file: dummyFile });
      });

      expect(createObjectURLSpy).toHaveBeenCalledWith(dummyFile);
      expect(windowOpenSpy).toHaveBeenCalledWith("blob:http://mock", "_blank", "noopener,noreferrer");
    });

    it("should call fetchAssetDocumentFileByGuidAction for uploaded document with documentGuid", async () => {
      const openInNewTabSpy = vi.spyOn(ownershipUtils, "openBase64FileInNewTab").mockImplementation(() => {});
      vi.mocked(actions.fetchAssetDocumentFileByGuidAction).mockResolvedValue({
        base64: "SGVsbG8=",
        contentType: "application/pdf",
        contentDisposition: null,
        error: null,
      });

      const { result } = renderHook(() => useNALegalDocumentsView(mockT));
      const uploadedDoc = { id: 10, documentGuid: "guid-123", fileName: "doc.pdf" } as unknown as AssetDocumentDto;

      await act(async () => {
        await result.current.handleView(1, { definitionId: 1, status: "uploaded", uploadedDoc });
      });

      expect(actions.fetchAssetDocumentFileByGuidAction).toHaveBeenCalledWith("guid-123", "view");
      expect(openInNewTabSpy).toHaveBeenCalledWith("SGVsbG8=", "application/pdf");
    });
  });

  describe("useNALegalDocumentsUpload", () => {
    it("should validate assetId before uploading", async () => {
      const setUploadStates = vi.fn();
      const mockFormData = { assetId: 0, id: 0 } as unknown as AssetFormData;

      const { result } = renderHook(() =>
        useNALegalDocumentsUpload({
          formData: mockFormData,
          definitions: [{ id: 1, maxFileSizeMB: 5, allowedExtensions: ".pdf", documentName: "Property Card" } as unknown as AssetDocumentDefinitionDto],
          uploadStates: {},
          setUploadStates,
          t: mockT,
        })
      );

      const dummyFile = new File(["test"], "test.pdf", { type: "application/pdf" });
      await act(async () => {
        await result.current.handleFileSelect(1, dummyFile);
      });

      expect(actions.saveDocumentWithUploadAction).not.toHaveBeenCalled();
    });

    it("should invoke deleteUploadedDocAction when handleDelete is called", async () => {
      vi.mocked(actions.deleteUploadedDocAction).mockResolvedValue({
        success: true,
      });

      const setUploadStates = vi.fn();
      const mockFormData = { assetId: 101, id: 101 } as unknown as AssetFormData;

      const { result } = renderHook(() =>
        useNALegalDocumentsUpload({
          formData: mockFormData,
          definitions: [],
          uploadStates: {
            1: { definitionId: 1, status: "uploaded", uploadedDoc: { id: 50, documentGuid: "guid-50" } as unknown as AssetDocumentDto },
          },
          setUploadStates,
          t: mockT,
        })
      );

      await act(async () => {
        await result.current.handleDelete(1);
      });

      expect(actions.deleteUploadedDocAction).toHaveBeenCalledWith("guid-50");
    });

    it("should set error status if file size exceeds maxFileSizeMB limit", async () => {
      const setUploadStates = vi.fn();
      const mockFormData = { assetId: 101, id: 101 } as unknown as AssetFormData;

      const { result } = renderHook(() =>
        useNALegalDocumentsUpload({
          formData: mockFormData,
          definitions: [{ id: 1, maxFileSizeMB: 1, allowedExtensions: ".pdf", documentName: "Property Card" } as unknown as AssetDocumentDefinitionDto],
          uploadStates: {},
          setUploadStates,
          t: mockT,
        })
      );

      // 2MB file exceeds 1MB limit
      const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });
      await act(async () => {
        await result.current.handleFileSelect(1, largeFile);
      });

      expect(actions.saveDocumentWithUploadAction).not.toHaveBeenCalled();
      expect(setUploadStates).toHaveBeenCalled();
    });
  });
});
