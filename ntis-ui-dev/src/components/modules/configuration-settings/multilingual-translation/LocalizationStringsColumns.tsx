import { Column, Input } from "@/components/common";
import type {
  MultilingualTranslation,
  SupportedLanguageCode,
} from "@/types/multilingual-translation.types";
import { TRANSLATION_TEXT_SANITIZE } from "@/lib/utils/validation-rules";

type EditableField = "hi_IN" | "mr_IN";

interface ColumnsArgs {
  t: (key: string) => string;
  languages: SupportedLanguageCode[];
  edits: Record<number, Partial<Record<EditableField, string>>>;
  onCellChange: (id: number, field: EditableField, value: string) => void;
}

function isLanguageActive(
  languages: SupportedLanguageCode[],
  code: SupportedLanguageCode
): boolean {
  return languages.length === 0 || languages.includes(code);
}

function getEditedValue(
  edits: ColumnsArgs["edits"],
  row: MultilingualTranslation,
  field: EditableField
): string {
  const draft = edits[row.id]?.[field];
  if (typeof draft === "string") return draft;
  return String(row[field] ?? "");
}

export function getLocalizationStringsColumns({
  t,
  languages,
  edits,
  onCellChange,
}: ColumnsArgs): Column<MultilingualTranslation>[] {
  const columns: Column<MultilingualTranslation>[] = [
    {
      key: "resource",
      label: t("table.resource"),
      width: "15%",
      render: (value) => (
        <span className="font-mono text-sm text-slate-700">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "key",
      label: t("table.key"),
      width: "20%",
      render: (value) => (
        <span className="font-medium text-blue-600">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "en_US",
      label: t("table.en_US"),
      width: "25%",
      render: (value) => (
        <span className="text-slate-800">{typeof value === "string" ? value : ""}</span>
      ),
    },
  ];

  if (isLanguageActive(languages, "hi")) {
    columns.push({
      key: "hi_IN",
      label: t("table.hi_IN"),
      width: "20%",
      render: (_value, row) => {
        const editableValue = getEditedValue(edits, row, "hi_IN");
        return (
          <Input
            value={editableValue}
            placeholder={t("table.needsTranslation")}
            aria-label={`${t("table.hi_IN")} ${row.key}`}
            onChange={(e) => {
              const sanitized = e.target.value.replace(TRANSLATION_TEXT_SANITIZE, "");
              onCellChange(row.id, "hi_IN", sanitized);
            }}
            className="w-full"
            fullWidth
          />
        );
      },
    });
  }

  if (isLanguageActive(languages, "mr")) {
    columns.push({
      key: "mr_IN",
      label: t("table.mr_IN"),
      width: "20%",
      render: (_value, row) => {
        const editableValue = getEditedValue(edits, row, "mr_IN");
        return (
          <Input
            value={editableValue}
            placeholder={t("table.needsTranslation")}
            aria-label={`${t("table.mr_IN")} ${row.key}`}
            onChange={(e) => {
              const sanitized = e.target.value.replace(TRANSLATION_TEXT_SANITIZE, "");
              onCellChange(row.id, "mr_IN", sanitized);
            }}
            className="w-full"
            fullWidth
          />
        );
      },
    });
  }

  return columns;
}
