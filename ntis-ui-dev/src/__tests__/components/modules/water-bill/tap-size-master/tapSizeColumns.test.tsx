import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { getTapSizeColumns } from "@/components/modules/water-bill/tap-size-master/tapSizeColumns";
import type { TapSize } from "@/types/waterBill/tapSizeMaster.types";

describe("getTapSizeColumns", () => {
  const t = (key: string) => `translated_${key}`;

  it("returns all expected column definitions with translated labels", () => {
    const cols = getTapSizeColumns(t);
    expect(cols).toHaveLength(5);
    expect(cols[0].key).toBe("tapSizeCode");
    expect(cols[0].label).toBe("translated_table.tapSizeCode");
    expect(cols[1].key).toBe("tapSize");
    expect(cols[2].key).toBe("nominalSizeValue");
    expect(cols[3].key).toBe("sizeUnit");
    expect(cols[4].key).toBe("isActive");
  });

  it("renders nominalSizeValue using formatNominalSize", () => {
    const cols = getTapSizeColumns(t);
    const nominalCol = cols.find((c) => c.key === "nominalSizeValue");
    expect(nominalCol?.render).toBeDefined();

    const mockRow: TapSize = {
      id: 1,
      tapSizeCode: "TAP01",
      tapSize: "1/2 Inch",
      nominalSizeValue: 0.75,
      sizeUnit: "Inch",
      isActive: true,
    };

    if (nominalCol?.render) {
      const rendered = nominalCol.render("0.750", mockRow, 0);
      render(<div>{rendered}</div>);
      expect(screen.getByText("0.75")).toBeInTheDocument();
    }
  });
});
