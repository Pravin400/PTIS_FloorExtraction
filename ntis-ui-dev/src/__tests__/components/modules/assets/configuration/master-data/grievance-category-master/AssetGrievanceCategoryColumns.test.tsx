import { describe, it, expect, vi } from "vitest";
import { getAssetGrievanceCategoryColumns } from "@/components/modules/assets/configuration/master-data/grievance-category-master/AssetGrievanceCategoryColumns";

describe("AssetGrievanceCategoryColumns", () => {
  const t = (key: string) => `trans_${key}`;
  const tCommon = (key: string) => `common_${key}`;

  it("should return the correct column configuration", () => {
    const columns = getAssetGrievanceCategoryColumns(t, tCommon);
    expect(columns).toHaveLength(9);
    expect(columns[0].key).toBe("grievanceTypeCode");
    expect(columns[1].key).toBe("grievanceTypeName");
    expect(columns[2].key).toBe("grievanceTypeNameLocal");
    expect(columns[3].key).toBe("codeFormat");
    expect(columns[4].key).toBe("targetTableName");
    expect(columns[5].key).toBe("description");
    expect(columns[6].key).toBe("slaDays");
    expect(columns[7].key).toBe("displaySequence");
    expect(columns[8].key).toBe("isActive");
  });

  it("should configure sortable columns as SortableHeader components", () => {
    const onSortMock = vi.fn();
    const columns = getAssetGrievanceCategoryColumns(t, tCommon, "grievanceTypeCode", "asc", onSortMock);

    expect(typeof columns[0].label).toBe("object"); // grievanceTypeCode - sortable
    expect(typeof columns[1].label).toBe("object"); // grievanceTypeName - sortable
    expect(typeof columns[2].label).toBe("object"); // grievanceTypeNameLocal - sortable
    // codeFormat is not sortable in backend query parameters
    expect(typeof columns[3].label).toBe("string"); // codeFormat - not sortable
    expect(typeof columns[4].label).toBe("object"); // targetTableName - sortable
    expect(typeof columns[5].label).toBe("string"); // description - not sortable
    expect(typeof columns[6].label).toBe("object"); // slaDays - sortable
    expect(typeof columns[7].label).toBe("object"); // displaySequence - sortable
    expect(typeof columns[8].label).toBe("object"); // isActive - sortable
  });
});
