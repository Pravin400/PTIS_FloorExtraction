import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { AddButton, DeleteButton, EditButton } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { UseGroup, UseType, TranslatorFunction } from "@/types/typeOfUse.types";
import {
  clsx,
  getIconKey,
  getIconComponent,
  getGroupApiId,
  getTypeApiId,
} from "./typeOfUseMasterUtils";

import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface GroupSectionProps {
  groups: UseGroup[];
  allTypes: UseType[];
  selectedGroupId: string | number | null;
  subPageSize: number;
  onGroupSelect: (groupId: string, firstTypeId: string) => void;
  onDeleteGroup: (group: UseGroup) => void;
  t: TranslatorFunction;
}

function GroupNameLabel({ name }: { name: string }) {
  return (
    <Tooltip content={name} placement="bottom">
      <span className="min-w-0 text-sm font-semibold text-slate-900 cursor-help truncate">
        {name}
      </span>
    </Tooltip>
  );
}

export function GroupSection({
  groups,
  allTypes,
  selectedGroupId,
  onGroupSelect,
  onDeleteGroup,
  t,
}: GroupSectionProps) {
  const router = useRouter();
  const locale = useLocale();

  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      {/* Header section with Title and Add Buttons */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="font-semibold text-slate-900 text-base">{t('group.title', { use: useLabel })}</div>
        <div className="flex items-center gap-2">
          <AddButton
            size="sm"
            label={t('group.add', { use: useLabel })}
            onClick={() =>
              router.push(`/${locale}/property-tax/typeofusemaster/group/add`)
            }
          />
          <AddButton
            size="sm"
            label={t('category.add', { category: categoryLabel }) || "Add Category"}
            onClick={() =>
              router.push(`/${locale}/property-tax/typeofusemaster/category`)
            }
          />
        </div>
      </div>

      {/* Cards list section scrollable */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        {groups.map((g: UseGroup) => {
          const isTotalGroup = g.typeOfUseGroupCode === "TOTAL" || g.typeOfUseGroupId === 0;
          const Icon = isTotalGroup
            ? LayoutGrid
            : getIconComponent(getIconKey(g.groupIcon, g.groupName || g.typeOfUseGroupCode));
          const selected = isTotalGroup
            ? (selectedGroupId === "ALL" || selectedGroupId === 0 || selectedGroupId === "0")
            : String(g.typeOfUseGroupId) === String(selectedGroupId);
          const groupApiId = isTotalGroup ? "ALL" : getGroupApiId(g);

          return (
            <div
              key={g.typeOfUseGroupId}
              role="button"
              tabIndex={0}
              onClick={() => {
                const firstType = allTypes.find(
                  (t) => String(t.typeOfUseGroupId) === groupApiId
                );
                const firstTypeId = firstType ? getTypeApiId(firstType) : "";
                onGroupSelect(groupApiId, firstTypeId);
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              className={clsx(
                "min-w-[230px] cursor-pointer select-none rounded-xl border px-3 py-2 text-left shadow-sm transition",
                selected
                  ? "border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <div className="flex items-start gap-3 h-full">
                <div
                  className={clsx(
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
                    <GroupNameLabel name={g.groupName} />

                    {!isTotalGroup && (
                      <div className="flex gap-2 shrink-0">
                        <EditButton
                          size="sm"
                          title={t('buttons.edit') + ' ' + t('group.title', { use: useLabel })}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/${locale}/property-tax/typeofusemaster/group/edit/${encodeURIComponent(
                                g.typeOfUseGroupId
                              )}`
                            );
                          }}
                        />
                        <DeleteButton
                          size="sm"
                          title={t('buttons.delete') + ' ' + t('group.title', { use: useLabel })}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGroup(g);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-1 text-xs flex items-center gap-2">
                    <span className="text-slate-600">
                      {g.countOfTypes ?? 0} {t('type.title', { typeOfUse: typeOfUseLabel })}
                    </span>
                    <StatusBadge value={g.status ?? "Active"} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
