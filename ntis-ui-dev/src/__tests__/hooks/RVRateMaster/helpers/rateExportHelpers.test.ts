import { describe, it, expect, vi } from "vitest";
import { 
  generateCsvTemplate, 
  downloadFile 
} from "@/hooks/RVRateMaster/helpers/rateExportHelpers";
import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";

describe("rateExportHelpers", () => {
  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "RCC", description: "RCC Building" },
    { constructionId: "2", constructionCode: "LOAD", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "MUD", description: "Mud Building" },
  ];

  const mockZoneDescriptions: IZoneDescription[] = [
    { taxZoneId: 1, zoneNo: "Z1", description: "Zone 1" },
    { taxZoneId: 2, zoneNo: "Z2", description: "Zone 2" },
  ];

  describe("generateCsvTemplate", () => {
    it("should generate CSV with correct headers", () => {
      const csv = generateCsvTemplate(mockZoneDescriptions, mockRateCategories);
      const lines = csv.split("\n");
      const headers = lines[0].split(",");

      expect(headers).toContain("Tax Zone No");
      expect(headers.some(h => h.includes("RCC"))).toBe(true);
      expect(headers.some(h => h.includes("LOAD"))).toBe(true);
      expect(headers.some(h => h.includes("MUD"))).toBe(true);
    });

    it("should generate correct number of rows", () => {
      const csv = generateCsvTemplate(mockZoneDescriptions, mockRateCategories);
      const lines = csv.split("\n").filter(line => line.trim());

      // 1 header row + 2 zone rows
      expect(lines.length).toBe(3);
    });

    it("should include zone data in rows", () => {
      const csv = generateCsvTemplate(mockZoneDescriptions, mockRateCategories);
      const lines = csv.split("\n");

      expect(lines[1]).toContain("Z1");
      expect(lines[2]).toContain("Z2");
    });

    it("should handle empty zones gracefully", () => {
      const csv = generateCsvTemplate([], mockRateCategories);
      const lines = csv.split("\n").filter(line => line.trim());

      // Only header row
      expect(lines.length).toBe(1);
    });

    it("should handle empty rate categories", () => {
      const csv = generateCsvTemplate(mockZoneDescriptions, []);
      const lines = csv.split("\n");
      const headers = lines[0].split(",");

      // Should only have zone column
      expect(headers).toContain("Tax Zone No");
      expect(headers.length).toBe(1);
    });
  });

  describe("downloadFile", () => {
    it("should create a download link with correct attributes", () => {
      // Mock document.createElement and related methods
      const mockLink = {
        href: "",
        download: "",
        style: { visibility: "" },
        setAttribute: vi.fn(),
        click: vi.fn(),
      };
      
      const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

      downloadFile("test content", "test.csv");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test.csv");
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
