import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatBytes,
  formatToDDMMYYYY,
  extractArrayItems,
  openBase64FileInNewTab,
  downloadBase64File,
} from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";

describe("ownershipUtils", () => {
  describe("formatBytes", () => {
    it("should return '0 Bytes' for zero or falsey bytes", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(null as unknown as number)).toBe("0 Bytes");
    });

    it("should format bytes to KB, MB, GB correctly", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("should respect decimals parameter", () => {
      expect(formatBytes(1500, 1)).toBe("1.5 KB");
    });
  });

  describe("formatToDDMMYYYY", () => {
    it("should return '–' for empty date strings", () => {
      expect(formatToDDMMYYYY(null)).toBe("–");
      expect(formatToDDMMYYYY(undefined)).toBe("–");
      expect(formatToDDMMYYYY("")).toBe("–");
    });

    it("should return unchanged string if already in DD/MM/YYYY format", () => {
      expect(formatToDDMMYYYY("15/08/2025")).toBe("15/08/2025");
    });

    it("should format ISO dates to DD/MM/YYYY format", () => {
      expect(formatToDDMMYYYY("2025-10-02T00:00:00.000Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("should return original string if date is invalid", () => {
      expect(formatToDDMMYYYY("invalid-date-string")).toBe("invalid-date-string");
    });
  });

  describe("extractArrayItems", () => {
    it("should return array directly if input is an array", () => {
      const items = [{ id: 1 }, { id: 2 }];
      expect(extractArrayItems(items)).toEqual(items);
    });

    it("should extract items from object with 'items' property", () => {
      const payload = { items: [{ id: 10 }] };
      expect(extractArrayItems(payload)).toEqual([{ id: 10 }]);
    });

    it("should extract items from object with 'Items' property", () => {
      const payload = { Items: [{ id: 20 }] };
      expect(extractArrayItems(payload)).toEqual([{ id: 20 }]);
    });

    it("should extract items from object with 'data' property", () => {
      const payload = { data: [{ id: 30 }] };
      expect(extractArrayItems(payload)).toEqual([{ id: 30 }]);
    });

    it("should return empty array for non-objects or invalid objects", () => {
      expect(extractArrayItems(null)).toEqual([]);
      expect(extractArrayItems(undefined)).toEqual([]);
      expect(extractArrayItems("string")).toEqual([]);
      expect(extractArrayItems({ otherKey: 123 })).toEqual([]);
    });
  });

  describe("openBase64FileInNewTab and downloadBase64File", () => {
    const dummyBase64 = "SGVsbG8gV29ybGQ="; // "Hello World" in base64

    beforeEach(() => {
      vi.stubGlobal("URL", {
        createObjectURL: vi.fn(() => "blob:http://localhost/mock-blob"),
        revokeObjectURL: vi.fn(),
      });
      vi.stubGlobal("open", vi.fn(() => ({ closed: false })));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should open blob URL in new tab", () => {
      openBase64FileInNewTab(dummyBase64, "application/pdf");
      expect(window.open).toHaveBeenCalledWith(
        "blob:http://localhost/mock-blob",
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("should handle download element creation and trigger click", () => {
      const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      downloadBase64File(dummyBase64, "image/png", "test-image.png");
      expect(linkClickSpy).toHaveBeenCalled();
      linkClickSpy.mockRestore();
    });
  });
});
