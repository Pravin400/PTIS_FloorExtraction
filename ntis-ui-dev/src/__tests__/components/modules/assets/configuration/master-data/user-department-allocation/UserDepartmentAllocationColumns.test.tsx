import { describe, it, expect, vi } from "vitest";
import { getUserDepartmentAllocationColumns } from "@/components/modules/assets/configuration/master-data/user-department-allocation/UserDepartmentAllocationColumns";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

describe("UserDepartmentAllocationColumns", () => {
  const t = (key: string) => `trans_${key}`;
  const tCommon = (key: string) => `common_${key}`;

  it("should return the correct columns configuration", () => {
    const columns = getUserDepartmentAllocationColumns(t, tCommon);
    expect(columns).toHaveLength(8);
    expect(columns.map((c) => c.key)).toEqual([
      "userName",
      "firstName",
      "email",
      "departments",
      "owningDepartments",
      "allocatedZones",
      "stageAccess",
      "isActive",
    ]);
  });

  it("should configure sortable columns with SortButton", () => {
    const handleSortMock = vi.fn();
    const columns = getUserDepartmentAllocationColumns(
      t,
      tCommon,
      "userName",
      "asc",
      handleSortMock
    );

    // userName, fullName, and contact should have SortButton component as label
    expect(typeof columns[0].label).toBe("object");
    expect(typeof columns[1].label).toBe("object");
    expect(typeof columns[2].label).toBe("object");

    // departments and owningDepartments are badges, not sortable (string label)
    expect(typeof columns[3].label).toBe("string");
    expect(typeof columns[4].label).toBe("string");
  });

  it("should render owning departments and allocated zones badges correctly", () => {
    const columns = getUserDepartmentAllocationColumns(t, tCommon);
    const owningDeptCol = columns.find((c) => c.key === "owningDepartments");
    const zonesCol = columns.find((c) => c.key === "allocatedZones");

    expect(owningDeptCol).toBeDefined();
    expect(zonesCol).toBeDefined();

    const sampleRow: AssetUserListItem = {
      id: 1,
      userName: "admin",
      firstName: "Super",
      lastName: "Admin",
      userCode: "ADM01",
      email: "admin@test.com",
      mobileNo: "9999999999",
      isActive: true,
      departments: [{ id: 10, userId: 1, departmentId: 5, departmentName: "IT", isActive: true }],
      roleAllocations: [{ id: 20, userId: 1, departmentId: 5, userRoleId: 1, departmentName: "IT", userRoleName: "Administrator", isActive: true }],
      accessAllocations: [
        {
          id: 100,
          userId: 1,
          owningDepartmentId: 5,
          owningDepartmentName: "Health Department",
          zoneId: 2,
          zoneNo: "Z01",
          zoneDescription: "Zone 1",
          isActive: true,
        },
      ],
    };

    // Render departments badges
    const deptsRender = owningDeptCol?.render?.(undefined, sampleRow, 0);
    expect(deptsRender).toBeDefined();

    // Render zones badges
    const zonesRender = zonesCol?.render?.(undefined, sampleRow, 0);
    expect(zonesRender).toBeDefined();

    // Render stage access badges
    const stageAccessCol = columns.find((c) => c.key === "stageAccess");
    expect(stageAccessCol).toBeDefined();
    const stageAccessRender = stageAccessCol?.render?.(undefined, {
      ...sampleRow,
      stageAccess: [
        { id: 1, userId: 1, stageId: 1, stageCode: "STG_VERIFY", stageName: "Verification", isActive: true },
      ],
    }, 0);
    expect(stageAccessRender).toBeDefined();
  });
});
