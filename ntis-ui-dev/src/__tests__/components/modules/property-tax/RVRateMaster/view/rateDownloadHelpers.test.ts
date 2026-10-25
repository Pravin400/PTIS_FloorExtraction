import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadDetailedRates } from "@/components/modules/property-tax/RVRateMaster/view/rateDownloadHelpers";
import { getDetailedRatesAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { toast } from "sonner";
import type { ISelectOption, RateCategory } from "@/types/RVRateMaster";

// Mock dependencies
vi.mock("@/app/[locale]/property-tax/rate-master/rvratemaster/action", () => ({
  getDetailedRatesAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe("rateDownloadHelpers", () => {
  const mockZones: ISelectOption[] = [
    { value: "UTHALSAR", label: "UTHALSAR" },
    { value: "NAUPADA", label: "NAUPADA" },
  ];

  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "A", description: "RCC" },
    { constructionId: "2", constructionCode: "B", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "C", description: "Mud" },
  ];

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      "messages.selectRateSection": "Please select a rate section",
      "messages.downloadingRates": "Downloading rates...",
      "messages.noRatesAvailable": "No rates available",
      "messages.ratesDownloaded": "Rates downloaded successfully",
      "messages.downloadFailed": "Failed to download rates",
      "downloadHeaders.rateSection": "Rate Section",
      "downloadHeaders.assessmentYearRange": "Assessment Year Range",
      "downloadHeaders.useGroup": "Use Group",
      "downloadHeaders.taxZoneNo": "Tax Zone No",
      "downloadHeaders.rateSqMtr": "Rate (₹/Sq.mtr)",
      "downloadHeaders.rateSqFt": "Rate (₹/Sq.ft)",
    };
    return translations[key] || key;
  };

  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let originalBlob: typeof Blob;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Save original Blob
    originalBlob = global.Blob;

    // Mock DOM APIs
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: "" },
    };

    createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as Node);
    removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as Node);

    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original Blob
    global.Blob = originalBlob;
  });

  describe("downloadDetailedRates", () => {
    it("should show error when no zone is selected", async () => {
      await downloadDetailedRates("", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.error).toHaveBeenCalledWith("Please select a rate section");
      expect(getDetailedRatesAction).not.toHaveBeenCalled();
    });

    it("should show error when zone is ALL", async () => {
      await downloadDetailedRates("ALL", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.error).toHaveBeenCalledWith("Please select a rate section");
      expect(getDetailedRatesAction).not.toHaveBeenCalled();
    });

    it("should show loading toast before fetching data", async () => {
      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: [] });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.loading).toHaveBeenCalledWith("Downloading rates...");
    });

    it("should fetch rates with correct parameters", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "Residential",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 100,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(getDetailedRatesAction).toHaveBeenCalledWith("UTHALSAR", undefined, undefined, 1, -1);
    });

    it("should show error when no rates are available", async () => {
      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: [] });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("No rates available");
    });

    it("should download CSV file with correct structure", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "व्यावसायिक",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 419.8,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it("should group rates by year range and use group", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1998-1998",
          constructionType: "A",
          rateSquareMeter: 142.08,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
    });

    it("should include rate section, year range, and use group in columns", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      // Verify that the download was triggered
      const linkElement = createElementSpy.mock.results[0]?.value;
      expect(linkElement.setAttribute).toHaveBeenCalledWith("download", expect.stringContaining("Rate_Master_UTHALSAR"));
    });

    it("should handle download failure gracefully", async () => {
      vi.mocked(getDetailedRatesAction).mockRejectedValue(new Error("Network error"));

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Failed to download rates");
    });

    it("should create CSV with BOM for proper UTF-8 encoding", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      let blobContent: string | undefined;
      global.Blob = class MockBlob {
        constructor(content: string[]) {
          blobContent = content[0];
        }
      } as unknown as typeof Blob;

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(blobContent).toBeDefined();
      expect(typeof blobContent).toBe('string');
      expect(blobContent?.startsWith('\uFEFF')).toBe(true);
    });

    it("should sort tax zones numerically", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "10",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
        {
          rateSection: "UTHALSAR",
          taxZone: "2",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
    });

    it("should handle multiple grids with different use groups", async () => {
      const mockRates = [
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "निवासी",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 96.88,
        },
        {
          rateSection: "UTHALSAR",
          taxZone: "1",
          typeOfUseGroup: "व्यावसायिक",
          yearRangeRV: "1700-1997",
          constructionType: "A",
          rateSquareMeter: 419.8,
        },
      ];

      vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

      await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

      expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
    });

    describe("Rate Unit Handling", () => {
      it("should use rateSquareMeter values when unit is SqMeter", async () => {
        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "निवासी",
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareMeter: 100,
            rateSquareFeet: 1076.39,
          },
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
      });

      it("should use rateSquareFeet values when unit is SqFeet", async () => {
        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "निवासी",
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareMeter: 100,
            rateSquareFeet: 1076.39,
          },
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        await downloadDetailedRates("UTHALSAR", mockZones, "SqFeet", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        expect(toast.success).toHaveBeenCalledWith("Rates downloaded successfully");
      });

      it("should show SqMtr unit label in header when unit is SqMeter", async () => {
        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "निवासी",
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareMeter: 100,
          },
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        let blobContent: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContent = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        expect(blobContent).toContain("Rate (₹/Sq.mtr)");
      });

      it("should show SqFt unit label in header when unit is SqFeet", async () => {
        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "निवासी",
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareFeet: 1076.39,
          },
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        let blobContent: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContent = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates("UTHALSAR", mockZones, "SqFeet", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        expect(blobContent).toContain("Rate (₹/Sq.ft)");
      });

      it("should use correct rate value based on unit selection", async () => {
        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "निवासी",
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareMeter: 100,
            rateSquareFeet: 50,
          },
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        let blobContentSqMeter: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContentSqMeter = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates("UTHALSAR", mockZones, "SqMeter", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        // Check that the CSV contains the square meter value (100)
        expect(blobContentSqMeter).toContain("100");

        // Now test with SqFeet
        let blobContentSqFeet: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContentSqFeet = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates("UTHALSAR", mockZones, "SqFeet", mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>, mockRateCategories);

        // Check that the CSV contains the square feet value (50)
        expect(blobContentSqFeet).toContain("50");
      });
    });

    describe("Use Group Filtering", () => {
      it("should filter rates to only use groups specified in useGroups", async () => {
        const mockUseGroups: ISelectOption[] = [
          { value: "101", label: "Open Plot Use 1" },
          { value: "102", label: "Open Plot Use 2" }
        ];

        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "Open Plot Use 1",
            typeOfUseGroupId: 101,
            yearRangeRV: "1700-1997",
            constructionType: "OP_1",
            rateSquareMeter: 100,
          },
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "Construction Use",
            typeOfUseGroupId: 202, // Not in mockUseGroups
            yearRangeRV: "1700-1997",
            constructionType: "A",
            rateSquareMeter: 200,
          }
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        let blobContent: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContent = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates(
          "UTHALSAR",
          mockZones,
          "SqMeter",
          mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>,
          mockRateCategories,
          mockUseGroups
        );

        expect(blobContent).toContain("Open Plot Use 1");
        expect(blobContent).not.toContain("Construction Use");
      });
    });

    describe("Open Plot Layout", () => {
      it("should format CSV with Use Groups in columns and no row-wise Use Group/Construction Type column when isOpenPlot is true", async () => {
        const mockUseGroups: ISelectOption[] = [
          { value: "101", label: "OP_Group" },
          { value: "102", label: "R_Group" }
        ];
        const openPlotRateCategories: RateCategory[] = [
          { constructionId: "1", constructionCode: "OP", description: "OP (+4)", typeOfUseGroupId: 101 },
          { constructionId: "2", constructionCode: "R", description: "R", typeOfUseGroupId: 102 }
        ];

        const mockRates = [
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "OP_Group",
            typeOfUseGroupId: 101,
            yearRangeRV: "1700-1997",
            constructionType: "OP (+4)",
            rateSquareMeter: 123,
          },
          {
            rateSection: "UTHALSAR",
            taxZone: "1",
            typeOfUseGroup: "R_Group",
            typeOfUseGroupId: 102,
            yearRangeRV: "1700-1997",
            constructionType: "OP (+4)",
            rateSquareMeter: 456,
          }
        ];

        vi.mocked(getDetailedRatesAction).mockResolvedValue({ items: mockRates });

        let blobContent: string | undefined;
        global.Blob = class MockBlob {
          constructor(content: string[]) {
            blobContent = content[0];
          }
        } as unknown as typeof Blob;

        await downloadDetailedRates(
          "UTHALSAR",
          mockZones,
          "SqMeter",
          mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>,
          openPlotRateCategories,
          mockUseGroups,
          true // isOpenPlot = true
        );

        // Header check: Use Group names "OP_Group" and "R_Group" should be header columns
        expect(blobContent).toContain("OP_Group (Rate (₹/Sq.mtr))");
        expect(blobContent).toContain("R_Group (Rate (₹/Sq.mtr))");
        expect(blobContent).not.toContain("Construction Type");
        expect(blobContent).not.toContain("Use Group");

        // Data check: The row should contain UTHALSAR, 1700-1997, 1, 123, 456
        expect(blobContent).toContain("123");
        expect(blobContent).toContain("456");
      });
    });
  });
});
