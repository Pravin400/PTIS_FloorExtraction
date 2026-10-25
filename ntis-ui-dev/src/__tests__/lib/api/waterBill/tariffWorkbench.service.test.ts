import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTariffWorkbenchesPaged,
  getTariffWorkbenchById,
  createTariffWorkbench,
  updateTariffWorkbench,
  purgeTariffWorkbench,
} from "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.service";
import { apiClient } from "@/services/api.service";
import type {
  CreateTariffWorkbenchDto,
  UpdateTariffWorkbenchDto,
  TariffSlabData,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

import {
  createTariffSlabAction,
  updateTariffSlabAction,
} from "@/app/[locale]/water-bill/tariff-workbench/slabs/actions";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => `tariffWorkbench.${key}`),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/server/revalidation-helper", () => ({
  revalidateModulePaths: vi.fn(),
}));

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("tariffWorkbench.service Tests", () => {
  const samplePagedData = {
    items: [
      {
        id: 1,
        tariffCode: "RES-MTR-2026",
        tariffName: "Residential Metered 2026-27",
        financialYearId: 1,
        connectionTypeId: 1,
        connectionCategoryId: 1,
        effectiveFrom: "2026-04-01",
        effectiveTo: "2027-03-31",
        versionNo: 1,
        status: "Published",
        description: "Test Description",
        isActive: true,
      },
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch paged tariff workbenches with query parameters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: samplePagedData,
      statusCode: 200,
    });

    const response = await getTariffWorkbenchesPaged({
      pageNumber: 1,
      pageSize: 10,
      searchTerm: "RES",
      sortBy: "tariffCode",
      sortOrder: "asc",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/TariffMaster?PageNumber=1&PageSize=10&SearchTerm=RES&SortBy=tariffCode&SortOrder=asc")
    );
    expect(response.success).toBe(true);
    expect(response.data?.items.length).toBe(1);
  });

  it("should handle error when fetching paged list fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));

    const response = await getTariffWorkbenchesPaged();

    expect(response.success).toBe(false);
    expect(response.error).toBe("Network Error");
    expect(response.statusCode).toBe(500);
  });

  it("should fetch a single tariff workbench by ID", async () => {
    const sampleItem = samplePagedData.items[0];
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: sampleItem,
      statusCode: 200,
    });

    const response = await getTariffWorkbenchById(1);

    expect(apiClient.get).toHaveBeenCalledWith("/TariffMaster/1");
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(1);
  });

  it("should handle 404 when tariff workbench is not found", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      error: "Not found",
      statusCode: 404,
    });

    const response = await getTariffWorkbenchById(999);

    expect(response.success).toBe(false);
    expect(response.statusCode).toBe(404);
  });

  it("should send POST request when creating a new tariff workbench", async () => {
    const dto: CreateTariffWorkbenchDto = {
      tariffCode: "RES-MTR-2027",
      tariffName: "Residential Metered 2027-28",
      financialYearId: 2,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2027-04-01",
      versionNo: 1,
      status: "Draft",
      isActive: true,
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { id: 2, ...dto },
      statusCode: 201,
    });

    const response = await createTariffWorkbench(dto);

    expect(apiClient.post).toHaveBeenCalledWith("/TariffMaster", expect.objectContaining(dto));
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(2);
  });

  it("should send PUT request when updating an existing tariff workbench", async () => {
    const dto: UpdateTariffWorkbenchDto = {
      id: 1,
      tariffCode: "RES-MTR-2026-UPD",
      tariffName: "Updated Tariff Name",
      financialYearId: 1,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2026-04-01",
      versionNo: 1,
      status: "Draft",
      isActive: true,
    };

    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: { ...dto },
      statusCode: 200,
    });

    const response = await updateTariffWorkbench(1, dto);

    expect(apiClient.put).toHaveBeenCalledWith("/TariffMaster/1", expect.objectContaining(dto));
    expect(response.success).toBe(true);
  });

  it("should send DELETE request to purge endpoint when purging a tariff workbench", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: true,
      statusCode: 200,
    });

    const response = await purgeTariffWorkbench(1);

    expect(apiClient.delete).toHaveBeenCalledWith("/TariffMaster/1");
    expect(response.success).toBe(true);
  });
});

describe("Tariff Workbench and Slab Integration - Ordering and Validation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles multiple existing slabs from raw API response and calculates next sortOrder through normalizer", async () => {
    // API response contains raw PascalCase items from backend
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: {
        items: [
          { Id: 10, TariffId: 5, SortOrder: 1, FormulaCode: "UNIT_RATE", FromUnit: 0, ToUnit: 15, UnitRate: 10 },
          { Id: 11, TariffId: 5, SortOrder: 6, FormulaCode: "UNIT_RATE", FromUnit: 16, ToUnit: 30, UnitRate: 15 },
          { Id: 12, TariffId: 5, SortOrder: 3, FormulaCode: "UNIT_RATE", FromUnit: 31, ToUnit: 50, UnitRate: 20 },
        ],
        totalCount: 3,
      },
    });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: { id: 13, sortOrder: 7 },
    });

    const res = await createTariffSlabAction({
      tariffId: 5,
      formulaCode: "FIXED",
      fixedCharge: 100,
    });

    expect(res.success).toBe(true);
    // Verified that next sortOrder is max(1, 6, 3) + 1 = 7 after API response -> normalization -> action
    expect(apiClient.post).toHaveBeenCalledWith(
      "/TariffSlabDetail",
      expect.objectContaining({
        tariffId: 5,
        formulaCode: "FIXED",
        fixedCharge: 100,
        sortOrder: 7,
      })
    );
  });

  it.each([
    {
      name: "UNIT_RATE",
      input: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 25, unitRate: 12 },
      expected: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 25, unitRate: 12, sortOrder: 1 },
    },
    {
      name: "FIXED",
      input: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 150 },
      expected: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 150, sortOrder: 1 },
    },
    {
      name: "UNIT_RATE_FIXED",
      input: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 20, unitRate: 10, fixedCharge: 40 },
      expected: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 20, unitRate: 10, fixedCharge: 40, sortOrder: 1 },
    },
    {
      name: "SLAB_RATE",
      input: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 0, toUnit: 15, unitRate: 16 },
      expected: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 0, toUnit: 15, unitRate: 16, sortOrder: 1 },
    },
    {
      name: "PER_CONNECTION",
      input: { tariffId: 1, formulaCode: "PER_CONNECTION", perConnectionAmount: 95 },
      expected: { tariffId: 1, formulaCode: "PER_CONNECTION", perConnectionAmount: 95, sortOrder: 1 },
    },
    {
      name: "MINIMUM_CHARGE",
      input: { tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 110 },
      expected: { tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 110, sortOrder: 1 },
    },
    {
      name: "FLAT_RATE (canonicalized to FIXED)",
      input: { tariffId: 1, formulaCode: "FLAT_RATE", fixedCharge: 85 },
      expected: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 85, sortOrder: 1 },
    },
  ])("demonstrates end-to-end validity for $name formula", async ({ input, expected }) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: { items: [], totalCount: 0 },
    });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: { id: 100, ...expected },
    });

    const res = await createTariffSlabAction(input);
    expect(res.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith(
      "/TariffSlabDetail",
      expect.objectContaining(expected)
    );
  });

  it.each([
    "UNKNOWN_FORMULA",
    "INVALID_FORMULA",
    "",
    "   ",
  ])("rejects incorrect formula '%s' before sending payload", async (formulaCode) => {
    const res = await createTariffSlabAction({
      tariffId: 1,
      formulaCode,
      fixedCharge: 50,
    });

    expect(res.success).toBe(false);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it.each([
    { name: "UNIT_RATE missing unitRate", payload: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 10 } },
    { name: "UNIT_RATE toUnit <= fromUnit", payload: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 10, toUnit: 10, unitRate: 15 } },
    { name: "SLAB_RATE missing unitRate", payload: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 0, toUnit: 20 } },
    { name: "UNIT_RATE_FIXED missing fixedCharge", payload: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 10, unitRate: 10 } },
    { name: "FIXED missing fixedCharge", payload: { tariffId: 1, formulaCode: "FIXED" } },
    { name: "MINIMUM_CHARGE missing minimumCharge", payload: { tariffId: 1, formulaCode: "MINIMUM_CHARGE" } },
    { name: "PER_CONNECTION missing perConnectionAmount", payload: { tariffId: 1, formulaCode: "PER_CONNECTION" } },
    { name: "missing tariffId", payload: { formulaCode: "FIXED", fixedCharge: 50 } },
  ])("rejects empty mandatory fields for $name", async ({ payload }) => {
    const res = await createTariffSlabAction(payload as unknown as Partial<TariffSlabData>);
    expect(res.success).toBe(false);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("handles update failures: lookup 404, invalid formula, and API PUT errors", async () => {
    // 1. Validation failure: update with invalid formula should fail before lookup
    const resValFail = await updateTariffSlabAction(10, {
      tariffId: 1,
      formulaCode: "UNKNOWN_FORMULA",
    });
    expect(resValFail.success).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(apiClient.put).not.toHaveBeenCalled();

    // 2. Lookup 404 failure: returns error and does not update
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: false,
      statusCode: 404,
      error: "Tariff slab not found",
    });
    const resLookupFail = await updateTariffSlabAction(999, {
      tariffId: 1,
      formulaCode: "FIXED",
      fixedCharge: 100,
    });
    expect(resLookupFail.success).toBe(false);
    expect(apiClient.put).not.toHaveBeenCalled();

    // 3. API PUT failure: lookup succeeds with sortOrder preserved, but PUT endpoint returns 500
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: {
        Id: 25,
        TariffId: 1,
        SortOrder: 5,
        FormulaCode: "FIXED",
        FixedCharge: 60,
        IsActive: true,
      },
    });
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      success: false,
      statusCode: 500,
      error: "Internal Server Error",
    });
    const resPutFail = await updateTariffSlabAction(25, {
      tariffId: 1,
      formulaCode: "FIXED",
      fixedCharge: 160,
    });
    expect(resPutFail.success).toBe(false);
    expect(apiClient.put).toHaveBeenCalledWith(
      "/TariffSlabDetail/25",
      expect.objectContaining({ sortOrder: 5, fixedCharge: 160 })
    );
  });
});
