import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchGrievanceWorkflowStageMasterPagedServerAction,
  getGrievanceWorkflowStageMasterByIdAction,
  saveGrievanceWorkflowStageMaster,
  deleteGrievanceWorkflowStageMasterAction,
} from "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action";
import * as service from "@/lib/api/asset-masters/grievance-workflow-stage-master.service";
import type { GrievanceWorkflowStageMaster } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { ApiError } from "@/lib/utils/api";
import { revalidatePath } from "next/cache";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "test-user-id" }),
  }),
}));

vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn().mockReturnValue(123),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/api/asset-masters/grievance-workflow-stage-master.service", () => ({
  getGrievanceWorkflowStageMastersPaged: vi.fn(),
  getGrievanceWorkflowStageMasterById: vi.fn(),
  createGrievanceWorkflowStageMaster: vi.fn(),
  updateGrievanceWorkflowStageMaster: vi.fn(),
  deleteGrievanceWorkflowStageMaster: vi.fn(),
}));

describe("Grievance Workflow Stage Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchGrievanceWorkflowStageMasterPagedServerAction", () => {
    it("fetches paginated records successfully", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      vi.mocked(service.getGrievanceWorkflowStageMastersPaged).mockResolvedValue(mockResult);

      const result = await fetchGrievanceWorkflowStageMasterPagedServerAction(1, 10);
      expect(service.getGrievanceWorkflowStageMastersPaged).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
      expect(result).toEqual(mockResult);
    });
  });

  describe("getGrievanceWorkflowStageMasterByIdAction", () => {
    it("throws ApiError for invalid ID", async () => {
      await expect(getGrievanceWorkflowStageMasterByIdAction(0)).rejects.toThrow(ApiError);
      await expect(getGrievanceWorkflowStageMasterByIdAction("invalid")).rejects.toThrow(ApiError);
    });

    it("returns record when found", async () => {
      const mockRecord = {
        id: 5,
        ulbTypeId: 1,
        stageCode: "STAGE_5",
        stageName: "Stage Five",
        stageOrder: 5,
        status: "Active",
        isActive: true,
      };
      vi.mocked(service.getGrievanceWorkflowStageMasterById).mockResolvedValue(
        mockRecord as unknown as GrievanceWorkflowStageMaster
      );

      const result = await getGrievanceWorkflowStageMasterByIdAction(5);
      expect(result).toEqual(mockRecord);
    });
  });

  describe("saveGrievanceWorkflowStageMaster", () => {
    const buildFormData = (overrides: Record<string, string> = {}) => {
      const fd = new FormData();
      fd.set("locale", "en");
      fd.set("stageCode", "VERIFY");
      fd.set("stageName", "Verification");
      fd.set("stageOrder", "1");
      fd.set("status", "Active");
      fd.set("isActive", "true");
      for (const [k, v] of Object.entries(overrides)) {
        fd.set(k, v);
      }
      return fd;
    };

    it("rejects invalid locale", async () => {
      const fd = buildFormData({ locale: "fr" });
      const res = await saveGrievanceWorkflowStageMaster("", fd);
      expect(res).toEqual({ ok: false, error: "invalid_locale" });
    });

    it("rejects missing stageCode or stageName", async () => {
      const fd1 = buildFormData({ stageCode: "" });
      const res1 = await saveGrievanceWorkflowStageMaster("", fd1);
      expect(res1).toMatchObject({ ok: false, error: "invalid_stageCode" });

      const fd2 = buildFormData({ stageName: "" });
      const res2 = await saveGrievanceWorkflowStageMaster("", fd2);
      expect(res2).toMatchObject({ ok: false, error: "invalid_stageName" });

      const fd3 = buildFormData({ status: "" });
      const res3 = await saveGrievanceWorkflowStageMaster("", fd3);
      expect(res3).toMatchObject({ ok: false, error: "invalid_status" });
    });

    it("rejects invalid stageOrder (NaN, <=0, >100)", async () => {
      const nanFd = buildFormData({ stageOrder: "abc" });
      const nanRes = await saveGrievanceWorkflowStageMaster("", nanFd);
      expect(nanRes).toMatchObject({ ok: false, error: "invalid_stageOrder" });

      const zeroFd = buildFormData({ stageOrder: "0" });
      const zeroRes = await saveGrievanceWorkflowStageMaster("", zeroFd);
      expect(zeroRes).toMatchObject({ ok: false, error: "invalid_stageOrder" });

      const maxFd = buildFormData({ stageOrder: "101" });
      const maxRes = await saveGrievanceWorkflowStageMaster("", maxFd);
      expect(maxRes).toMatchObject({ ok: false, error: "invalid_stageOrder" });
    });

    it("creates record and calls revalidatePath for all locales", async () => {
      const fd = buildFormData();
      vi.mocked(service.createGrievanceWorkflowStageMaster).mockResolvedValue(undefined);

      const res = await saveGrievanceWorkflowStageMaster("", fd);
      expect(res.success).toBe(true);
      expect(res.ok).toBe(true);
      expect(service.createGrievanceWorkflowStageMaster).toHaveBeenCalledWith(
        expect.objectContaining({
          stageCode: "VERIFY",
          stageName: "Verification",
          stageOrder: 1,
          createdBy: 123,
        })
      );
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("updates record when ID is provided", async () => {
      const fd = buildFormData();
      vi.mocked(service.updateGrievanceWorkflowStageMaster).mockResolvedValue(undefined);

      const res = await saveGrievanceWorkflowStageMaster("10", fd);
      expect(res.success).toBe(true);
      expect(res.ok).toBe(true);
      expect(service.updateGrievanceWorkflowStageMaster).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          stageCode: "VERIFY",
          updatedBy: 123,
        })
      );
    });

    it("handles 409 duplicate errors correctly", async () => {
      const fd = buildFormData();
      vi.mocked(service.createGrievanceWorkflowStageMaster).mockRejectedValue(
        new ApiError(409, "Stage code duplicate", "Duplicate")
      );

      const res = await saveGrievanceWorkflowStageMaster("", fd);
      expect(res.success).toBe(false);
      expect(res.error).toBe("duplicate");
      expect(res.statusCode).toBe(409);
    });
  });

  describe("deleteGrievanceWorkflowStageMasterAction", () => {
    it("rejects missing or invalid ID", async () => {
      const fd = new FormData();
      fd.set("id", "invalid");
      const res = await deleteGrievanceWorkflowStageMasterAction(fd);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
    });

    it("deletes record and triggers revalidatePath", async () => {
      const fd = new FormData();
      fd.set("id", "7");
      vi.mocked(service.deleteGrievanceWorkflowStageMaster).mockResolvedValue(undefined);

      const res = await deleteGrievanceWorkflowStageMasterAction(fd);
      expect(res.success).toBe(true);
      expect(service.deleteGrievanceWorkflowStageMaster).toHaveBeenCalledWith(7);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });
});
