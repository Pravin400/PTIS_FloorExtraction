/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  FieldOptionsDrawer,
  parseOptionsList,
} from "@/components/modules/assets/configuration/master-data/asset-field-definition-master/FieldOptionsDrawer";

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, title, footer }: any) =>
    open ? (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-body">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null,
}));

describe("parseOptionsList Helper", () => {
  it("parses valid JSON array of strings correctly", () => {
    const result = parseOptionsList('["Male","Female"]');
    expect(result).toEqual(["Male", "Female"]);
  });

  it("parses valid JSON array of objects correctly", () => {
    const result = parseOptionsList('[{"value":"Male"},{"value":"Female"}]');
    expect(result).toEqual(["Male", "Female"]);
  });

  it("parses comma separated fallback correctly", () => {
    const result = parseOptionsList("Male, Female, Other");
    expect(result).toEqual(["Male", "Female", "Other"]);
  });

  it("returns empty array for empty or null optionsJson", () => {
    expect(parseOptionsList(null)).toEqual([]);
    expect(parseOptionsList("")).toEqual([]);
    expect(parseOptionsList("   ")).toEqual([]);
  });
});

describe("FieldOptionsDrawer Component", () => {
  const mockFieldDef = {
    id: 10,
    fieldCode: "GENDER",
    fieldName: "Gender Field",
    fieldLabel: "Gender Label",
    fieldType: "checkbox",
    fieldGroup: "Basic Info",
    isRequired: true,
    displayOrder: 1,
    isActive: true,
    assetCategoryId: 1,
    assetTypeId: 11,
    optionsJson: '["Male","Female"]',
  };

  const tMock = (key: string) => key;
  const tCommonMock = (key: string) => key;

  it("renders null when fieldDefinition is null", () => {
    const { container } = render(
      <FieldOptionsDrawer
        open={true}
        onClose={vi.fn()}
        fieldDefinition={null}
        t={tMock}
        tCommon={tCommonMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders drawer with sequence numbers and options list when open is true", () => {
    render(
      <FieldOptionsDrawer
        open={true}
        onClose={vi.fn()}
        fieldDefinition={mockFieldDef}
        t={tMock}
        tCommon={tCommonMock}
      />
    );

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByText("GENDER")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("Female")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <FieldOptionsDrawer
        open={true}
        onClose={handleClose}
        fieldDefinition={mockFieldDef}
        t={tMock}
        tCommon={tCommonMock}
      />
    );

    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
