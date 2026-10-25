import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useZoneForm } from "@/hooks/zoneMaster/useZoneForm";
import { getZoneByIdAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { toast } from "sonner";
import { ZoneItem } from "@/types/zoneMaster.types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  getZoneByIdAction: vi.fn(),
}));

describe("useZoneForm", () => {
  const mockT = vi.fn((key: string) => key);
  const mockExistingZones: ZoneItem[] = [
    {
      id: 1,
      zoneNo: "Z1",
      description: "Zone One",
      sequenceNo: null,
      isActive: true,
      wardCount: 5,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    it("should initialize with empty form state", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      expect(result.current.form.zoneNo).toBe("");
      expect(result.current.form.description).toBe("");
      expect(result.current.form.isActive).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.fetching).toBe(false);
    });

    it("should validate form with empty zone number", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate(result.current.form);
      expect(errors.zoneNo).toBe("validation.zoneNoRequired");
      expect(errors.descriptionEnglish).toBe("validation.nameEnRequired");
      expect(errors.description).toBe("validation.nameRegRequired");
    });

    it("should update form state", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      act(() => {
        result.current.setForm({
          zoneNo: "Z2",
          description: "Zone Two",
          descriptionEnglish: "",
          isActive: true,
        });
      });

      expect(result.current.form.zoneNo).toBe("Z2");
      expect(result.current.form.description).toBe("Zone Two");
    });

    it("should detect duplicate zone number", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const isDuplicate = result.current.checkDuplicateZone("Z1", "New Zone");
      expect(isDuplicate).toBe(true);
      expect(toast.error).toHaveBeenCalled();
    });

    it("should detect duplicate zone description", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const isDuplicate = result.current.checkDuplicateZone("Z2", "Zone One");
      expect(isDuplicate).toBe(true);
      expect(toast.error).toHaveBeenCalled();
    });

    it("should reset form", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      act(() => {
        result.current.setForm({
          zoneNo: "Z2",
          description: "Zone Two",
          descriptionEnglish: "",
          isActive: true,
        });
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.form.zoneNo).toBe("");
      expect(result.current.form.description).toBe("");
    });
  });

  describe("Edit Mode", () => {
    const mockInitialData: ZoneItem = {
      id: 1,
      zoneNo: "Z1",
      description: "Zone One",
      sequenceNo: null,
      isActive: true,
      wardCount: 5,
      createdDate: "2024-01-01",
      updatedDate: null,
    };

    it("should initialize with provided initial data", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "edit",
          open: true,
          zoneId: "1",
          initialData: mockInitialData,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      expect(result.current.form.zoneNo).toBe("Z1");
      expect(result.current.form.description).toBe("Zone One");
      expect(result.current.form.isActive).toBe(true);
    });

    it("should fetch zone data when SSR data is not available", async () => {
      const mockFetchedZone = {
        id: 2,
        zoneNo: "Z2",
        description: "Zone Two",
        sequenceNo: null,
        isActive: true,
        wardCount: 0,
        createdDate: "2024-01-02",
        updatedDate: null,
      };

      vi.mocked(getZoneByIdAction).mockResolvedValueOnce({
        success: true,
        data: mockFetchedZone,
      });

      const { result } = renderHook(() =>
        useZoneForm({
          mode: "edit",
          open: true,
          zoneId: "2",
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      expect(result.current.fetching).toBe(true);

      await waitFor(() => {
        expect(result.current.fetching).toBe(false);
      });

      expect(getZoneByIdAction).toHaveBeenCalledWith("2");
    });

    it("should not fetch if SSR data matches zoneId", () => {
      renderHook(() =>
        useZoneForm({
          mode: "edit",
          open: true,
          zoneId: "1",
          initialData: mockInitialData,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      expect(getZoneByIdAction).not.toHaveBeenCalled();
    });

    it("should exclude current zone when checking duplicates", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "edit",
          open: true,
          zoneId: "1",
          initialData: mockInitialData,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      // Should not flag as duplicate when checking against itself
      const isDuplicate = result.current.checkDuplicateZone("Z1", "Zone One", 1);
      expect(isDuplicate).toBe(false);
    });

    it("should reset fetch ref when drawer closes", async () => {
      const { result, rerender } = renderHook(
        ({ open }) =>
          useZoneForm({
            mode: "edit",
            open,
            zoneId: "1",
            initialData: mockInitialData,
            existingZones: mockExistingZones,
            t: mockT,
          }),
        { initialProps: { open: true } }
      );

      // Close drawer
      rerender({ open: false });

      await waitFor(() => {
        expect(result.current.form).toBeDefined();
      });
    });
  });

  describe("Validation", () => {
    it("should validate zone number length", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const longZoneNo = "Z".repeat(51); // Assuming max length is 50
      const errors = result.current.validate({
        zoneNo: longZoneNo,
        description: "Test",
        descriptionEnglish: "",
        isActive: true,
      });

      expect(errors.zoneNo).toBeDefined();
    });

    it("should validate description length", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const longDescription = "D".repeat(201); // Assuming max length is 200
      const errors = result.current.validate({
        zoneNo: "Z1",
        description: longDescription,
        descriptionEnglish: "",
        isActive: true,
      });

      expect(errors.description).toBeDefined();
    });

    it("should pass validation with valid data", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z2",
        description: "Valid Zone",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(Object.keys(errors).length).toBe(0);
    });

    it("should reject zone number with only zeros", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "0",
        description: "Valid Zone",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(errors.zoneNo).toBe("validation.zoneNoAllZeros");
    });

    it("should reject zone number with multiple zeros", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "000",
        description: "Valid Zone",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(errors.zoneNo).toBe("validation.zoneNoAllZeros");
    });

    it("should reject description with only zeros", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z1",
        description: "0",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(errors.description).toBe("validation.zoneNameAllZeros");
    });

    it("should reject description with multiple zeros", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z1",
        description: "000",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(errors.description).toBe("validation.zoneNameAllZeros");
    });

    it("should reject descriptionEnglish with only zeros", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z1",
        description: "Valid Zone",
        descriptionEnglish: "000",
        isActive: true,
      });

      expect(errors.descriptionEnglish).toBe("validation.nameEnAllZeros");
    });

    it("should reject descriptionEnglish with non-English characters", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z1",
        description: "दिवा",
        descriptionEnglish: "दिवा विभाग",
        isActive: true,
      });

      expect(errors.descriptionEnglish).toBe("validation.englishOnly");
    });

    it("should accept zone number with zeros mixed with other characters", () => {
      const { result } = renderHook(() =>
        useZoneForm({
          mode: "add",
          open: true,
          existingZones: mockExistingZones,
          t: mockT,
        })
      );

      const errors = result.current.validate({
        zoneNo: "Z01",
        description: "Valid Zone",
        descriptionEnglish: "Valid Zone English",
        isActive: true,
      });

      expect(errors.zoneNo).toBeUndefined();
    });
  });
});
