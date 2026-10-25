import type { Column } from "@/components/common/MasterTable";
import type { CommonRemark } from "@/types/common-remark-master/common-remark.types";

export function getCommonRemarkColumns(
  t: (key: string, values?: Record<string, string | number>) => string,
  _tCommon: (key: string) => string,
  _sortBy?: string,
  _sortOrder?: string,
  _onSort?: (key: string) => void
): Column<CommonRemark>[] {
  const getBadgeColorClass = (type: string, id?: number) => {
    const staticColors: Record<string, string> = {
      Survey: "bg-[#E3F0FB] text-[#1565C0] border-[#BFDBF5]",
      Recovery: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
      Notice: "bg-[#F3E8FF] text-[#6A1B9A] border-[#D1C4E9]",
      "Mobile Remark": "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
    };

    if (staticColors[type]) {
      return staticColors[type];
    }

    const colorStyles = [
      "bg-[#E3F0FB] text-[#1565C0] border-[#BFDBF5]", // Blue
      "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]", // Orange
      "bg-[#F3E8FF] text-[#6A1B9A] border-[#D1C4E9]", // Purple
      "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]", // Green
      "bg-[#FFECEF] text-[#C62828] border-[#FFCDD2]", // Red
      "bg-[#E0F7FA] text-[#00838F] border-[#B2EBF2]", // Cyan
      "bg-[#FCE4EC] text-[#AD1457] border-[#F8BBD0]", // Pink
      "bg-[#FFFDE7] text-[#F57F17] border-[#FFF9C4]", // Yellow
    ];

    if (id && Number.isFinite(id) && id > 0) {
      return colorStyles[id % colorStyles.length];
    }

    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorStyles.length;
    return colorStyles[index];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return dateStr;
      }
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return [
    {
      key: "remarkType",
      label: t("table.columns.remarkType"),
      width: "15%",
      render: (value, row) => {
        const type = String(value);
        const colorClass = getBadgeColorClass(type, row?.remarkTypeId ? Number(row.remarkTypeId) : undefined);
        return (
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold border rounded-sm ${colorClass}`}>
            {type}
          </span>
        );
      },
    },
    {
      key: "remark",
      label: t("table.columns.remark"),
      width: "50%",
      render: (value) => (
        <span className="block text-gray-800 font-medium line-clamp-2 break-words" title={String(value)}>
          {String(value)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.columns.status"),
      width: "10%",
      isStatus: true,
    },
    {
      key: "createdDate",
      label: t("table.columns.createdDate"),
      width: "15%",
      render: (value) => (
        <span className="text-gray-500 text-sm">
          {value ? formatDate(String(value)) : "-"}
        </span>
      ),
    },
  ];
}
