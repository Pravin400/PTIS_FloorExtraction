import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyMediaExport } from "@/hooks/PropertyMedia/usePropertyMediaExport";
import * as exportUtils from "@/lib/utils/PropertyMedia/propertyMediaExport.client";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock("@/components/common", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("usePropertyMediaExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("initializes with isExporting false", () => {
      const { result } = renderHook(() => usePropertyMediaExport());
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe("Detailed Coverage Export", () => {
    it("calls exportDetailedCoverage with toast handlers and resets isExporting", async () => {
      const spyExport = vi.spyOn(exportUtils, "exportDetailedCoverage").mockImplementation(
        async ({ toastHandlers }) => {
          toastHandlers?.success?.("Exported successfully");
        }
      );

      const { result } = renderHook(() => usePropertyMediaExport());

      let promise: Promise<void>;
      act(() => {
        promise = result.current.exportDetailedCoverage({
          format: 0,
          category: "1",
        });
      });

      expect(result.current.isExporting).toBe(true);
      expect(result.current.isExportingExcel).toBe(true);
      expect(mockToastInfo).toHaveBeenCalledWith("export.excelStarted");
      await act(async () => {
        await promise;
      });

      expect(spyExport).toHaveBeenCalledWith(
        {
          format: 0,
          category: "1",
          toastHandlers: { success: mockToastSuccess, error: mockToastError },
        },
        expect.any(Function)
      );
      expect(mockToastSuccess).toHaveBeenCalledWith("Exported successfully");
      expect(result.current.isExporting).toBe(false);
      expect(result.current.isExportingExcel).toBe(false);
    });

    it("prevents concurrent export calls when already exporting", async () => {
      let resolveFirst: () => void = () => {};
      const spyExport = vi.spyOn(exportUtils, "exportDetailedCoverage").mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      );

      const { result } = renderHook(() => usePropertyMediaExport());

      act(() => {
        result.current.exportDetailedCoverage({ format: 0 });
      });

      expect(result.current.isExporting).toBe(true);

      // Attempt second call while first is in-flight
      act(() => {
        result.current.exportDetailedCoverage({ format: 1 });
      });

      expect(spyExport).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFirst();
      });
      expect(result.current.isExporting).toBe(false);
    });

    it("resets isExporting even if export throws error", async () => {
      vi.spyOn(exportUtils, "exportDetailedCoverage").mockRejectedValue(new Error("Export failed"));

      const { result } = renderHook(() => usePropertyMediaExport());

      await act(async () => {
        try {
          await result.current.exportDetailedCoverage({ format: 0 });
        } catch {
          // Expected error
        }
      });

      expect(result.current.isExporting).toBe(false);
    });
  });

  describe("Missing Properties Export", () => {
    it("calls exportMissingProperties with toast handlers", async () => {
      const spyExport = vi.spyOn(exportUtils, "exportMissingProperties").mockResolvedValue(undefined);

      const { result } = renderHook(() => usePropertyMediaExport());

      await act(async () => {
        await result.current.exportMissingProperties({
          format: 1,
          photoTypeId: "101",
          zoneId: "5",
        });
      });

      expect(spyExport).toHaveBeenCalledWith(
        {
          format: 1,
          photoTypeId: "101",
          zoneId: "5",
          toastHandlers: { success: mockToastSuccess, error: mockToastError },
        },
        expect.any(Function)
      );
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe("Audit Trail Export", () => {
    it("calls exportAuditTrail with params and locks during export", async () => {
      const spyExport = vi.spyOn(exportUtils, "exportAuditTrail").mockResolvedValue(undefined);

      const { result } = renderHook(() => usePropertyMediaExport());

      await act(async () => {
        await result.current.exportAuditTrail({
          format: 0,
          pageNumber: 1,
          pageSize: 20,
        });
      });

      expect(spyExport).toHaveBeenCalledWith(
        {
          format: 0,
          pageNumber: 1,
          pageSize: 20,
          toastHandlers: { success: mockToastSuccess, error: mockToastError },
        },
        expect.any(Function)
      );
      expect(result.current.isExporting).toBe(false);
    });
  });
});
