import { Checkbox, DeleteLabelButton, Input, Select } from "@/components/common";
import type { Column } from "@/components/common";
import { calcBulkPropertyCurrent } from "@/lib/utils/section129a";
import type { BulkPropertyRow, PolicyMode, YesNo } from "@/types/extended-area-assessment.types";

export type BulkTableRow = BulkPropertyRow & Record<string, unknown>;

type Translator = (key: string) => string;

const money = (n: number): string => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const YES_NO_OPTIONS = (t: Translator) => [
  { label: t("options.yes"), value: "yes" },
  { label: t("options.no"), value: "no" },
];

const inputClass = "h-8 min-w-[100px] px-2 py-1 text-xs";

export interface GetBulkAssessmentColumnsParams {
  t: Translator;
  onToggle: (id: number) => void;
  onUpdate: <K extends keyof BulkPropertyRow>(id: number, key: K, value: BulkPropertyRow[K]) => void;
  onRemove: (id: number) => void;
}

/** Every cell here is directly editable — the bulk table has no separate
 *  "edit mode"; changes apply immediately to the row, matching the
 *  reference bulk calculator's inline-grid behavior. */
export function getBulkAssessmentColumns({
  t,
  onToggle,
  onUpdate,
  onRemove,
}: GetBulkAssessmentColumnsParams): Column<BulkTableRow>[] {
  const yesNo = YES_NO_OPTIONS(t);

  return [
    {
      key: "selected",
      label: t("columns.select"),
      width: "50px",
      align: "center",
      render: (_v, row) => (
        <Checkbox
          checked={row.selected}
          onCheckedChange={() => onToggle(row.id)}
          className={row.selected ? "border-slate-800 bg-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""}
        />
      ),
    },
    {
      key: "upic",
      label: t("columns.upic"),
      width: "130px",
      render: (_v, row) => (
        <Input className={inputClass} value={row.upic} onChange={(e) => onUpdate(row.id, "upic", e.target.value)} />
      ),
    },
    {
      key: "oldGpNo",
      label: t("columns.oldGpNo"),
      width: "110px",
      render: (_v, row) => (
        <Input className={inputClass} value={row.oldGpNo} onChange={(e) => onUpdate(row.id, "oldGpNo", e.target.value)} />
      ),
    },
    {
      key: "owner",
      label: t("columns.owner"),
      width: "150px",
      render: (_v, row) => (
        <Input className={inputClass} value={row.owner} onChange={(e) => onUpdate(row.id, "owner", e.target.value)} />
      ),
    },
    {
      key: "inclusionDate",
      label: t("columns.inclusionDate"),
      width: "140px",
      render: (_v, row) => (
        <Input
          type="date"
          className={inputClass}
          value={row.inclusionDate}
          onChange={(e) => onUpdate(row.id, "inclusionDate", e.target.value)}
        />
      ),
    },
    {
      key: "assessmentDate",
      label: t("columns.assessmentDate"),
      width: "140px",
      render: (_v, row) => (
        <Input
          type="date"
          className={inputClass}
          value={row.assessmentDate}
          onChange={(e) => onUpdate(row.id, "assessmentDate", e.target.value)}
        />
      ),
    },
    {
      key: "oldTax",
      label: t("columns.oldTax"),
      width: "110px",
      render: (_v, row) => (
        <Input
          type="number"
          className={inputClass}
          value={row.oldTax}
          onChange={(e) => onUpdate(row.id, "oldTax", Number(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "fullTax",
      label: t("columns.fullTax"),
      width: "120px",
      render: (_v, row) => (
        <Input
          type="number"
          className={inputClass}
          value={row.fullTax}
          onChange={(e) => onUpdate(row.id, "fullTax", Number(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "policyMode",
      label: t("columns.policyMode"),
      width: "130px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={[
            { label: t("policyMode.conditional"), value: "conditional" },
            { label: t("policyMode.unconditional"), value: "unconditional" },
          ]}
          value={row.policyMode}
          onChange={(_e, v) => onUpdate(row.id, "policyMode", v as PolicyMode)}
        />
      ),
    },
    {
      key: "oldArea",
      label: t("columns.oldArea"),
      width: "100px",
      render: (_v, row) => (
        <Input
          type="number"
          className={inputClass}
          value={row.oldArea}
          onChange={(e) => onUpdate(row.id, "oldArea", Number(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "newArea",
      label: t("columns.newArea"),
      width: "100px",
      render: (_v, row) => (
        <Input
          type="number"
          className={inputClass}
          value={row.newArea}
          onChange={(e) => onUpdate(row.id, "newArea", Number(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "areaThreshold",
      label: t("columns.areaThreshold"),
      width: "100px",
      render: (_v, row) => (
        <Input
          type="number"
          className={inputClass}
          value={row.areaThreshold}
          onChange={(e) => onUpdate(row.id, "areaThreshold", Number(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "areaRuleEnabled",
      label: t("columns.areaRuleEnabled"),
      width: "110px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={yesNo}
          value={row.areaRuleEnabled}
          onChange={(_e, v) => onUpdate(row.id, "areaRuleEnabled", v as YesNo)}
        />
      ),
    },
    {
      key: "useChanged",
      label: t("columns.useChanged"),
      width: "110px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={yesNo}
          value={row.useChanged}
          onChange={(_e, v) => onUpdate(row.id, "useChanged", v as YesNo)}
        />
      ),
    },
    {
      key: "otherChanged",
      label: t("columns.otherChanged"),
      width: "110px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={yesNo}
          value={row.otherChanged}
          onChange={(_e, v) => onUpdate(row.id, "otherChanged", v as YesNo)}
        />
      ),
    },
    {
      key: "useDisqualify",
      label: t("columns.useDisqualify"),
      width: "110px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={yesNo}
          value={row.useDisqualify}
          onChange={(_e, v) => onUpdate(row.id, "useDisqualify", v as YesNo)}
        />
      ),
    },
    {
      key: "otherDisqualify",
      label: t("columns.otherDisqualify"),
      width: "110px",
      render: (_v, row) => (
        <Select
          selectSize="sm"
          options={yesNo}
          value={row.otherDisqualify}
          onChange={(_e, v) => onUpdate(row.id, "otherDisqualify", v as YesNo)}
        />
      ),
    },
    {
      key: "changeDate",
      label: t("columns.changeDate"),
      width: "140px",
      render: (_v, row) => (
        <Input
          type="date"
          className={inputClass}
          value={row.changeDate}
          onChange={(e) => onUpdate(row.id, "changeDate", e.target.value)}
        />
      ),
    },
    {
      key: "_currentFy" as keyof BulkTableRow,
      label: t("columns.currentFy"),
      width: "90px",
      align: "center",
      render: (_v, row) => calcBulkPropertyCurrent(row).fy,
    },
    {
      key: "_stage" as keyof BulkTableRow,
      label: t("columns.stage"),
      width: "150px",
      render: (_v, row) => calcBulkPropertyCurrent(row).stage,
    },
    {
      key: "_applicableTax" as keyof BulkTableRow,
      label: t("columns.applicableTax"),
      width: "120px",
      align: "right",
      cellClassName: "font-bold",
      render: (_v, row) => money(calcBulkPropertyCurrent(row).tax),
    },
    {
      key: "_action" as keyof BulkTableRow,
      label: t("columns.action"),
      width: "100px",
      align: "center",
      render: (_v, row) => <DeleteLabelButton label={t("actions.remove")} size="sm" onClick={() => onRemove(row.id)} />,
    },
  ];
}
