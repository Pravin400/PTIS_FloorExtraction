import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTariffSlabDetailsPaged,
  getTariffSlabDetailById,
} from "@/lib/api/water-bill/tariff-workbench/tariffSlabDetail.service";
import { apiClient } from "@/services/api.service";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => `tariffWorkbench.${key}`),
}));

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("tariffSlabDetail.service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should normalize raw API responses preserving sortOrder in paged list", async () => {
    const rawBackendResponse = {
      items: [
        {
          Id: 10,
          TariffId: 1,
          SortOrder: 1,
          FromUnit: 0,
          ToUnit: 20,
          UnitRate: 5.5,
          FixedCharge: 50,
          MinimumCharge: 0,
          FormulaCode: "UNIT_RATE",
          IsActive: true,
        },
        {
          Id: 11,
          TariffId: 1,
          SortOrder: 3,
          FromUnit: 21,
          ToUnit: 50,
          UnitRate: 10,
          FixedCharge: 50,
          MinimumCharge: 0,
          FormulaCode: "UNIT_RATE",
          IsActive: true,
        },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 2000,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: rawBackendResponse,
    });

    const result = await getTariffSlabDetailsPaged({ tariffId: 1, pageSize: 2000 });

    expect(result.success).toBe(true);
    expect(result.data?.items).toHaveLength(2);
    expect(result.data?.items[0].sortOrder).toBe(1);
    expect(result.data?.items[1].sortOrder).toBe(3);
  });

  it("should normalize raw API response preserving sortOrder in getTariffSlabDetailById", async () => {
    const rawItem = {
      Id: 12,
      TariffId: 1,
      SortOrder: 4,
      FromUnit: 51,
      ToUnit: 100,
      UnitRate: 15,
      FormulaCode: "UNIT_RATE",
      IsActive: true,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: rawItem,
    });

    const result = await getTariffSlabDetailById(12);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(12);
    expect(result.data?.sortOrder).toBe(4);
  });
});
