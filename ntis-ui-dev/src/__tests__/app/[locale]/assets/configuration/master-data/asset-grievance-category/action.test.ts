import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAssetGrievanceCategoryAction,
  updateAssetGrievanceCategoryAction,
  fetchAssetGrievanceCategoryPagedServerAction,
} from "@/app/[locale]/assets/configuration/master-data/grievance-category-master/action";
import * as service from "@/lib/api/asset-masters/asset-grievance-category-crud.service";

const mockCookieStore = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn((store) => (store.get("userId") ? 1042 : null)),
}));

vi.mock("@/lib/api/asset-masters/asset-grievance-category-crud.service", () => ({
  createAssetGrievanceCategory: vi.fn(),
  updateAssetGrievanceCategory: vi.fn(),
  deleteAssetGrievanceCategory: vi.fn(),
  getAssetGrievanceCategoryPaged: vi.fn(),
  getAssetGrievanceCategoryById: vi.fn(),
}));

describe("Asset Grievance Category Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAssetGrievanceCategoryAction", () => {
    it("fails with unauthorized when user session is missing", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const res = await createAssetGrievanceCategoryAction({
        grievanceTypeCode: "GRV_1",
        grievanceTypeName: "Name 1",
        grievanceTypeNameLocal: "नाव १",
        codeFormat: "FMT1",
        targetTableName: "tbl_test",
        slaDays: 3,
        description: "Test description",
        displaySequence: 1,
        isActive: true,
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(401);
    });

    it("injects authenticated userId and creates category successfully", async () => {
      mockCookieStore.get.mockReturnValue({ value: "1042" });
      vi.mocked(service.createAssetGrievanceCategory).mockResolvedValue("Inserted successfully");

      const input = {
        grievanceTypeCode: "GRV_WATER",
        grievanceTypeName: "Water Pipeline Leakage",
        grievanceTypeNameLocal: "पाणी पुरवठा गळती",
        codeFormat: "WTR-{SEQ}",
        targetTableName: "tbl_water",
        slaDays: 3,
        description: "Water pipe leakage problem",
        displaySequence: 1,
        isActive: true,
      };

      const res = await createAssetGrievanceCategoryAction(input);

      expect(res.success).toBe(true);
      expect(service.createAssetGrievanceCategory).toHaveBeenCalledWith({
        ...input,
        createdBy: 1042,
      });
    });

    it("rejects when required fields are missing", async () => {
      mockCookieStore.get.mockReturnValue({ value: "1042" });

      const res = await createAssetGrievanceCategoryAction({
        grievanceTypeCode: "",
        grievanceTypeName: "",
        grievanceTypeNameLocal: "",
        codeFormat: "",
        targetTableName: "",
        slaDays: null,
        description: "",
        displaySequence: 0,
        isActive: true,
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(service.createAssetGrievanceCategory).not.toHaveBeenCalled();
    });
  });

  describe("updateAssetGrievanceCategoryAction", () => {
    it("injects authenticated userId and updates category successfully", async () => {
      mockCookieStore.get.mockReturnValue({ value: "1042" });
      vi.mocked(service.updateAssetGrievanceCategory).mockResolvedValue("Updated successfully");

      const input = {
        id: 10,
        grievanceTypeCode: "GRV_ROAD",
        grievanceTypeName: "Road Repair",
        grievanceTypeNameLocal: "रस्ता दुरुस्ती",
        codeFormat: "ROAD-{SEQ}",
        targetTableName: "tbl_road",
        slaDays: 5,
        description: "Road repair grievance",
        displaySequence: 2,
        isActive: true,
      };

      const res = await updateAssetGrievanceCategoryAction(input);

      expect(res.success).toBe(true);
      expect(service.updateAssetGrievanceCategory).toHaveBeenCalledWith({
        ...input,
        updatedBy: 1042,
      });
    });
  });

  describe("fetchAssetGrievanceCategoryPagedServerAction", () => {
    it("validates sort parameters and fetches paged categories", async () => {
      mockCookieStore.get.mockReturnValue({ value: "1042" });
      const pagedMock = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      vi.mocked(service.getAssetGrievanceCategoryPaged).mockResolvedValue(pagedMock);

      const res = await fetchAssetGrievanceCategoryPagedServerAction(1, 10, "leak", "grievanceTypeCode", "asc");

      expect(service.getAssetGrievanceCategoryPaged).toHaveBeenCalledWith(1, 10, "leak", "grievanceTypeCode", "asc");
      expect(res).toEqual(pagedMock);
    });
  });
});
