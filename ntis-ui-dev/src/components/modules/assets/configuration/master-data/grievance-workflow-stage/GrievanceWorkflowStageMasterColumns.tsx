import type { Column } from "@/components/common/MasterTable";
import type { GrievanceWorkflowStageMaster } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { SortableColumnHeader, type SortDirection } from "@/components/common/SortableColumnHeader";
import { TruncatedText } from "@/components/common/TruncatedText";

interface GetGrievanceWorkflowStageMasterColumnsProps {
  t: (key: string) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
}

export function getGrievanceWorkflowStageMasterColumns({
  t,
  sortBy,
  sortOrder,
  onSort,
}: GetGrievanceWorkflowStageMasterColumnsProps): Column<GrievanceWorkflowStageMaster>[] {
  const createSortableLabel = (label: string, dataKey: string) => {
    const isActive = sortBy === dataKey;
    const direction: SortDirection =
      isActive && (sortOrder === "asc" || sortOrder === "desc") ? sortOrder : null;

    return (
      <div className="flex w-full items-center justify-center">
        <SortableColumnHeader
          label={label}
          sortDirection={direction}
          onSort={() => onSort(dataKey)}
          variant="plain"
          size="sm"
          className="font-normal normal-case !text-white hover:!text-white hover:opacity-100 focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none active:!outline-none border-none outline-none [&_*]:!text-white hover:[&_*]:!text-white [&_svg]:!opacity-100"
        />
      </div>
    );
  };

  return [
    {
      key: "stageCode",
      label: createSortableLabel(t("stageCode"), "stageCode"),
      width: "15%",
      align: "center",
      render: (v) => <TruncatedText text={typeof v === "string" ? v : ""} maxLength={20} />,
    },
    {
      key: "stageName",
      label: createSortableLabel(t("stageName"), "stageName"),
      width: "20%",
      align: "center",
      render: (v) => <TruncatedText text={typeof v === "string" ? v : ""} maxLength={25} />,
    },
    {
      key: "stageNameLocal",
      label: t("stageNameLocal"),
      width: "20%",
      align: "center",
      render: (v) => <TruncatedText text={typeof v === "string" && v ? v : "-"} maxLength={25} />,
    },
    {
      key: "stageOrder",
      label: createSortableLabel(t("stageOrder"), "stageOrder"),
      width: "10%",
      align: "center",
      render: (v) => (v != null ? String(v) : ""),
    },
    {
      key: "status",
      label: createSortableLabel(t("workflowStatus"), "status"),
      width: "12%",
      align: "center",
      render: (v) => <TruncatedText text={typeof v === "string" ? v : ""} maxLength={20} />,
    },
    {
      key: "description",
      label: t("description"),
      width: "15%",
      align: "center",
      render: (v) => <TruncatedText text={typeof v === "string" && v ? v : "-"} maxLength={25} />,
    },
    {
      key: "isActive",
      label: t("activeStatus"),
      width: "8%",
      align: "center",
      isStatus: true,
    },
  ];
}
