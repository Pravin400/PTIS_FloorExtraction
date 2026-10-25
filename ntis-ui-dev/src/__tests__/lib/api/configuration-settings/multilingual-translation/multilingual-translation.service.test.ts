import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/services/api.service";
import {
  bulkUpdateMultilingualTranslations,
  getMultilingualResources,
  getMultilingualTranslationsPaged,
} from "@/lib/api/configuration-settings/multilingual-translation/multilingual-translation.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPut = vi.mocked(apiClient.put);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMultilingualResources", () => {
  it("returns string list when API responds with a raw array", async () => {
    mockedGet.mockResolvedValue({ success: true, data: ["common.json", "auth_labels.json"] });

    const result = await getMultilingualResources();

    expect(result).toEqual(["common.json", "auth_labels.json"]);
    expect(mockedGet).toHaveBeenCalledWith("/MultilingualTranslation/GetResources");
  });

  it("unwraps an items-wrapped response", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: { items: ["a.json", "b.json"] } as unknown,
    });

    const result = await getMultilingualResources();
    expect(result).toEqual(["a.json", "b.json"]);
  });

  it("drops blanks and coerces non-strings", async () => {
    mockedGet.mockResolvedValue({ success: true, data: ["  ok.json  ", "", 42, null] as unknown });

    const result = await getMultilingualResources();
    expect(result).toEqual(["ok.json", "42"]);
  });

  it("throws ApiError when the call fails", async () => {
    mockedGet.mockResolvedValue({ success: false, error: "boom", statusCode: 500 });
    await expect(getMultilingualResources()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getMultilingualTranslationsPaged", () => {
  it("sends pagination params and normalizes items", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: 1,
            resource: "common.json",
            key: "btn_submit",
            en_US: "Submit",
            hi_IN: "जमा करें",
            mr_IN: "सादर करा",
          },
          { id: null, resource: "bad" },
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
    });

    const result = await getMultilingualTranslationsPaged(1, 10);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    const url = mockedGet.mock.calls[0][0];
    expect(url).toContain("/MultilingualTranslation?");
    expect(url).toContain("PageNumber=1");
    expect(url).toContain("PageSize=10");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(1);
    expect(result.items[0].key).toBe("btn_submit");
  });

  it("appends Resource and FilterEmptyLanguages params", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      },
    });

    await getMultilingualTranslationsPaged(1, 10, "  common.json  ", ["hi", "mr"]);

    const url = mockedGet.mock.calls[0][0];
    expect(url).toContain("Resource=common.json");
    expect(url).toMatch(/FilterEmptyLanguages=hi/);
    expect(url).toMatch(/FilterEmptyLanguages=mr/);
  });

  it("throws ApiError when response is unsuccessful", async () => {
    mockedGet.mockResolvedValue({ success: false, error: "nope", statusCode: 502 });
    await expect(getMultilingualTranslationsPaged(1, 10)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("bulkUpdateMultilingualTranslations", () => {
  const validItem = {
    id: 1,
    data: {
      resource: "common.json",
      key: "btn_submit",
      en_US: "Submit",
      hi_IN: "जमा करें",
      mr_IN: "सादर करा",
    },
  };

  it("throws ApiError(400) when called with no items", async () => {
    await expect(bulkUpdateMultilingualTranslations([])).rejects.toBeInstanceOf(ApiError);
  });

  it("sends a payload and returns counts on success", async () => {
    mockedPut.mockResolvedValue({
      success: true,
      data: {
        success: true,
        items: { successCount: 1, failedCount: 0, allSucceeded: true },
      },
    });

    const result = await bulkUpdateMultilingualTranslations([validItem]);

    expect(mockedPut).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = mockedPut.mock.calls[0];
    expect(endpoint).toBe("/MultilingualTranslation/Bulk");
    expect(Array.isArray(payload)).toBe(true);
    expect((payload as unknown[]).length).toBe(1);
    expect(result).toEqual({ successCount: 1, failedCount: 0, allSucceeded: true });
  });

  it("throws ApiError when the API reports failure", async () => {
    mockedPut.mockResolvedValue({
      success: false,
      error: "server error",
      statusCode: 500,
    });

    await expect(bulkUpdateMultilingualTranslations([validItem])).rejects.toBeInstanceOf(ApiError);
  });
});
