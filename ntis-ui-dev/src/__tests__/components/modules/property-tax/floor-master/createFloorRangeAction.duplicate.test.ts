import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock i18n config
vi.mock("@/i18n/config", () => ({
  locales: ["en"],
}));

// Mock floor service
const mockGetFloorPaged = vi.fn();
vi.mock("@/lib/api/floor.service", () => ({
  getFloorPaged: (...args: unknown[]) => mockGetFloorPaged(...args),
  createFloorRange: vi.fn(),
}));

import { createFloorRangeAction } from "@/app/[locale]/property-tax/floormaster/actions";

describe("createFloorRangeAction duplicate range", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Provide a valid user_id cookie so getUserIdFromCookies returns a userId
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn((name: string) =>
        name === "user_id" ? { name: "user_id", value: "42" } : undefined
      ),
      getAll: vi.fn(() => []),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as unknown as ReturnType<typeof cookies>);
  });

  it("should return duplicate error if range exists", async () => {
    // Existing floor in DB: sequenceNo=15, floorCode='A5FL15' — overlaps with range 11-18 + prefix 'A5FL'
    mockGetFloorPaged.mockResolvedValue({
      items: [
        { sequenceNo: 15, floorCode: "A5FL15" },
      ],
      total: 1,
    });

    const result = await createFloorRangeAction({
      rangeFrom: "11",
      rangeTo: "18",
      startSequenceNo: 11,
      template: {
        isActive: true,
        floorCode: "A5FL",
        description: "Floor A5FL",
        sequenceNo: 11,
        maxFloorNo: 18,
        descriptionEnglish: "Floor A5FL",
        fLatGenerationGroupId: 1,
        fLatGenerationSeq: 1,
      },
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.messageKey).toMatch(/duplicate/i);
  });
});
