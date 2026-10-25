import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeterTestStatusMaster } from "@/hooks/water-bill/meter-test-status-master/useMeterTestStatusMaster";
import { useMeterTypeMaster } from "@/hooks/water-bill/meter-type-master/useMeterTypeMaster";
import { useReadingSourceMaster } from "@/hooks/water-bill/reading-source-master/useReadingSourceMaster";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    if (params) {
      let str = key;
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
      return str;
    }
    return key;
  },
  useLocale: () => "en",
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn(),
  }),
}));

describe("Water Tax Master Search Input Sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMeterTestStatusMaster", () => {
    it("should sanitize search input by stripping special characters", () => {
      const { result } = renderHook(() =>
        useMeterTestStatusMaster({
          data: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
        })
      );

      act(() => {
        result.current.handleSearchChange("@#@#@###");
      });

      expect(result.current.searchTerm).toBe("");

      act(() => {
        result.current.handleSearchChange("Active Status 123!@#$");
      });

      expect(result.current.searchTerm).toBe("Active Status 123");
    });
  });

  describe("useMeterTypeMaster", () => {
    it("should sanitize search input by stripping special characters", () => {
      const { result } = renderHook(() =>
        useMeterTypeMaster({
          data: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
        })
      );

      act(() => {
        result.current.handleSearchChange("@@@###");
      });

      expect(result.current.searchTerm).toBe("");

      act(() => {
        result.current.handleSearchChange("Ultrasonic Meter %&*");
      });

      expect(result.current.searchTerm).toBe("Ultrasonic Meter &");
    });
  });

  describe("useReadingSourceMaster", () => {
    it("should sanitize search input by stripping special characters", () => {
      const { result } = renderHook(() =>
        useReadingSourceMaster({
          data: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
        })
      );

      act(() => {
        result.current.handleSearchChange("<script>alert('xss')</script>");
      });

      expect(result.current.searchTerm).toBe("scriptalertxss/script");

      act(() => {
        result.current.handleSearchChange("Field Source 01#");
      });

      expect(result.current.searchTerm).toBe("Field Source 01");
    });
  });
});
