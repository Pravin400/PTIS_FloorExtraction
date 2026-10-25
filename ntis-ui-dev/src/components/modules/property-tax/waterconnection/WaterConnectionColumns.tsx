import type { Column } from "@/components/common/MasterTable";
import type { WaterConnection } from "@/types/water-connection.types";
import { cn } from "@/lib/utils/cn";
import { DateUtils } from "@/lib/utils/date-helpers";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getWaterConnectionColumns(
  t: (key: string) => string
): Column<WaterConnection>[] {
  return [
    {
      key: "connectionNo",
      label: t("list.table.connectionNo"),
      width: "14%",
      render: (value, row) => {
        const dateStr = row.installDate ?? row.connectionStartDate;
        const formattedDate = DateUtils.formatToDDMMYYYY(dateStr);
        return (
          <div>
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 font-mono border border-blue-300 rounded-md">
              {String(value)}
            </span>
            {formattedDate && (
              <div className="text-xs text-gray-400 mt-0.5">
                {t("list.table.installedOn")}:{" "}
                {formattedDate}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "type",
      label: t("list.table.type"),
      width: "10%",
      render: (value) => (
        <span
          className={cn(
            "inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border",
            value === "Domestic"
              ? "border-blue-200 text-blue-600 bg-white"
              : "border-purple-200 text-purple-600 bg-white"
          )}
        >
          {String(value)}
        </span>
      ),
    },
    {
      key: "tapSize",
      label: t("list.table.tapSize"),
      width: "10%",
      render: (value) => (
        <span className="font-medium text-gray-700">{String(value)}</span>
      ),
    },
    {
      key: "applicableRate",
      label: t("list.table.applicableRate"),
      width: "12%",
      render: (value, row) => {
        const category = row.category?.toLowerCase();
        const frequencyLabel =
          category === "monthly"
            ? t("list.table.perMonth")
            : category === "quarterly"
            ? t("list.table.perQuarter")
            : t("list.table.perYear");

        return (
          <div>
            <span className="text-blue-600 font-semibold">{formatINR(value != null ? Number(value) : 0)}</span>
            <div className="text-xs text-gray-400">{frequencyLabel}</div>
          </div>
        );
      },
    },
    {
      key: "applicableCharges",
      label: t("list.table.applicableCharges"),
      width: "13%",
      render: (value) => (
        <span className="text-blue-600 font-semibold">
          {formatINR(Number(value))}
        </span>
      ),
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "14%",
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit",
              value
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                value ? "bg-green-500" : "bg-red-500"
              )}
            />
            {value ? t("list.status.active") : t("list.status.inactive")}
          </span>
          {Boolean(value) && row.activatedDate && (
            <span className="text-xs text-orange-500">
              {t("list.status.activated")}: {String(row.activatedDate)}
            </span>
          )}
          {!value && row.stoppedDate && (
            <span className="text-xs text-orange-500">
              {t("list.status.stoppedOn")}: {String(row.stoppedDate)}
            </span>
          )}
        </div>
      ),
    },
  ];
}
