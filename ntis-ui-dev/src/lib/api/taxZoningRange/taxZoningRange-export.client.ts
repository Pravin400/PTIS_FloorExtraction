"use client";

export type TaxZoningExportType = "ward-abstract-excel" | "ranges-excel" | "pending-excel";

/**
 * Triggers a browser download via the authenticated Next.js proxy route.
 * Safe to call from client components — no auth token handling needed on the client.
 */
export function downloadTaxZoningExport(
  type: TaxZoningExportType,
  extraParams?: Record<string, string>
): void {
  const params = new URLSearchParams({ type });
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
  }

  const url = `/api/tax-zoning-export?${params}`;
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
