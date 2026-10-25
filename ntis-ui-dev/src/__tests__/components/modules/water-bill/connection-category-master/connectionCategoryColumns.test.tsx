import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getConnectionCategoryColumns } from "@/components/modules/water-bill/connection-category-master/connectionCategoryColumns";
import type { ConnectionCategory } from "@/types/waterBill/connectionCategoryMaster.types";

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    "table.connectionCategoryCode": "Category Type Code",
    "table.connectionCategory": "Connection Category",
    "table.billingFrequency": "Billing Frequency",
    "table.isMetered": "Metered Type",
    "table.metered": "Metered",
    "table.unmetered": "Non-Metered",
    "table.billingMethod": "Billing Method",
    "table.description": "Description",
    "table.statusName": "Status",
  };
  return translations[key] ?? key;
};

const mockRowMetered: ConnectionCategory = {
  id: 1,
  connectionCategoryCode: "REG",
  connectionCategory: "Regular Metered",
  billingFrequency: "Monthly",
  isMetered: true,
  billingMethod: "Metered",
  description: "Regular metered desc",
  isActive: true,
};

const mockRowNonMetered: ConnectionCategory = {
  ...mockRowMetered,
  id: 2,
  isMetered: false,
};

describe("connectionCategoryColumns", () => {
  it("generates correct column definitions and labels", () => {
    const columns = getConnectionCategoryColumns(mockT);
    expect(columns).toHaveLength(7);
    expect(columns.map((c) => c.key)).toEqual([
      "connectionCategoryCode",
      "connectionCategory",
      "billingFrequency",
      "isMetered",
      "billingMethod",
      "description",
      "isActive",
    ]);
  });

  it("renders Metered badge correctly for isMetered=true", () => {
    const columns = getConnectionCategoryColumns(mockT);
    const meteredCol = columns.find((c) => c.key === "isMetered");
    expect(meteredCol?.render).toBeDefined();

    if (meteredCol?.render) {
      const rendered = meteredCol.render(true, mockRowMetered, 0);
      render(<div>{rendered}</div>);
      expect(screen.getByText("Metered")).toBeInTheDocument();
    }
  });

  it("renders Non-Metered badge correctly for isMetered=false", () => {
    const columns = getConnectionCategoryColumns(mockT);
    const meteredCol = columns.find((c) => c.key === "isMetered");
    expect(meteredCol?.render).toBeDefined();

    if (meteredCol?.render) {
      const rendered = meteredCol.render(false, mockRowNonMetered, 0);
      render(<div>{rendered}</div>);
      expect(screen.getByText("Non-Metered")).toBeInTheDocument();
    }
  });
});
