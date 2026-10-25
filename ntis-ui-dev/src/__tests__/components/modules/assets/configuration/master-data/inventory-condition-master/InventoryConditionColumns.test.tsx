import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { getInventoryConditionColumns } from "@/components/modules/assets/configuration/master-data/inventory-condition-master/InventoryConditionColumns";
import type { InventoryCondition } from "@/types/asset-masters/inventory-condition.types";

describe("InventoryConditionColumns", () => {
  const t = (key: string) => key;
  const tCommon = (key: string) => key;

  const columns = getInventoryConditionColumns(
    t,
    tCommon,
    undefined,
    undefined,
    undefined
  );

  it("renders all defined columns without categoryId", () => {
    const keys = columns.map((c) => c.key);
    expect(keys).toContain("conditionCategory");
    expect(keys).toContain("conditionName");
    expect(keys).toContain("conditionFactor");
    expect(keys).toContain("displayOrder");
    expect(keys).toContain("description");
    expect(keys).toContain("isActive");
    expect(keys).not.toContain("categoryId");
  });

  it("renders conditionCategory correctly", () => {
    const col = columns.find((c) => c.key === "conditionCategory")!;
    const row: InventoryCondition = {
      id: 101,
      conditionCategory: "Asset",
      categoryId: 1,
      conditionName: "Good",
      conditionFactor: 0.9,
      displayOrder: 1,
      isActive: true,
    };

    const rendered = col.render!("Asset", row, 0);
    render(<div>{rendered}</div>);
    expect(screen.getByText("Asset")).toBeDefined();
  });

  it("renders conditionName correctly", () => {
    const col = columns.find((c) => c.key === "conditionName")!;
    const row: InventoryCondition = {
      id: 102,
      conditionCategory: "Inventory",
      categoryId: 1,
      conditionName: "Needs Maintenance",
      conditionFactor: 0.4,
      displayOrder: 1,
      isActive: true,
    };

    const rendered = col.render!("Needs Maintenance", row, 0);
    render(<div>{rendered}</div>);
    expect(screen.getByText("Needs Maintenance")).toBeDefined();
  });
});
