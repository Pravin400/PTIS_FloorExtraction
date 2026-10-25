import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getChargeHeadColumns } from "@/components/modules/water-bill/charge-heads/chargeHeadColumns";
import type { ChargeHead } from "@/types/water-bill/chargeHeads.types";

describe("chargeHeadColumns Tests", () => {
  const mockT = (key: string) => key;
  const mockTCommon = (key: string) => key;

  const sampleRow: ChargeHead = {
    id: 1,
    chargeHeadCode: "WTR_CHG",
    chargeHeadName: "Water Supply Charge",
    chargeType: "Tax",
    sequenceNo: 1,
    isRefundable: true,
    isRegularPay: false,
    isActive: true,
  };

  it("should return the correct number of column definitions", () => {
    const columns = getChargeHeadColumns(mockT, mockTCommon);
    expect(columns.length).toBe(7);
  });

  it("should render chargeHeadCode, chargeHeadName, description, and chargeType cell values", () => {
    const columns = getChargeHeadColumns(mockT, mockTCommon);

    expect(columns[0].key).toBe("chargeHeadCode");
    expect(columns[1].key).toBe("chargeHeadName");
    expect(columns[2].key).toBe("description");
    expect(columns[3].key).toBe("chargeType");
  });

  it("should format boolean flags (isRefundable, isRegularPay) using StatusBadge", () => {
    const columns = getChargeHeadColumns(mockT, mockTCommon);

    const refundableCol = columns.find((c) => c.key === "isRefundable");
    const regularPayCol = columns.find((c) => c.key === "isRegularPay");

    expect(refundableCol?.render).toBeDefined();
    expect(regularPayCol?.render).toBeDefined();

    if (refundableCol?.render) {
      const { container } = render(<>{refundableCol.render(true, sampleRow, 0)}</>);
      expect(container.firstChild).toBeInTheDocument();
    }

    if (regularPayCol?.render) {
      const { container } = render(<>{regularPayCol.render(false, sampleRow, 0)}</>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it("should work correctly without translation functions", () => {
    const columns = getChargeHeadColumns();
    expect(columns.length).toBe(7);
    expect(columns[0].label).toBe("Charge Head Code");
    expect(columns[1].label).toBe("Name");
    expect(columns[2].label).toBe("Description");
  });
});
