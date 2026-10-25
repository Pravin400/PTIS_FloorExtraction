import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getChargeHeadsPaged,
  getChargeHeadById,
  createChargeHead,
  updateChargeHead,
  deleteChargeHead,
  purgeChargeHead,
} from "@/lib/api/water-bill/chargeHeads.service";
import { apiClient } from "@/services/api.service";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => `common.${key}`),
}));

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("chargeHeads.service Tests", () => {
  const samplePagedData = {
    items: [
      {
        id: 1,
        chargeHeadCode: "WTR_CHG",
        chargeHeadName: "Water Charge",
        chargeType: "Charge",
        isRefundable: false,
        sequenceNo: 1,
        isRegularPay: false,
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

  it("should fetch paged charge heads with query parameters", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: samplePagedData,
      statusCode: 200,
    });

    const response = await getChargeHeadsPaged({
      pageNumber: 1,
      pageSize: 10,
      searchTerm: "WTR",
      sortBy: "name",
      sortOrder: "asc",
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("/ChargeHeadMaster?PageNumber=1&PageSize=10&SearchTerm=WTR&SortBy=ChargeHeadName&SortOrder=asc")
    );
    expect(response.success).toBe(true);
    expect(response.data?.items.length).toBe(1);
  });

  it("should handle error response when fetching paged list fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Database connection error"));

    const response = await getChargeHeadsPaged();

    expect(response.success).toBe(false);
    expect(response.error).toBe("Database connection error");
    expect(response.statusCode).toBe(500);
  });

  it("should fetch a single charge head by ID", async () => {
    const sampleItem = samplePagedData.items[0];
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: sampleItem,
      statusCode: 200,
    });

    const response = await getChargeHeadById(1);

    expect(apiClient.get).toHaveBeenCalledWith("/ChargeHeadMaster/1");
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(1);
  });

  it("should handle 404 when charge head is not found", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      error: "Not found",
      statusCode: 404,
    });

    const response = await getChargeHeadById(999);

    expect(response.success).toBe(false);
    expect(response.statusCode).toBe(404);
  });

  it("should send POST request when creating a new charge head", async () => {
    const dto = {
      chargeHeadCode: "WTR_FEE",
      chargeHeadName: "Water Connection Fee",
      chargeType: "Fee",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { id: 2, ...dto },
      statusCode: 201,
    });

    const response = await createChargeHead(dto);

    expect(apiClient.post).toHaveBeenCalledWith("/ChargeHeadMaster", expect.objectContaining(dto));
    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(2);
  });

  it("should handle wrapped items envelope on successful creation", async () => {
    const dto = {
      chargeHeadCode: "WTR_NEW",
      chargeHeadName: "New Water Charge",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { success: true, message: "Record inserted successfully", items: { id: 7020, ...dto } },
      statusCode: 200,
    });

    const response = await createChargeHead(dto);

    expect(response.success).toBe(true);
    expect(response.data?.id).toBe(7020);
    expect(response.data?.chargeHeadCode).toBe("WTR_NEW");
  });

  it("should fail when backend returns business error envelope even if HTTP status is 200", async () => {
    const dto = {
      chargeHeadCode: "DUPLICATE_CHG",
      chargeHeadName: "Duplicate Charge",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { success: false, message: "Charge head code already exists", items: null },
      statusCode: 200,
    });

    const response = await createChargeHead(dto);

    expect(response.success).toBe(false);
    expect(response.error).toBe("Charge head code already exists");
    expect(response.data).toBeUndefined();
  });

  it("should fail when backend returns no valid entity ID", async () => {
    const dto = {
      chargeHeadCode: "INVALID_CHG",
      chargeHeadName: "Invalid Charge",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: { success: true, items: null },
      statusCode: 200,
    });

    const response = await createChargeHead(dto);

    expect(response.success).toBe(false);
    expect(response.data).toBeUndefined();
  });

  it("should send PUT request when updating an existing charge head", async () => {
    const dto = {
      id: 1,
      chargeHeadCode: "WTR_CHG_UPD",
      chargeHeadName: "Water Charge Updated",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: { ...dto },
      statusCode: 200,
    });

    const response = await updateChargeHead(1, dto);

    expect(apiClient.put).toHaveBeenCalledWith("/ChargeHeadMaster/1", expect.objectContaining(dto));
    expect(response.success).toBe(true);
  });

  it("should attempt DELETE request when deleting a charge head", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: true,
      statusCode: 200,
    });

    const response = await deleteChargeHead(1);

    expect(apiClient.delete).toHaveBeenCalledWith("/ChargeHeadMaster/1/purge");
    expect(response.success).toBe(true);
  });

  it("should send DELETE request to purge endpoint when purging a charge head", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: true,
      statusCode: 200,
    });

    const response = await purgeChargeHead(1);

    expect(apiClient.delete).toHaveBeenCalledWith("/ChargeHeadMaster/1/purge");
    expect(response.success).toBe(true);
  });

  it("should normalize PascalCase and DTO-prefixed backend response properties", async () => {
    const rawPascalData = {
      Items: [
        {
          Id: 10,
          ChargeHeadCode: "WTR_TAX",
          ChargeHeadName: "Water Tax",
          ChargeType: "Tax",
          IsRefundable: true,
          SequenceNo: 1,
          IsRegularPay: false,
          IsActive: true,
        },
      ],
      TotalCount: 1,
      PageNumber: 1,
      PageSize: 10,
      TotalPages: 1,
      HasPreviousPage: false,
      HasNextPage: false,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: rawPascalData,
      statusCode: 200,
    });

    const response = await getChargeHeadsPaged();

    expect(response.success).toBe(true);
    expect(response.data?.items.length).toBe(1);

    const item = response.data?.items[0];
    expect(item?.id).toBe(10);
    expect(item?.chargeHeadCode).toBe("WTR_TAX");
    expect(item?.chargeHeadName).toBe("Water Tax");
    expect(item?.chargeType).toBe("Tax");
    expect(item?.isRefundable).toBe(true);
    expect(item?.isActive).toBe(true);
  });

  describe("Sorting & Retry Regression Tests", () => {
    it("should map verified sortable fields to their backend PascalCase names", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: samplePagedData,
        statusCode: 200,
      });

      const sortCases = [
        { frontend: "chargeHeadCode", backend: "ChargeHeadCode" },
        { frontend: "code", backend: "ChargeHeadCode" },
        { frontend: "chargeHeadName", backend: "ChargeHeadName" },
        { frontend: "name", backend: "ChargeHeadName" },
        { frontend: "chargeType", backend: "ChargeType" },
        { frontend: "isRefundable", backend: "IsRefundable" },
        { frontend: "isRegularPay", backend: "IsRegularPay" },
        { frontend: "isActive", backend: "IsActive" },
        { frontend: "id", backend: "Id" },
      ];

      for (const { frontend, backend } of sortCases) {
        vi.clearAllMocks();
        vi.mocked(apiClient.get).mockResolvedValue({
          success: true,
          data: samplePagedData,
          statusCode: 200,
        });

        await getChargeHeadsPaged({ sortBy: frontend, sortOrder: "desc" });

        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining(`SortBy=${backend}&SortOrder=desc`)
        );
      }
    });

    it("should reject unsupported sort fields (description, sequenceNo) without calling backend API", async () => {
      const unsupportedFields = ["description", "sequenceNo", "chargeHeadNameLocal", "unknownField"];

      for (const field of unsupportedFields) {
        vi.clearAllMocks();
        const response = await getChargeHeadsPaged({ sortBy: field, sortOrder: "asc" });

        expect(apiClient.get).not.toHaveBeenCalled();
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.error).toContain(`Field '${field}' is not sortable`);
      }
    });

    it("should guarantee database-level sorting across multiple pages without in-memory page sorting", async () => {
      // Mock page 1 containing 2 items in database-sorted order
      const page1Data = {
        items: [
          { id: 1, chargeHeadCode: "AAA_CHG", chargeHeadName: "Alpha", chargeType: "Fee", isActive: true },
          { id: 2, chargeHeadCode: "BBB_CHG", chargeHeadName: "Beta", chargeType: "Fee", isActive: true },
        ],
        totalCount: 4,
        pageNumber: 1,
        pageSize: 2,
        totalPages: 2,
        hasPreviousPage: false,
        hasNextPage: true,
      };

      // Mock page 2 containing next 2 items in database-sorted order
      const page2Data = {
        items: [
          { id: 3, chargeHeadCode: "CCC_CHG", chargeHeadName: "Charlie", chargeType: "Fee", isActive: true },
          { id: 4, chargeHeadCode: "DDD_CHG", chargeHeadName: "Delta", chargeType: "Fee", isActive: true },
        ],
        totalCount: 4,
        pageNumber: 2,
        pageSize: 2,
        totalPages: 2,
        hasPreviousPage: true,
        hasNextPage: false,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: page1Data,
        statusCode: 200,
      });

      const resPage1 = await getChargeHeadsPaged({ pageNumber: 1, pageSize: 2, sortBy: "chargeHeadCode", sortOrder: "asc" });
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("PageNumber=1&PageSize=2&SortBy=ChargeHeadCode&SortOrder=asc")
      );
      expect(resPage1.data?.items[0].chargeHeadCode).toBe("AAA_CHG");
      expect(resPage1.data?.items[1].chargeHeadCode).toBe("BBB_CHG");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: page2Data,
        statusCode: 200,
      });

      const resPage2 = await getChargeHeadsPaged({ pageNumber: 2, pageSize: 2, sortBy: "chargeHeadCode", sortOrder: "asc" });
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("PageNumber=2&PageSize=2&SortBy=ChargeHeadCode&SortOrder=asc")
      );
      expect(resPage2.data?.items[0].chargeHeadCode).toBe("CCC_CHG");
      expect(resPage2.data?.items[1].chargeHeadCode).toBe("DDD_CHG");


      const page1SecondCode = resPage1.data?.items?.[1]?.chargeHeadCode;
      const page2FirstCode = resPage2.data?.items?.[0]?.chargeHeadCode;

      expect(page1SecondCode).toBeDefined();
      expect(page2FirstCode).toBeDefined();
      expect(page1SecondCode! < page2FirstCode!).toBe(true);
    });

    it("should not retry on HTTP 401 Unauthorized and preserve original error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 401,
        error: "Unauthorized access",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(401);
      expect(response.error).toBe("Unauthorized access");
    });

    it("should not retry on HTTP 403 Forbidden and preserve original error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 403,
        error: "Forbidden",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
      expect(response.error).toBe("Forbidden");
    });

    it("should not retry on HTTP 500 Internal Server Error and preserve original error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Internal server error",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.error).toBe("Internal server error");
    });

    it("should not retry on HTTP 400 for unrelated validation errors and preserve original error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Council ID is missing",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toBe("Council ID is missing");
    });

    it("should return explicit sorting error when backend explicitly rejects sort parameter and never return unsorted data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Field 'ChargeHeadCode' is not sortable on this endpoint",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toBe("Field 'ChargeHeadCode' is not sortable on this endpoint");
      expect(response.data).toBeUndefined();
    });

    it("should preserve original error when backend rejects sort parameter with SortBy keyword in message", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "SortBy parameter is rejected",
      });

      const response = await getChargeHeadsPaged({ sortBy: "chargeHeadCode" });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toBe("SortBy parameter is rejected");
      expect(response.data).toBeUndefined();
    });
  });
});
