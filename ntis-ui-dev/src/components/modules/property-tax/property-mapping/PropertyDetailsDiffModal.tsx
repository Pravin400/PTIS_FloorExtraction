import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { Drawer, MasterTable, Button } from "@/components/common";
import type { Column } from "@/components/common/MasterTable";
import { NewProperty, OldPropertyCandidate } from "@/types/property-mapping";
import { formatArea } from "./mappingUtils";
import { evaluatePropertyParameterMatch } from "@/lib/utils/propertyComparison.utils";

interface CompareRow {
  label: string;
  baseVal: string;
  candVal: string;
  isMatch: boolean;
  [key: string]: unknown;
}

interface DiffModalProps {
  candidate: OldPropertyCandidate | null;
  currentNewProperty: NewProperty | undefined;
  onClose: () => void;
  money: (val: number) => string;
  rvLabel?: string;
}

export function DiffModal({
  candidate,
  currentNewProperty,
  onClose,
  money,
  rvLabel,
}: DiffModalProps) {
  const t = useTranslations("propertyMapping");
  if (!candidate || !currentNewProperty) return null;

  const areaUnit = t("diffModal.areaUnit");
  const naValue = t("diffModal.naValue");
  const MATCH_THRESHOLD = 80;

  const compareFields: (CompareRow & { matchPercentage?: number })[] = [
    {
      label: t("diffModal.fields.ownerName"),
      baseVal: currentNewProperty.owner,
      candVal: candidate.owner,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.owner, candidate.owner, 'text', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.builtUpArea"),
      baseVal: `${formatArea(currentNewProperty.builtUpArea)} ${areaUnit}`,
      candVal: `${formatArea(candidate.area)} ${areaUnit}`,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.builtUpArea, candidate.area, 'numeric', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.carpetArea"),
      baseVal: `${formatArea(currentNewProperty.carpetArea || 0)} ${areaUnit}`,
      candVal: `${formatArea(candidate.carpetArea || 0)} ${areaUnit}`,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.carpetArea || 0, candidate.carpetArea || 0, 'numeric', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.floors"),
      baseVal: currentNewProperty.floors,
      candVal: candidate.floors,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.floors, candidate.floors, 'text', MATCH_THRESHOLD).isMatch,
    },
    {
      label: rvLabel || t("diffModal.fields.rateableValue"),
      baseVal: currentNewProperty.rv ? money(currentNewProperty.rv) : "",
      candVal: candidate.rv ? money(candidate.rv) : "",
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.rv || 0, candidate.rv || 0, 'numeric', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.annualTax"),
      baseVal: money(currentNewProperty.tax),
      candVal: money(candidate.tax),
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.tax, candidate.tax, 'numeric', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.ctsSurvey"),
      baseVal: currentNewProperty.cts,
      candVal: candidate.cts || "",
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.cts, candidate.cts, 'exact', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.useCategory"),
      baseVal: currentNewProperty.use || "",
      candVal: candidate.use || "",
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.use, candidate.use, 'category', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.zoneWard"),
      baseVal: [currentNewProperty.zone, currentNewProperty.ward].filter(Boolean).join(" / "),
      candVal: [candidate.zone, candidate.ward].filter(Boolean).join(" / "),
      isMatch: evaluatePropertyParameterMatch(
        [currentNewProperty.zone, currentNewProperty.ward].filter(Boolean).join(" / "),
        [candidate.zone, candidate.ward].filter(Boolean).join(" / "),
        'exact',
        MATCH_THRESHOLD
      ).isMatch,
    },
    {
      label: t("diffModal.fields.plotNumber"),
      baseVal: currentNewProperty.plotNo || "",
      candVal: candidate.plotNo || "",
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.plotNo, candidate.plotNo, 'exact', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.constructionYear"),
      baseVal: currentNewProperty.constructionYear || "",
      candVal: candidate.constructionYear || "",
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.constructionYear, candidate.constructionYear, 'exact', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.mobileNumber"),
      baseVal: String(currentNewProperty.mobile || ""),
      candVal: candidate.mobile ? String(candidate.mobile) : naValue,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.mobile, candidate.mobile as string | number | undefined, 'exact', MATCH_THRESHOLD).isMatch,
    },
    {
      label: t("diffModal.fields.address"),
      baseVal: currentNewProperty.address,
      candVal: candidate.address,
      isMatch: evaluatePropertyParameterMatch(currentNewProperty.address, candidate.address, 'text', MATCH_THRESHOLD).isMatch,
    }
  ];

  const columns: Column<CompareRow & { variancePct?: number }>[] = [
    {
      key: "label",
      label: t("diffModal.columns.parameters"),
      width: "160px",
      cellClassName: "py-2 px-3 font-extrabold text-xs text-slate-800",
      headerClassName: "whitespace-nowrap",
      render: (val) => String(val),
    },
    {
      key: "baseVal",
      label: t("diffModal.columns.newPropertyRecord"),
      align: "center",
      cellClassName: "py-2 px-3 font-extrabold text-xs text-slate-900",
      headerClassName: "whitespace-nowrap",
      render: (val) => String(val),
    },
    {
      key: "candVal",
      label: t("diffModal.columns.oldPropertyRecord"),
      align: "center",
      cellClassName: "py-2 px-3 font-extrabold text-xs text-slate-900",
      headerClassName: "whitespace-nowrap",
      render: (val) => String(val),
    },
    {
      key: "isMatch",
      label: t("diffModal.columns.status"),
      align: "center",
      width: "140px",
      headerClassName: "whitespace-nowrap",
      render: (_, row) => {
        const cleanBase = String(row.baseVal || "").trim().toLowerCase();
        const cleanCand = String(row.candVal || "").trim().toLowerCase();

        const isEmptyValue = (val: string) => {
          return val === "" || val === "-" || val === naValue.toLowerCase() || val === "0 sq. ft." || val === "₹0";
        };

        const isEmpty = isEmptyValue(cleanBase) && isEmptyValue(cleanCand);

        if (isEmpty) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
              {t("diffModal.matchStatus.noData")}
            </span>
          );
        }

        return row.isMatch ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            {t("diffModal.matchStatus.matched")}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            {t("diffModal.matchStatus.unmatch")}
          </span>
        );
      }
    }
  ];

  return (
    <Drawer
      open={!!candidate}
      onClose={onClose}
      width="lg"
      bodyClassName="min-h-0"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-xs">
            <Scale size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">{t("diffModal.title")}</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {t("diffModal.subtitle")}
            </p>
          </div>
        </div>
      }
      footer={
        <Button
          variant="primary"
          size="sm"
          onClick={onClose}
          className="rounded-xl font-extrabold shadow-sm transition-all duration-150 hover:scale-105 animate-fade-in"
        >
          {t("diffModal.closeButton")}
        </Button>
      }
    >
      <div className="p-5">
        <MasterTable
          columns={columns}
          data={compareFields}
          getRowKey={(row) => row.label}
          paginationConfig={{ enabled: false }}
          rowClassName={(row) => {
            return row.isMatch
              ? "bg-emerald-50/10 hover:bg-emerald-50/20 transition-all duration-150 border-b border-slate-100"
              : "bg-rose-50/20 hover:bg-rose-50/40 transition-all duration-150 border-b border-slate-100";
          }}
          tableClassName="w-full"
        />
      </div>
    </Drawer>
  );
}
