import { describe, it, expect, vi } from "vitest";
import { getDesignationColumns } from "@/components/modules/assets/configuration/master-data/designation-master/DesignationColumns";

describe("DesignationColumns", () => {
  const t = (key: string) => `trans_${key}`;
  const tCommon = (key: string) => `common_${key}`;

  it("should return Designation column configurations", () => {
    const columns = getDesignationColumns(t, tCommon);
    expect(columns).toHaveLength(6);
    expect(columns[0].key).toBe("designationCode");
    expect(columns[1].key).toBe("designationName");
    expect(columns[2].key).toBe("designationLocal");
    expect(columns[3].key).toBe("designationDescription");
    expect(columns[4].key).toBe("owningDepartmentName");
    expect(columns[5].key).toBe("isActive");
  });

  it("should make designationCode, designationName, and designationLocal sortable", () => {
    const onSortMock = vi.fn();
    const columns = getDesignationColumns(t, tCommon, "designationCode", "asc", onSortMock);

    expect(typeof columns[0].label).toBe("object");
    expect(typeof columns[1].label).toBe("object");
    expect(typeof columns[2].label).toBe("object");

    // description and department should not be sortable
    expect(typeof columns[3].label).toBe("string");
    expect(typeof columns[4].label).toBe("string");
  });
});
