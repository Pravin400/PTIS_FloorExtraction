/* eslint-disable react-hooks/set-state-in-effect */
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { MasterTable, Column, Button } from "@/components/common";
import { MappingLink } from "@/types/property-mapping";
import { UnmapSelectionModal } from "./UnmapSelectionModal";

interface ActiveMappingsRegisterProps {
  mappings: MappingLink[];
  onDisconnectMapping: (newPropNo: string, id: string, selectedOldPropNos?: string[]) => void;
}

export function ActiveMappingsRegister({
  mappings,
  onDisconnectMapping,
}: ActiveMappingsRegisterProps) {
  const t = useTranslations("propertyMapping");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMappingForUnmap, setSelectedMappingForUnmap] = useState<MappingLink | null>(null);

  useEffect(() => {
    setPage(1);
  }, [mappings.length]);

  const totalCount = mappings.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = mappings.slice(startIndex, startIndex + pageSize);

  const handleOpenUnmap = (mapping: MappingLink) => {
    setSelectedMappingForUnmap(mapping);
  };

  const handleConfirmUnmapFromModal = (selectedPropNos: string[]) => {
    if (!selectedMappingForUnmap) return;
    const mapping = selectedMappingForUnmap;
    setSelectedMappingForUnmap(null);
    onDisconnectMapping(mapping.newPropNo, mapping.id, selectedPropNos);
  };

  const columns: Column<MappingLink>[] = [
    {
      key: "id",
      label: t("confirmedMappingsTab.columns.mappingLinkId"),
      cellClassName: "font-mono font-bold text-slate-800",
    },
    {
      key: "newPropNo",
      label: t("confirmedMappingsTab.columns.newSurveyProperty"),
      cellClassName: "font-bold text-blue-700",
    },
    {
      key: "oldPropNos",
      label: t("confirmedMappingsTab.columns.legacyOldProperties"),
      render: (val) => {
        const oldPropNos = val as string[];
        return <span className="font-mono">{oldPropNos?.join(", ") || t("confirmedMappingsTab.unmappedLabel")}</span>;
      },
    },
    {
      key: "mapType",
      label: t("confirmedMappingsTab.columns.relationshipType"),
      render: (val) => (
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-150 font-bold">
          {String(val)}
        </span>
      ),
    },
    {
      key: "confidence",
      label: t("confirmedMappingsTab.columns.confidence"),
      render: (val) => <span className="font-extrabold text-emerald-600">{String(val)}%</span>,
    },
    {
      key: "mappedBy",
      label: t("confirmedMappingsTab.columns.verifiedBy"),
    },
    {
      key: "mappedAt",
      label: t("confirmedMappingsTab.columns.verifiedDate"),
      render: (val) => {
        if (!val) return "-";
        const str = String(val);
        // Handle YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const [year, month, day] = str.split("T")[0].split("-");
          return <span className="font-mono font-bold text-slate-700">{`${day}-${month}-${year}`}</span>;
        }
        // Handle standard Date string
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          const day = String(parsed.getDate()).padStart(2, "0");
          const month = String(parsed.getMonth() + 1).padStart(2, "0");
          const year = parsed.getFullYear();
          return <span className="font-mono font-bold text-slate-700">{`${day}-${month}-${year}`}</span>;
        }
        return <span className="font-mono font-bold text-slate-700">{str}</span>;
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">
        {t("confirmedMappingsTab.title")}
      </h3>
      <MasterTable
        columns={columns}
        data={paginatedData}
        emptyText={t("confirmedMappingsTab.emptyText")}
        renderActions={(row) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenUnmap(row)}
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-black rounded-lg transition-all duration-150 hover:scale-[1.02]"
          >
            {t("confirmedMappingsTab.unmapButton")}
          </Button>
        )}
        actionLabel={t("confirmedMappingsTab.columns.action")}
        getRowKey={(row) => row.id}
        pageNumber={safePage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      />

      <UnmapSelectionModal
        isOpen={Boolean(selectedMappingForUnmap)}
        onClose={() => setSelectedMappingForUnmap(null)}
        mapping={selectedMappingForUnmap}
        onConfirmUnmap={handleConfirmUnmapFromModal}
      />
    </div>
  );
}
