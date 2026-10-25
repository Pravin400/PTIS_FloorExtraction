import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/utils/api";
import {
  fetchTypeOfUseGroupsPagedAction,
  fetchAssetTypeOfUsesAction,
  fetchAssetSubTypeOfUsesAction,
  fetchTypeOfUseGroupByIdAction,
  fetchAssetTypeOfUseByIdAction,
  fetchAssetSubTypeOfUseByIdAction,
  updateTypeOfUseGroupAction,
  createAssetTypeOfUseAction,
  createAssetSubTypeOfUseAction,
} from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";

const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn(() => 99),
}));

vi.mock("@/lib/utils/server-logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/api/asset-masters/type-of-use.service", () => ({
  getTypeOfUseGroupsPaged: vi.fn(),
  getTypeOfUseGroupsAllActive: vi.fn(),
  getTypeOfUseGroupById: vi.fn(),
  createTypeOfUseGroup: vi.fn(),
  updateTypeOfUseGroup: vi.fn(),
  deleteTypeOfUseGroup: vi.fn(),
  getAssetTypeOfUses: vi.fn(),
  getAssetTypeOfUseById: vi.fn(),
  createAssetTypeOfUse: vi.fn(),
  updateAssetTypeOfUse: vi.fn(),
  deleteAssetTypeOfUse: vi.fn(),
  getAssetSubTypeOfUses: vi.fn(),
  getAssetSubTypeOfUseById: vi.fn(),
  createAssetSubTypeOfUse: vi.fn(),
  updateAssetSubTypeOfUse: vi.fn(),
  deleteAssetSubTypeOfUse: vi.fn(),
  getAssetTypeOfUsesAllActive: vi.fn(),
  getAssetTypeOfUsesPaged: vi.fn(),
  getAssetSubTypeOfUsesPaged: vi.fn(),
}));

describe("type-of-use actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid paged group params", async () => {
    await expect(fetchTypeOfUseGroupsPagedAction(0, 10)).rejects.toBeInstanceOf(ApiError);
  });

  it("fetches type of use rows with the provided service", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");
    vi.mocked(service.getAssetTypeOfUses).mockResolvedValue([{ id: 1 }] as never);

    const result = await fetchAssetTypeOfUsesAction(12, true);

    expect(service.getAssetTypeOfUses).toHaveBeenCalledWith(12, true);
    expect(result).toEqual([{ id: 1 }]);
  });

  it("fetches sub-type rows with the provided service", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");
    vi.mocked(service.getAssetSubTypeOfUses).mockResolvedValue([{ id: 2 }] as never);

    const result = await fetchAssetSubTypeOfUsesAction(44, false);

    expect(service.getAssetSubTypeOfUses).toHaveBeenCalledWith(44, false);
    expect(result).toEqual([{ id: 2 }]);
  });

  it("rejects invalid group id lookups", async () => {
    await expect(fetchTypeOfUseGroupByIdAction(0)).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects invalid type id lookups", async () => {
    await expect(fetchAssetTypeOfUseByIdAction(0)).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects invalid subtype id lookups", async () => {
    await expect(fetchAssetSubTypeOfUseByIdAction(0)).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects malformed foreign keys before creating a type", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");

    const result = await createAssetTypeOfUseAction({
      assetCategoryId: "12junk" as never,
      assetTypeId: 5,
      typeOfUseGroupId: 1,
      typeOfUseCode: "OP",
      description: "Open plot",
      type: "R",
      searchSequence: 0,
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(service.createAssetTypeOfUse).not.toHaveBeenCalled();
  });

  it("forces new sub-types to active regardless of client input", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");
    vi.mocked(service.createAssetSubTypeOfUse).mockResolvedValue("created");

    const result = await createAssetSubTypeOfUseAction({
      typeOfUseId: 115,
      description: "Sub-Type",
      searchSequence: 0,
      isActive: false,
    });

    expect(result.success).toBe(true);
    expect(service.createAssetSubTypeOfUse).toHaveBeenCalledWith(expect.objectContaining({
      typeOfUseId: 115,
      isActive: true,
      createdBy: 99,
    }));
  });

  it("preserves false when updating a group", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");
    vi.mocked(service.updateTypeOfUseGroup).mockResolvedValue("updated");

    const result = await updateTypeOfUseGroupAction({
      id: 10,
      typeOfUseGroupCode: "RES",
      groupName: "Residential",
      groupIcon: "home",
      isActive: false,
    });

    expect(result.success).toBe(true);
    expect(service.updateTypeOfUseGroup).toHaveBeenCalledWith(expect.objectContaining({
      id: 10,
      isActive: false,
      updatedBy: 99,
    }));
  });

  it("rejects a non-boolean group status before calling the service", async () => {
    const service = await import("@/lib/api/asset-masters/type-of-use.service");

    const result = await updateTypeOfUseGroupAction({
      id: 10,
      typeOfUseGroupCode: "RES",
      groupName: "Residential",
      groupIcon: "home",
      isActive: "false" as never,
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(service.updateTypeOfUseGroup).not.toHaveBeenCalled();
  });
});
