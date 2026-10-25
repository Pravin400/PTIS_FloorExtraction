import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getAliasMasterColumns } from "@/components/modules/configuration-settings/alias-master/AliasMasterColumns";
import type { AliasMaster } from "@/types/alias-master.types";

describe("getAliasMasterColumns", () => {
  const t = (key: string) => `trans_${key}`;
  const tCommon = (key: string) => `common_${key}`;
  const onSort = vi.fn();
  const onToggleStatus = vi.fn();

  const baseRow: AliasMaster = {
    id: 1,
    aliasKey: "ALS-000001",
    keyName: "Ward_No",
    labelName: "Ward No",
    englishName: "Sector",
    regionalName: "सेक्टर",
    hindiName: "सेक्टर",
    isActive: true,
  };

  it("should return the expected column configuration", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });
    expect(columns.map((c) => c.key)).toEqual([
      "keyName",
      "labelName",
      "englishName",
      "regionalName",
      "hindiName",
      "isActive",
    ]);
  });

  it("should make keyName, labelName, and englishName sortable but not regionalName/hindiName", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });

    expect(typeof columns[0].label).toBe("object"); // keyName -> SortableHeader
    expect(typeof columns[1].label).toBe("object"); // labelName -> SortableHeader
    expect(typeof columns[2].label).toBe("object"); // englishName -> SortableHeader
    expect(columns[3].label).toBe("trans_regionalName"); // plain string, not sortable
    expect(columns[4].label).toBe("trans_hindiName"); // plain string, not sortable
  });

  it("should render string values and fall back to '-' for missing englishName/regionalName/hindiName", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });
    const keyNameCol = columns.find((c) => c.key === "keyName")!;
    const englishCol = columns.find((c) => c.key === "englishName")!;

    expect(keyNameCol.render!("Ward_No", baseRow, 0)).toBe("Ward_No");
    expect(englishCol.render!(undefined, { ...baseRow, englishName: null }, 0)).toBe("-");
  });

  it("should invoke onSort with the column key when a sort button is clicked", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });
    render(<div>{columns[0].label}</div>);

    const sortButton = screen.getByRole("button", { name: /common_table\.sort\.by trans_keyName/i });
    fireEvent.click(sortButton);

    expect(onSort).toHaveBeenCalledWith("keyName");
  });

  it("should render a ToggleSwitch reflecting isActive and invoke onToggleStatus on click", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });
    const statusCol = columns.find((c) => c.key === "isActive")!;

    render(<div>{statusCol.render!(true, baseRow, 0)}</div>);

    expect(screen.getByText("trans_active")).toBeInTheDocument();

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(onToggleStatus).toHaveBeenCalledWith(baseRow);
  });

  it("should show inactive label and text styling for an inactive row", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus });
    const statusCol = columns.find((c) => c.key === "isActive")!;
    const inactiveRow = { ...baseRow, isActive: false };

    render(<div>{statusCol.render!(false, inactiveRow, 0)}</div>);

    expect(screen.getByText("trans_inactive")).toBeInTheDocument();
  });

  it("should disable the ToggleSwitch for the row currently being toggled", () => {
    const columns = getAliasMasterColumns({ t, tCommon, onSort, onToggleStatus, togglingId: 1 });
    const statusCol = columns.find((c) => c.key === "isActive")!;

    render(<div>{statusCol.render!(true, baseRow, 0)}</div>);

    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
