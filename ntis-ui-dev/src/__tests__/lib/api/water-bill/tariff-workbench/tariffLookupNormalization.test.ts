import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractMasterPayloadItems,
  normalizeMasterToOptions,
  extractFinancialYearLabel,
  extractConnectionTypeLabel,
  extractConnectionCategoryLabel,
  extractTapSizeLabel,
  FINANCIAL_YEAR_CONFIG,
  CONNECTION_TYPE_CONFIG,
  CONNECTION_CATEGORY_CONFIG,
  TAP_SIZE_CONFIG,
  fetchMasterLookupOptions,
} from "@/lib/api/water-bill/tariff-workbench/tariffLookupNormalization";
import { apiClient } from "@/services/api.service";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock("@/lib/utils/server-logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("tariffLookupNormalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractMasterPayloadItems", () => {
    it("returns empty array for null, undefined, or non-object values", () => {
      expect(extractMasterPayloadItems(null)).toEqual([]);
      expect(extractMasterPayloadItems(undefined)).toEqual([]);
      expect(extractMasterPayloadItems(123)).toEqual([]);
      expect(extractMasterPayloadItems("test")).toEqual([]);
      expect(extractMasterPayloadItems(true)).toEqual([]);
    });

    it("extracts from direct array of objects", () => {
      const items = [{ id: 1, name: "Item 1" }, { id: 2, name: "Item 2" }];
      expect(extractMasterPayloadItems(items)).toEqual(items);
    });

    it("filters out non-object elements in direct array", () => {
      const mixed = [{ id: 1 }, null, "string", undefined, [1, 2], { id: 2 }];
      expect(extractMasterPayloadItems(mixed)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("extracts from { items: [...] }", () => {
      const payload = { items: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from PascalCase { Items: [...] }", () => {
      const payload = { Items: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from flat data envelope { data: [...] }", () => {
      const payload = { data: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from nested data envelope { data: { items: [...] } }", () => {
      const payload = { data: { items: [{ id: 1, name: "Test" }] } };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from doubly nested data envelope { data: { data: [...] } }", () => {
      const payload = { data: { data: [{ id: 1, name: "Test" }] } };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from result envelope { result: [...] }", () => {
      const payload = { result: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from nested result envelope { result: { items: [...] } }", () => {
      const payload = { result: { items: [{ id: 1, name: "Test" }] } };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from records envelope { records: [...] }", () => {
      const payload = { records: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("extracts from list envelope { list: [...] }", () => {
      const payload = { list: [{ id: 1, name: "Test" }] };
      expect(extractMasterPayloadItems(payload)).toEqual([{ id: 1, name: "Test" }]);
    });
  });

  describe("normalizeMasterToOptions", () => {
    it("validates and maps options correctly", () => {
      const raw = {
        items: [
          { id: 1, name: "Option 1" },
          { id: 2, name: "Option 2" },
        ],
      };

      const options = normalizeMasterToOptions(raw, {
        masterName: "TestMaster",
        extractLabel: (item) => String(item.name),
      });

      expect(options).toEqual([
        { value: "1", label: "Option 1" },
        { value: "2", label: "Option 2" },
      ]);
    });

    it("rejects items with invalid or missing identifiers", () => {
      const raw = {
        items: [
          { id: 0, name: "Zero ID" },
          { id: -1, name: "Negative ID" },
          { id: null, name: "Null ID" },
          { id: undefined, name: "Undefined ID" },
          { id: "undefined", name: "String undefined" },
          { id: "null", name: "String null" },
          { id: "", name: "Empty ID" },
          { id: 5, name: "Valid ID" },
        ],
      };

      const options = normalizeMasterToOptions(raw, {
        masterName: "TestMaster",
        extractLabel: (item) => String(item.name),
      });

      expect(options).toEqual([{ value: "5", label: "Valid ID" }]);
    });

    it("rejects items with corrupted, empty, or placeholder labels", () => {
      const raw = {
        items: [
          { id: 1, name: "" },
          { id: 2, name: "   " },
          { id: 3, name: "undefined" },
          { id: 4, name: "null" },
          { id: 5, name: "[object Object]" },
          { id: 6, name: null },
          { id: 7, name: "Proper Label" },
        ],
      };

      const options = normalizeMasterToOptions(raw, {
        masterName: "TestMaster",
        extractLabel: (item) => (item.name ? String(item.name) : null),
      });

      expect(options).toEqual([{ value: "7", label: "Proper Label" }]);
    });

    it("deduplicates options by value", () => {
      const raw = {
        items: [
          { id: 1, name: "First Version" },
          { id: 1, name: "Duplicate Version" },
          { id: 2, name: "Unique Second" },
        ],
      };

      const options = normalizeMasterToOptions(raw, {
        masterName: "TestMaster",
        extractLabel: (item) => String(item.name),
      });

      expect(options).toEqual([
        { value: "1", label: "First Version" },
        { value: "2", label: "Unique Second" },
      ]);
    });
  });

  describe("Specific Master Extractors", () => {
    describe("Financial Year", () => {
      it("extracts from yearCode, year, yearDescription, description", () => {
        expect(extractFinancialYearLabel({ yearCode: "2025-2026" })).toBe("2025-2026");
        expect(extractFinancialYearLabel({ YearCode: "2026-2027" })).toBe("2026-2027");
        expect(extractFinancialYearLabel({ year: 2026 })).toBe("2026");
        expect(extractFinancialYearLabel({ Year: 2027 })).toBe("2027");
        expect(extractFinancialYearLabel({ yearDescription: "FY 2026" })).toBe("FY 2026");
        expect(extractFinancialYearLabel({ description: "Financial Year 2026" })).toBe("Financial Year 2026");
        expect(extractFinancialYearLabel({})).toBeNull();
      });

      it("normalizes diverse FY payload shapes into options", () => {
        const raw = {
          data: {
            items: [
              { id: 10, yearCode: "2024-2025" },
              { Id: 20, year: 2026 },
            ],
          },
        };
        const options = normalizeMasterToOptions(raw, FINANCIAL_YEAR_CONFIG);
        expect(options).toEqual([
          { value: "10", label: "2024-2025" },
          { value: "20", label: "2026" },
        ]);
      });
    });

    describe("Connection Type", () => {
      it("extracts from connectionType, connectionTypeCode, name, description", () => {
        expect(extractConnectionTypeLabel({ connectionType: "Metered Domestic" })).toBe("Metered Domestic");
        expect(extractConnectionTypeLabel({ ConnectionType: "Commercial Non-Metered" })).toBe("Commercial Non-Metered");
        expect(extractConnectionTypeLabel({ connectionTypeCode: "DOM-01" })).toBe("DOM-01");
        expect(extractConnectionTypeLabel({ name: "Industrial Type" })).toBe("Industrial Type");
        expect(extractConnectionTypeLabel({ description: "Bulk Connection" })).toBe("Bulk Connection");
        expect(extractConnectionTypeLabel({})).toBeNull();
      });

      it("normalizes diverse Connection Type payload shapes into options", () => {
        const raw = [
          { id: 1, connectionType: "Domestic" },
          { Id: 2, name: "Commercial" },
        ];
        const options = normalizeMasterToOptions(raw, CONNECTION_TYPE_CONFIG);
        expect(options).toEqual([
          { value: "1", label: "Domestic" },
          { value: "2", label: "Commercial" },
        ]);
      });
    });

    describe("Connection Category", () => {
      it("extracts from connectionCategory, connectionCategoryName, categoryName, connectionCategoryCode", () => {
        expect(extractConnectionCategoryLabel({ connectionCategory: "Residential" })).toBe("Residential");
        expect(extractConnectionCategoryLabel({ connectionCategoryName: "Commercial Unit" })).toBe("Commercial Unit");
        expect(extractConnectionCategoryLabel({ categoryName: "Industrial Category" })).toBe("Industrial Category");
        expect(extractConnectionCategoryLabel({ connectionCategoryCode: "CAT-RES" })).toBe("CAT-RES");
        expect(extractConnectionCategoryLabel({ name: "Institutional" })).toBe("Institutional");
        expect(extractConnectionCategoryLabel({})).toBeNull();
      });

      it("normalizes diverse Connection Category payload shapes into options", () => {
        const raw = {
          result: [
            { id: 100, connectionCategoryName: "Residential" },
            { id: 200, categoryName: "Commercial" },
          ],
        };
        const options = normalizeMasterToOptions(raw, CONNECTION_CATEGORY_CONFIG);
        expect(options).toEqual([
          { value: "100", label: "Residential" },
          { value: "200", label: "Commercial" },
        ]);
      });
    });

    describe("Tap Size", () => {
      it("extracts from tapSizeName, tapSize, nominalSizeValue + sizeUnit, size, tapSizeCode", () => {
        expect(extractTapSizeLabel({ tapSizeName: "15 mm Standard" })).toBe("15 mm Standard");
        expect(extractTapSizeLabel({ tapSize: "20 mm" })).toBe("20 mm");
        expect(extractTapSizeLabel({ nominalSizeValue: 25, sizeUnit: "mm" })).toBe("25 mm");
        expect(extractTapSizeLabel({ nominalSizeValue: "0.5", sizeUnit: "inch" })).toBe("0.5 inch");
        expect(extractTapSizeLabel({ size: "1 inch" })).toBe("1 inch");
        expect(extractTapSizeLabel({ sizeInInches: "2 inch" })).toBe("2 inch");
        expect(extractTapSizeLabel({ tapSizeCode: "TS-15" })).toBe("TS-15");
        expect(extractTapSizeLabel({})).toBeNull();
      });

      it("normalizes diverse Tap Size payload shapes into options", () => {
        const raw = {
          Items: [
            { id: 1, tapSizeName: "15 mm" },
            { Id: 2, nominalSizeValue: 20, sizeUnit: "mm" },
          ],
        };
        const options = normalizeMasterToOptions(raw, TAP_SIZE_CONFIG);
        expect(options).toEqual([
          { value: "1", label: "15 mm" },
          { value: "2", label: "20 mm" },
        ]);
      });
    });
  });

  describe("fetchMasterLookupOptions", () => {
    it("fetches, validates, and normalizes successfully", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [{ id: 1, connectionType: "Residential" }],
        },
      });

      const options = await fetchMasterLookupOptions(
        "/ConnectionTypeMaster?PageNumber=1&PageSize=2000",
        CONNECTION_TYPE_CONFIG
      );

      expect(options).toEqual([{ value: "1", label: "Residential" }]);
    });

    it("returns empty array when API call returns failure status", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: "Server internal error",
      });

      const options = await fetchMasterLookupOptions(
        "/ConnectionTypeMaster?PageNumber=1&PageSize=2000",
        CONNECTION_TYPE_CONFIG
      );

      expect(options).toEqual([]);
    });

    it("returns empty array and handles exceptions gracefully", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network timeout"));

      const options = await fetchMasterLookupOptions(
        "/ConnectionTypeMaster?PageNumber=1&PageSize=2000",
        CONNECTION_TYPE_CONFIG
      );

      expect(options).toEqual([]);
    });
  });
});
