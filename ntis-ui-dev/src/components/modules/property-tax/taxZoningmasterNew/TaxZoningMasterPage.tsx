"use client";

import DocumentsShowcase from "./DocumentsShowcase";
import CoverageDashboard from "./CoverageDashboard";
import TaxZoningViewTable from "./TaxZoningViewTable";
import { TaxZoningMasterPageProps } from "@/types/taxZoningRange.types";

export default function TaxZoningMasterPage(props: TaxZoningMasterPageProps) {
  return (
    <div className="max-w-[1700px]px-4 py-3 space-y-3 bg-[#f5f8fc] text-[#172033] font-sans h-full">
      <DocumentsShowcase />

      <CoverageDashboard coverage={props.coverage} />

      <TaxZoningViewTable
        data={props.data}
        taxZones={props.taxZones.items}
        wardsData={props.wardsData.items}
        totalCount={props.totalCount}
        pageNumber={props.pageNumber}
        pageSize={props.pageSize}
        filters={props.filters}
        ulbName={props.ulbName}
      />
    </div>
  );
}
