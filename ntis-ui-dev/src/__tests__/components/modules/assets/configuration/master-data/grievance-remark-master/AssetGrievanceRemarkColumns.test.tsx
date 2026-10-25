import { describe, it, expect, vi } from "vitest";
import { getAssetGrievanceRemarkColumns } from "@/components/modules/assets/configuration/master-data/grievance-remark-master/AssetGrievanceRemarkColumns";

describe("AssetGrievanceRemarkColumns", () => {
  const t = (key: string) => `trans_${key}`;
  const tCommon = (key: string) => `common_${key}`;

  it("should return correct columns with remark and grievanceCategoryName mapping", () => {
    const columns = getAssetGrievanceRemarkColumns(t, tCommon);
    expect(columns).toHaveLength(4);
    expect(columns[0].key).toBe("remark");
    expect(columns[1].key).toBe("description");
    expect(columns[2].key).toBe("grievanceCategoryName");
    expect(columns[3].key).toBe("isActive");
  });

  it("should configure sorting with remark as sortable while grievanceCategoryName is non-sortable", () => {
    const onSortMock = vi.fn();
    const columns = getAssetGrievanceRemarkColumns(t, tCommon, "remark", "desc", onSortMock);

    // remark (index 0) should have sortable header (React object)
    expect(typeof columns[0].label).toBe("object");

    // description (index 1), grievanceCategoryName (index 2), and isActive (index 3) should be static text
    expect(typeof columns[1].label).toBe("string");
    expect(typeof columns[2].label).toBe("string");
    expect(typeof columns[3].label).toBe("string");
  });
});
