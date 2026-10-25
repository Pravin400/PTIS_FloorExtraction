import { vi } from "vitest";

// ── Mocks must be hoisted before any imports ──────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      getAll: vi.fn(() => []),
    })
  ),
}));
vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn(() => 1),
}));
vi.mock("@/lib/utils/server-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));
vi.mock("@/lib/api/property.service", () => ({
  deleteProperty: vi.fn(),
  deleteBulkProperties: vi.fn(),
  deletePropertyAmenity: vi.fn(),
  deleteMultiplePropertiesAmenities: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import {
  deletePropertyAction,
  deleteBulkPropertiesAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import {
  deleteProperty,
  deleteBulkProperties,
} from "@/lib/api/property.service";


// ── Tests ─────────────────────────────────────────────────────────────────────

describe("deletePropertyAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success and message when service call succeeds", async () => {
    vi.mocked(deleteProperty).mockResolvedValue({
      success: true,
      data: { message: "Property deleted successfully" },
      error: undefined,
    });

    const result = await deletePropertyAction("42");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Property deleted successfully");
  });

  it("calls revalidatePath after successful delete", async () => {
    vi.mocked(deleteProperty).mockResolvedValue({
      success: true,
      data: { message: "OK" },
      error: undefined,
    });

    await deletePropertyAction("1");

    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/property-tax/zone-master",
      "page"
    );
  });

  it("falls back to default success message when service returns none", async () => {
    vi.mocked(deleteProperty).mockResolvedValue({
      success: true,
      data: {},
      error: undefined,
    });

    const result = await deletePropertyAction("1");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Property deleted successfully");
  });

  it("returns failure when service reports an error", async () => {
    vi.mocked(deleteProperty).mockResolvedValue({
      success: false,
      error: "Property not found",
    });

    const result = await deletePropertyAction("999");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Property not found");
  });

  it("returns generic failure when service returns no error text", async () => {
    vi.mocked(deleteProperty).mockResolvedValue({
      success: false,
      error: undefined,
    });

    const result = await deletePropertyAction("1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to delete property");
  });

  it("returns error when an unexpected exception is thrown", async () => {
    vi.mocked(deleteProperty).mockRejectedValue(new Error("Unexpected failure"));

    const result = await deletePropertyAction("1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unexpected failure");
  });

  it("returns failure with invalid property ID (empty string)", async () => {
    const result = await deletePropertyAction("");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid property ID");
    expect(deleteProperty).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("deleteBulkPropertiesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure immediately when propertyIds array is empty", async () => {
    const result = await deleteBulkPropertiesAction([]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No properties selected");
  });

  it("calls deleteBulkProperties API with the provided IDs converted to numbers", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: true,
      data: { message: "3 properties deleted" },
    });

    const ids = ["1", "2", "3"];
    await deleteBulkPropertiesAction(ids);

    expect(deleteBulkProperties).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("returns success with the message from the API response", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: true,
      data: { message: "2 properties deleted" },
    });

    const result = await deleteBulkPropertiesAction(["5", "6"]);

    expect(result.success).toBe(true);
    expect(result.message).toBe("2 properties deleted");
  });

  it("falls back to default success message when API returns none", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: true,
      data: {},
    });

    const result = await deleteBulkPropertiesAction(["1", "2"]);

    expect(result.success).toBe(true);
    expect(result.message).toBe("2 properties deleted successfully");
  });

  it("calls revalidatePath after successful bulk delete", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: true,
      data: { message: "Success" },
    });

    await deleteBulkPropertiesAction(["1"]);

    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/property-tax/zone-master",
      "page"
    );
  });

  it("returns failure when API responds with success=false", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: false,
      error: "Some records could not be deleted",
    });

    const result = await deleteBulkPropertiesAction(["1"]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Some records could not be deleted");
  });

  it("returns failure with default message when API returns no error text", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: false,
    });

    const result = await deleteBulkPropertiesAction(["1", "2"]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to delete properties");
  });

  it("handles network errors gracefully", async () => {
    vi.mocked(deleteBulkProperties).mockRejectedValue(new Error("Connection refused"));

    const result = await deleteBulkPropertiesAction(["1"]);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Connection refused");
  });

  it("extracts error messages from backend response", async () => {
    vi.mocked(deleteBulkProperties).mockResolvedValue({
      success: false,
      error: "Partition must be deleted first",
    });

    const result = await deleteBulkPropertiesAction(["1"]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Partition must be deleted first");
  });
});
