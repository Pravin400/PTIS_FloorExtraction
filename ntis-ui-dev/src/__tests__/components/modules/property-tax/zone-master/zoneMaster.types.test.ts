import { describe, it, expect } from "vitest";
import type {
  ZoneItem,
  ZoneListResponse,
  ZoneMutationResponse,
  CreateZonePayload,
  UpdateZonePayload,
} from "@/types/zoneMaster.types";
import type {
  WardItem,
  WardListResponse,
  WardMutationResponse,
  CreateWardPayload,
  UpdateWardPayload,
  BatchWardCreatePayload,
  BatchWardCreateResponse,
} from "@/types/wardMaster.types";

describe("zoneMaster.types", () => {
  describe("ZoneItem", () => {
    it("should have correct structure", () => {
      const zone: ZoneItem = {
        id: 1,
        zoneNo: "UT",
        description: "उथळसर",
        sequenceNo: null,
        isActive: true,
        createdDate: "2026-04-09T10:59:28.577",
        updatedDate: null,
      };

      expect(zone.id).toBe(1);
      expect(zone.zoneNo).toBe("UT");
      expect(zone.description).toBe("उथळसर");
      expect(zone.sequenceNo).toBeNull();
      expect(zone.isActive).toBe(true);
    });

    it("should support wardCount optional field", () => {
      const zone: ZoneItem = {
        id: 1,
        zoneNo: "UT",
        description: "उथळसर",
        sequenceNo: null,
        isActive: true,
        createdDate: "2026-04-09T10:59:28.577",
        updatedDate: null,
        wardCount: 5,
      };

      expect(zone.wardCount).toBe(5);
    });
  });

  describe("ZoneListResponse", () => {
    it("should have correct pagination structure", () => {
      const response: ZoneListResponse = {
        items: [],
        totalCount: 9,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };

      expect(response.totalCount).toBe(9);
      expect(response.pageNumber).toBe(1);
      expect(response.hasPrevious).toBe(false);
      expect(response.hasNext).toBe(false);
    });
  });

  describe("ZoneMutationResponse", () => {
    it("should support success response", () => {
      const response: ZoneMutationResponse<ZoneItem> = {
        success: true,
        message: "Record inserted successfully",
        items: {
          id: 10,
          zoneNo: "WKD",
          description: "Wakad",
          sequenceNo: 66,
          isActive: true,
          createdDate: "2026-04-29T12:57:14.6114114+05:30",
          updatedDate: null,
        },
        errors: null,
      };

      expect(response.success).toBe(true);
      expect(response.items?.zoneNo).toBe("WKD");
    });

    it("should support error response", () => {
      const response: ZoneMutationResponse = {
        success: false,
        message: "Zone already exists",
        items: null,
        errors: ["Duplicate zone number"],
      };

      expect(response.success).toBe(false);
      expect(response.errors).toContain("Duplicate zone number");
    });
  });

  describe("CreateZonePayload", () => {
    it("should have required fields", () => {
      const payload: CreateZonePayload = {
        zoneNo: "WKD",
        description: "Wakad",
        isActive: true,
        createdBy: 0,
      };

      expect(payload.zoneNo).toBe("WKD");
      expect(payload.description).toBe("Wakad");
      expect(payload.isActive).toBe(true);
    });

    it("should support optional sequenceNo", () => {
      const payload: CreateZonePayload = {
        zoneNo: "WKD",
        description: "Wakad",
        sequenceNo: 66,
        isActive: true,
        createdBy: 0,
      };

      expect(payload.sequenceNo).toBe(66);
    });
  });

  describe("UpdateZonePayload", () => {
    it("should have required fields", () => {
      const payload: UpdateZonePayload = {
        zoneNo: "WKDN",
        description: "Wakad new",
        isActive: true,
        updatedBy: 0,
      };

      expect(payload.zoneNo).toBe("WKDN");
      expect(payload.updatedBy).toBe(0);
    });
  });
});

describe("wardMaster.types", () => {
  describe("WardItem", () => {
    it("should have correct structure", () => {
      const ward: WardItem = {
        id: 1,
        wardNo: "UT1",
        zoneId: 1,
        description: "UT1",
        sequenceNo: null,
        isActive: true,
        createdDate: "2026-04-09T10:59:28.6",
        updatedDate: null,
      };

      expect(ward.id).toBe(1);
      expect(ward.wardNo).toBe("UT1");
      expect(ward.zoneId).toBe(1);
      expect(ward.isActive).toBe(true);
    });
  });

  describe("WardListResponse", () => {
    it("should have correct pagination structure", () => {
      const response: WardListResponse = {
        items: [],
        totalCount: 102,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 11,
        hasPrevious: false,
        hasNext: true,
      };

      expect(response.totalCount).toBe(102);
      expect(response.totalPages).toBe(11);
      expect(response.hasNext).toBe(true);
    });
  });

  describe("WardMutationResponse", () => {
    it("should support success response", () => {
      const response: WardMutationResponse<WardItem> = {
        success: true,
        message: "Record inserted successfully",
        items: {
          id: 106,
          wardNo: "wkd 12",
          zoneId: 11,
          description: "wakad 12",
          sequenceNo: 87,
          isActive: true,
          createdDate: "2026-04-29T13:05:26.3146278+05:30",
          updatedDate: null,
        },
        errors: null,
      };

      expect(response.success).toBe(true);
      expect(response.items?.wardNo).toBe("wkd 12");
    });
  });

  describe("CreateWardPayload", () => {
    it("should have required fields", () => {
      const payload: CreateWardPayload = {
        wardNo: "wkd 12",
        zoneId: 11,
        description: "wakad 12",
        isActive: true,
      };

      expect(payload.wardNo).toBe("wkd 12");
      expect(payload.zoneId).toBe(11);
      expect(payload.description).toBe("wakad 12");
    });

    it("should support optional fields", () => {
      const payload: CreateWardPayload = {
        wardNo: "wkd 12",
        zoneId: 11,
        description: "wakad 12",
        sequenceNo: 87,
        isActive: true,
        createdBy: 0,
      };

      expect(payload.sequenceNo).toBe(87);
      expect(payload.createdBy).toBe(0);
    });
  });

  describe("UpdateWardPayload", () => {
    it("should have required fields", () => {
      const payload: UpdateWardPayload = {
        wardNo: "wkd 21",
        zoneId: 11,
        description: "wakad 21",
        isActive: true,
        updatedBy: 0,
      };

      expect(payload.wardNo).toBe("wkd 21");
      expect(payload.updatedBy).toBe(0);
    });
  });

  describe("BatchWardCreatePayload", () => {
    it("should have correct structure", () => {
      const payload: BatchWardCreatePayload = {
        fromValue: "DI15",
        toValue: "DI24",
        rangePropertyName: "wardno,description",
        template: {
          isActive: true,
          createdBy: 0,
          wardNo: "null",
          zoneId: 5,
          description: "",
        },
      };

      expect(payload.fromValue).toBe("DI15");
      expect(payload.toValue).toBe("DI24");
      expect(payload.template.zoneId).toBe(5);
    });
  });

  describe("BatchWardCreateResponse", () => {
    it("should support success response", () => {
      const response: BatchWardCreateResponse = {
        success: true,
        message: "2 records created successfully",
        items: {
          successCount: 2,
          failedCount: 0,
          results: [],
          errors: null,
          hasFailures: false,
          allSucceeded: true,
        },
        errors: null,
      };

      expect(response.success).toBe(true);
      expect(response.items?.successCount).toBe(2);
      expect(response.items?.allSucceeded).toBe(true);
    });
  });
});
