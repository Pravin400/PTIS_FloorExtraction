import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createChargeHeadAction,
  updateChargeHeadAction,
  deleteChargeHeadAction,
  getChargeHeadsPagedAction,
  getChargeHeadByIdAction,
  fetchChargeHeadsServer,
  fetchChargeHeadByIdServer,
} from "@/app/[locale]/water-bill/charge-heads/actions";
import {
  createChargeHead,
  updateChargeHead,
  deleteChargeHead,
  getChargeHeadsPaged,
  getChargeHeadById,
} from "@/lib/api/water-bill/chargeHeads.service";
import { revalidatePath } from "next/cache";
import { revalidateModulePaths } from "@/lib/server/revalidation-helper";
import type { CreateChargeHeadDto, ChargeHead } from "@/types/water-bill/chargeHeads.types";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockImplementation((ns: string) =>
    Promise.resolve((key: string) => `${ns}.${key}`)
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/server/revalidation-helper", () => ({
  revalidateModulePaths: vi.fn(),
}));

vi.mock("@/lib/api/water-bill/chargeHeads.service", () => ({
  createChargeHead: vi.fn(),
  updateChargeHead: vi.fn(),
  deleteChargeHead: vi.fn(),
  getChargeHeadsPaged: vi.fn(),
  getChargeHeadById: vi.fn(),
  normalizeChargeHead: vi.fn((d) => d),
}));

describe("Charge Heads Server Actions Tests", () => {
  const validDto: CreateChargeHeadDto = {
    chargeHeadCode: "WTR_NEW",
    chargeHeadName: "New Water Fee",
    chargeType: "Fee",
    sequenceNo: 1,
    isRefundable: false,
    isRegularPay: false,
    isActive: true,
  };

  const sampleRecord: ChargeHead = {
    id: 10,
    chargeHeadCode: "WTR_NEW",
    chargeHeadName: "New Water Fee",
    chargeType: "Fee",
    sequenceNo: 1,
    isRefundable: false,
    isRegularPay: false,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createChargeHeadAction", () => {
    it("should successfully validate and create charge head and trigger revalidation", async () => {
      vi.mocked(createChargeHead).mockResolvedValue({
        success: true,
        statusCode: 201,
        data: sampleRecord,
      });

      const result = await createChargeHeadAction({ success: false }, validDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("chargeHeads.messages.createSuccess");
      expect(result.data).toBeDefined();
      expect(createChargeHead).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeHeadCode: "WTR_NEW",
          chargeHeadName: "New Water Fee",
        })
      );
      expect(revalidatePath).toHaveBeenCalled();
      expect(revalidateModulePaths).toHaveBeenCalledWith("/[locale]/water-bill/charge-heads");
    });

    it("should return validation failure when input data violates schema constraints", async () => {
      const invalidDto = {
        ...validDto,
        chargeHeadCode: "WTR>>>INVALID",
      };

      const result = await createChargeHeadAction({ success: false }, invalidDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.validationFailed");
      expect(result.errors).toBeDefined();
      expect(createChargeHead).not.toHaveBeenCalled();
    });

    it("should return error state when backend service creation fails", async () => {
      vi.mocked(createChargeHead).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Code already exists",
      });

      const result = await createChargeHeadAction({ success: false }, validDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.createFailed");
    });

    it("should safely handle unhandled exceptions thrown by service", async () => {
      vi.mocked(createChargeHead).mockRejectedValue(new Error("Database crash"));

      const result = await createChargeHeadAction({ success: false }, validDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.createFailed");
    });
  });

  describe("updateChargeHeadAction", () => {
    it("should successfully validate and update charge head and trigger revalidation", async () => {
      vi.mocked(updateChargeHead).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: { ...sampleRecord, chargeHeadName: "Updated Fee" },
      });

      const updateDto = { ...validDto, chargeHeadName: "Updated Fee" };
      const result = await updateChargeHeadAction(10, { success: false }, updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("chargeHeads.messages.updateSuccess");
      expect(updateChargeHead).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ id: 10, chargeHeadName: "Updated Fee" })
      );
      expect(revalidatePath).toHaveBeenCalled();
      expect(revalidateModulePaths).toHaveBeenCalledWith("/[locale]/water-bill/charge-heads");
    });

    it("should return validation failure when update input violates schema", async () => {
      const invalidDto = {
        ...validDto,
        chargeHeadName: "",
      };

      const result = await updateChargeHeadAction(10, { success: false }, invalidDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.validationFailed");
      expect(updateChargeHead).not.toHaveBeenCalled();
    });

    it("should handle backend failure during update", async () => {
      vi.mocked(updateChargeHead).mockResolvedValue({
        success: false,
        statusCode: 404,
        error: "Record not found",
      });

      const result = await updateChargeHeadAction(999, { success: false }, validDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.notFound");
    });

    it("should safely handle unhandled exceptions during update", async () => {
      vi.mocked(updateChargeHead).mockRejectedValue(new Error("Network timeout"));

      const result = await updateChargeHeadAction(10, { success: false }, validDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.updateFailed");
    });
  });

  describe("deleteChargeHeadAction", () => {
    it("should reject invalid charge head ID (0 or negative)", async () => {
      const resultZero = await deleteChargeHeadAction(0);
      expect(resultZero.success).toBe(false);
      expect(resultZero.statusCode).toBe(400);

      const resultNeg = await deleteChargeHeadAction(-5);
      expect(resultNeg.success).toBe(false);
      expect(resultNeg.statusCode).toBe(400);

      expect(deleteChargeHead).not.toHaveBeenCalled();
    });

    it("should successfully delete valid charge head and trigger revalidation", async () => {
      vi.mocked(deleteChargeHead).mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      const result = await deleteChargeHeadAction(10);

      expect(result.success).toBe(true);
      expect(result.message).toBe("chargeHeads.messages.deleteSuccess");
      expect(deleteChargeHead).toHaveBeenCalledWith(10);
      expect(revalidatePath).toHaveBeenCalled();
      expect(revalidateModulePaths).toHaveBeenCalledWith("/[locale]/water-bill/charge-heads");
    });

    it("should handle backend failure during delete", async () => {
      vi.mocked(deleteChargeHead).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Cannot delete record in use",
      });

      const result = await deleteChargeHeadAction(10);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.deleteFailed");
    });

    it("should safely handle unhandled exceptions during delete", async () => {
      vi.mocked(deleteChargeHead).mockRejectedValue(new Error("Server error"));

      const result = await deleteChargeHeadAction(10);

      expect(result.success).toBe(false);
      expect(result.message).toBe("chargeHeads.errors.deleteFailed");
    });
  });

  describe("Read server actions and server fetchers", () => {
    it("getChargeHeadsPagedAction should return paged data on service success", async () => {
      const pagedData = {
        items: [sampleRecord],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };

      vi.mocked(getChargeHeadsPaged).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: pagedData,
      });

      const result = await getChargeHeadsPagedAction(1, 10, "WTR", "chargeHeadCode", "asc");

      expect(result).toEqual(pagedData);
      expect(getChargeHeadsPaged).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        searchTerm: "WTR",
        sortBy: "chargeHeadCode",
        sortOrder: "asc",
      });
    });

    it("getChargeHeadsPagedAction should return safe fallback structure on service failure without throwing", async () => {
      vi.mocked(getChargeHeadsPaged).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Server error",
      });

      const result = await getChargeHeadsPagedAction(2, 20);

      expect(result.items).toEqual([]);
      expect(result.pageNumber).toBe(2);
      expect(result.pageSize).toBe(20);
      expect(result.totalCount).toBe(0);
    });

    it("getChargeHeadByIdAction should return entity on success and null on error", async () => {
      vi.mocked(getChargeHeadById).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: sampleRecord,
      });

      const found = await getChargeHeadByIdAction(10);
      expect(found).toEqual(sampleRecord);

      vi.mocked(getChargeHeadById).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: "Not found",
      });

      const notFound = await getChargeHeadByIdAction(999);
      expect(notFound).toBeNull();
    });

    it("fetchChargeHeadsServer and fetchChargeHeadByIdServer should provide backward-compatible data fetching", async () => {
      const pagedData = {
        items: [sampleRecord],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };

      vi.mocked(getChargeHeadsPaged).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: pagedData,
      });

      const paged = await fetchChargeHeadsServer({ pageNumber: 1, pageSize: 10 });
      expect(paged).toEqual(pagedData);

      vi.mocked(getChargeHeadById).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: sampleRecord,
      });

      const single = await fetchChargeHeadByIdServer(10);
      expect(single).toEqual(sampleRecord);
    });
  });
});
