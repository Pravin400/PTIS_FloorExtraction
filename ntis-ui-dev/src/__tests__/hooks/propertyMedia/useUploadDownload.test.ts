import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUploadDownload } from "@/hooks/PropertyMedia/uploadDownload/useUploadDownload";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new Map<string, string>();
const mockUpdateQueries = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/en/property-tax/property-media/upload-download",
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
    toString: () => {
      const entries = Array.from(mockSearchParams.entries());
      return new URLSearchParams(entries).toString();
    },
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/PropertyMedia/uploadDownload/usePropertyNumberOptions", () => ({
  usePropertyNumberOptions: () => ({
    propertyFromOptions: [],
    propertyToOptions: [],
    isLoadingPropertyFrom: false,
    isLoadingPropertyTo: false,
    setPropertyFromOptions: vi.fn(),
    setPropertyToOptions: vi.fn(),
    resetAllPropertyOptions: vi.fn(),
    resetPropertyToOptions: vi.fn(),
  }),
}));

vi.mock("@/hooks/useQueryTransition", () => ({
  useQueryTransition: () => ({
    isPending: false,
    updateQueries: mockUpdateQueries,
  }),
}));

vi.mock("@/components/common", () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
  useToast: () => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("useUploadDownload Master Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new Map<string, string>();
  });

  describe("Initialization & Tab State", () => {
    it("initializes default state with upload activeTab and server source", () => {
      const { result } = renderHook(() => useUploadDownload());

      expect(result.current.open).toBe(true);
      expect(result.current.activeTab).toBe("upload");
      expect(result.current.uploadSourceTab).toBe("server");
      expect(result.current.formData.upload.category).toBe("");
      expect(result.current.formData.upload.subCategory).toBe("");
    });

    it("switches active tab between upload and download", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.setActiveTab("download");
      });

      expect(result.current.activeTab).toBe("download");

      act(() => {
        result.current.setActiveTab("upload");
      });

      expect(result.current.activeTab).toBe("upload");
    });

    it("switches uploadSourceTab between server and device and navigates via router.push", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.setUploadSourceTab("device");
      });

      expect(mockUpdateQueries).toHaveBeenCalledWith({
        sourceTab: "device",
        previewId: null,
        page: 1,
      });
    });
  });

  describe("Form Fields & Validation Tracking", () => {
    it("updates upload fields via handleUploadFieldChange and syncs category to query", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handleUploadFieldChange("category", "1");
      });

      expect(result.current.formData.upload.category).toBe("1");
      expect(mockUpdateQueries).toHaveBeenCalledWith({
        category: "1",
        subCategory: null,
        page: 1,
        previewId: null,
      });

      act(() => {
        result.current.handleUploadFieldChange("subCategory", "101");
      });

      expect(result.current.formData.upload.subCategory).toBe("101");
      expect(mockUpdateQueries).toHaveBeenCalledWith({
        subCategory: "101",
        page: 1,
        previewId: null,
      });
    });

    it("updates download fields via handleDownloadFieldChange and handles blur", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handleDownloadFieldChange("category", "2");
      });

      expect(result.current.formData.download.category).toBe("2");
      expect(mockUpdateQueries).toHaveBeenCalledWith({
        category: "2",
        subCategory: null,
      });

      act(() => {
        result.current.handleBlur("download.category");
      });

      expect(result.current.touched["download.category"]).toBe(true);
    });
  });

  describe("Filter handlers", () => {
    it("handles zone and wards filter changes", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handleFilterZoneChange("zone", "Zone1");
      });

      expect(mockUpdateQueries).toHaveBeenCalledWith({
        zone: "Zone1",
        ward: null,
        page: 1,
      });

      act(() => {
        result.current.handleFilterWardsChange(["Ward1", "Ward2"]);
      });

      expect(mockUpdateQueries).toHaveBeenCalledWith({
        ward: "Ward1,Ward2",
        page: 1,
      });
    });

    it("handles propertyFrom and propertyTo changes", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handleFilterPropertyFromChange("propertyFrom", "P10");
      });

      expect(result.current.formData.download.propertyFrom).toBe("P10");

      act(() => {
        result.current.handleFilterPropertyToChange("propertyTo", "P20");
      });

      expect(result.current.formData.download.propertyTo).toBe("P20");
    });
  });

  describe("Pagination handlers", () => {
    it("delegates handlePageChange to updateQueries", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(mockUpdateQueries).toHaveBeenCalledWith({ page: 3 });
    });

    it("delegates handlePageSizeChange to updateQueries with page reset", () => {
      const { result } = renderHook(() => useUploadDownload());

      act(() => {
        result.current.handlePageSizeChange(25);
      });

      expect(mockUpdateQueries).toHaveBeenCalledWith({ pageSize: 25, page: 1 });
    });
  });
});
