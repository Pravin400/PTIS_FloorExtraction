"use client";

import React, { useMemo } from "react";
import { ListFilter, Tag, Hash, FileText, CheckCircle2 } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton } from "@/components/common";
import { TruncatedText } from "@/components/common/TruncatedText";
import { AssetFieldDefinition } from "@/types/asset-masters/asset-field-definition.types";

export function parseOptionsList(optionsJson?: string | null): string[] {
  if (!optionsJson || !optionsJson.trim()) return [];
  const trimmed = optionsJson.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (typeof item === "object" && item !== null) {
            return String(item.value ?? item.label ?? JSON.stringify(item)).trim();
          }
          return String(item).trim();
        })
        .filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated string parsing
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface FieldOptionsDrawerProps {
  open: boolean;
  onClose: () => void;
  fieldDefinition: AssetFieldDefinition | null;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function FieldOptionsDrawer({
  open,
  onClose,
  fieldDefinition,
  t,
  tCommon,
}: FieldOptionsDrawerProps): React.ReactElement | null {
  const optionsList = useMemo(
    () => parseOptionsList(fieldDefinition?.optionsJson),
    [fieldDefinition?.optionsJson]
  );

  if (!fieldDefinition) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#EFF5FF] border border-[#DBEAFE] rounded-xl text-[#2563EB]">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {t("optionsDrawer.title")}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full justify-end">
          <CancelButton
            label={tCommon("buttons.close") || tCommon("buttons.cancel") || "Close"}
            onClick={onClose}
          />
        </div>
      }
    >
      <div className="space-y-4 bg-[#F8FAFF] p-5 flex flex-col h-full min-h-0">
        {/* Field Detail Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 shrink-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("form.sections.generalConfig") || "Field Overview"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                <span>{t("list.table.fieldCode") || "Field Code"}</span>
              </div>
              <div className="font-semibold text-slate-800 font-mono text-sm break-all">
                <TruncatedText text={fieldDefinition.fieldCode} maxLength={25} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t("list.table.fieldName") || "Field Name"}</span>
              </div>
              <div className="font-semibold text-slate-800 text-sm truncate">
                <TruncatedText text={fieldDefinition.fieldName} maxLength={25} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 col-span-2 md:col-span-1 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t("list.table.fieldType") || "Field Type"}</span>
              </div>
              <div className="font-semibold text-slate-800 capitalize text-sm">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {fieldDefinition.fieldType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Options Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-100/70 border-b border-slate-200 shrink-0">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{t("optionsDrawer.totalOptions") || "Total Options"}</span>
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {optionsList.length}
              </span>
            </div>
          </div>

          {optionsList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              {t("optionsDrawer.noOptions") || "No options available for this field"}
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 min-h-0 max-h-[600px] xl:max-h-[650px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 shadow-2xs z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-center w-20 border-r border-slate-200">
                      {t("optionsDrawer.seqNo") || "Seq No."}
                    </th>
                    <th className="px-4 py-2.5">
                      {t("optionsDrawer.optionValue") || "Option Value"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {optionsList.map((opt, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/40 transition-colors duration-150"
                    >
                      <td className="px-4 py-2.5 text-center font-bold text-slate-500 bg-slate-50/50 border-r border-slate-100">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 break-all">
                        <TruncatedText text={opt} maxLength={50} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
