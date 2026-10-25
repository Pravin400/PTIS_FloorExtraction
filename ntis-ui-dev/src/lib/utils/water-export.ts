import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

export interface TariffSlabDto {
  tariffId?: number;
  tariffName?: string;
  tapSizeId?: number;
  tapSizeName?: string;
  geographyName?: string;
  fromUnit?: number;
  toUnit?: number;
  unitRate?: number;
  fixedCharge?: number;
  minimumCharge?: number;
  maximumCharge?: number;
  perConnectionAmount?: number;
  formulaCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

export function exportToCsv<T>(data: T[], columns: ExportColumn<T>[], filename: string): void {
  if (typeof window === "undefined" || !data || data.length === 0) return;

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  const csvContent = [headerRow, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTariffSlabs(data: TariffSlabDto[]): void {
  const columns: ExportColumn<TariffSlabDto>[] = [
    { header: "Tariff", accessor: (r) => r.tariffName || r.tariffId },
    { header: "Tap Size", accessor: (r) => r.tapSizeName || r.tapSizeId },
    { header: "Geography", accessor: (r) => r.geographyName || "" },
    { header: "From Unit", accessor: (r) => r.fromUnit ?? 0 },
    { header: "To Unit", accessor: (r) => r.toUnit ?? "" },
    { header: "Unit Rate", accessor: (r) => r.unitRate ?? "" },
    { header: "Fixed Charge", accessor: (r) => r.fixedCharge ?? "" },
    { header: "Min Charge", accessor: (r) => r.minimumCharge ?? "" },
    { header: "Max Charge", accessor: (r) => r.maximumCharge ?? "" },
    { header: "Per Conn Amount", accessor: (r) => r.perConnectionAmount ?? "" },
    { header: "Formula Code", accessor: (r) => r.formulaCode },
    { header: "Sort Order", accessor: (r) => r.sortOrder },
    { header: "Active", accessor: (r) => (r.isActive ? "Yes" : "No") },
  ];
  exportToCsv(data, columns, "tariff_slabs_export");
}

export function exportPenaltyRules(data: WaterPenaltyRuleDto[]): void {
  const columns: ExportColumn<WaterPenaltyRuleDto>[] = [
    { header: "FY", accessor: (r) => r.financialYearName || r.financialYearId },
    { header: "Category", accessor: (r) => r.connectionCategoryName || r.connectionCategoryId },
    { header: "Geography", accessor: (r) => r.geographyName || "" },
    { header: "Charge Head", accessor: (r) => r.chargeHeadName || r.chargeHeadId || "" },
    { header: "Type", accessor: (r) => r.penaltyType },
    { header: "From Day", accessor: (r) => r.fromDay },
    { header: "To Day", accessor: (r) => r.toDay ?? "" },
    { header: "Rate (%)", accessor: (r) => r.percentageRate ?? "" },
    { header: "Flat (₹)", accessor: (r) => r.flatAmount ?? "" },
    { header: "Max Amount (₹)", accessor: (r) => r.maximumAmount ?? "" },
    { header: "Effective From", accessor: (r) => r.effectiveFrom?.split("T")[0] },
    { header: "Effective To", accessor: (r) => r.effectiveTo?.split("T")[0] },
    { header: "Current Bill", accessor: (r) => (r.isCurrentBill ? "Yes" : "No") },
    { header: "Pending Bill", accessor: (r) => (r.isPendingBill ? "Yes" : "No") },
    { header: "Active", accessor: (r) => (r.isActive ? "Yes" : "No") },
  ];
  exportToCsv(data, columns, "penalty_rules_export");
}
