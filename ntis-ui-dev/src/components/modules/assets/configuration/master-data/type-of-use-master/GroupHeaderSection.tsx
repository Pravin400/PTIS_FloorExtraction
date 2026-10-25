"use client";

import { LayoutGrid } from "lucide-react";
import { AddButton, DeleteButton, EditButton } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { TypeOfUseGroup } from "@/types/asset-masters/type-of-use.types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { getIconComponent, getIconKey } from "@/config/typeofuse-icons.config";

interface GroupHeaderSectionProps {
  groups: TypeOfUseGroup[];
  selectedGroupId: number | null;
  onGroupSelect: (groupId: number | null) => void;
  onAddGroup: () => void;
  onEditGroup: (group: TypeOfUseGroup) => void;
  onDeleteGroup: (group: TypeOfUseGroup) => void;
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function GroupHeaderSection({
  groups,
  selectedGroupId,
  onGroupSelect,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  tCommon,
}: GroupHeaderSectionProps) {
  const t = useTranslations("assetTypeOfUse");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col gap-3">
      {/* Header section with Title and Add Buttons */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="font-semibold text-slate-900 text-base">{t("group.typeOfUseGroups")}</div>
        <div className="flex items-center gap-2">
          <AddButton
            size="sm"
            label={t("group.add")}
            onClick={onAddGroup}
            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
          />
        </div>
      </div>

      {/* Cards list section scrollable */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        {/* All Groups Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onGroupSelect(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
              e.preventDefault();
              onGroupSelect(null);
            }
          }}
          className={cn(
            "min-w-[230px] cursor-pointer select-none rounded-xl border px-3 py-2 text-left shadow-xs transition",
            selectedGroupId === null
              ? "border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          )}
        >
          <div className="flex items-start gap-3 h-full">
            <div
              className={cn(
                "rounded-lg p-2",
                selectedGroupId === null
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Tooltip content={t("group.allGroups")} placement="bottom">
                  <span className="min-w-0 text-sm font-semibold text-slate-900 cursor-help truncate">
                    {t("group.allGroups")}
                  </span>
                </Tooltip>
              </div>

              <div className="mt-1 text-xs flex items-center gap-2">
                <span className="text-slate-600">
                  {t("group.groupsCount", { count: groups.length })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Group Cards */}
        {groups.map((g) => {
          const Icon = getIconComponent(getIconKey(g.groupIcon));
          const selected = g.id === selectedGroupId;

          return (
            <div
              key={g.id}
              role="button"
              tabIndex={0}
              onClick={() => onGroupSelect(g.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                  e.preventDefault();
                  onGroupSelect(g.id);
                }
              }}
              className={cn(
                "min-w-[230px] cursor-pointer select-none rounded-xl border px-3 py-2 text-left shadow-xs transition",
                selected
                  ? "border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <div className="flex items-start gap-3 h-full">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    selected
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Tooltip content={g.groupName} placement="bottom">
                      <span className="min-w-0 text-sm font-semibold text-slate-900 cursor-help truncate">
                        {g.groupName}
                      </span>
                    </Tooltip>

                    <div className="flex gap-2 shrink-0">
                      <EditButton
                        size="sm"
                        title={t("group.edit")}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(g);
                        }}
                      />
                      <DeleteButton
                        size="sm"
                        title={tCommon("table.actions.delete")}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(g);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-1 text-xs flex items-center justify-between gap-2">
                    <span className="text-slate-600 truncate">
                      {t("group.codeLabel", { code: g.typeOfUseGroupCode })}
                    </span>
                    <StatusBadge value={g.isActive ? "Active" : "Inactive"} className="shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="flex min-w-[230px] items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
            {t("noDataFound")}
          </div>
        )}
      </div>
    </div>
  );
}
