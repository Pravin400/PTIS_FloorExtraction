import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AddButton, DeleteButton, EditButton, SearchInput } from "@/components/common";
import { CardList } from "@/components/common/CardList";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tooltip } from "@/components/common/Tooltip";
import type { UseGroup, UseType, TranslatorFunction } from "@/types/typeOfUse.types";
import { clsx, getTypeApiId, getGroupApiId } from "./typeOfUseMasterUtils";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface TypeSectionProps {
  paginatedTypes: UseType[];
  typeSearch: string;
  selectedTypeId: string | null;
  selectedGroupId: string | number | null;
  allGroups: UseGroup[];
  typesTotalCount: number;
  typesTotalPages: number;
  typePageNumber: number;
  typePageSize: number;
  subPageSize: number;
  onTypeSearchChange: (value: string) => void;
  onTypeSelect: (groupId: string, typeId: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDeleteType: (type: UseType) => void;
  t: TranslatorFunction;
}

export function TypeSection({
  paginatedTypes,
  typeSearch,
  selectedTypeId,
  selectedGroupId,
  allGroups,
  typesTotalCount,
  typesTotalPages,
  typePageNumber,
  typePageSize,
  onTypeSearchChange,
  onTypeSelect,
  onPageChange,
  onPageSizeChange,
  onDeleteType,
  t,
}: TypeSectionProps) {
  const router = useRouter();
  const locale = useLocale();

  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  return (
    <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[400px] lg:h-[600px] flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3 rounded-t-2xl border-b border-slate-100 px-4 py-3 bg-white z-10 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-slate-900">{t('type.title', { typeOfUse: typeOfUseLabel })}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-1 sm:gap-4">
          <SearchInput
            className="mb-0 w-full sm:max-w-xs"
            value={typeSearch}
            onChange={onTypeSearchChange}
            placeholder={t('type.searchPlaceholder', { typeOfUse: typeOfUseLabel })}
          />
          <AddButton
            size="md"
            label={t('type.add', { typeOfUse: typeOfUseLabel })}
            onClick={() => {
              const group = allGroups.find(
                (g) => g.typeOfUseGroupId === selectedGroupId
              );
              const groupApiId = group ? getGroupApiId(group) : '';
              router.push(
                `/${locale}/property-tax/typeofusemaster/type/add?groupId=${groupApiId}`
              );
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <CardList
          data={paginatedTypes}
          pageNumber={typePageNumber}
          pageSize={typePageSize}
          totalCount={typesTotalCount}
          totalPages={typesTotalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20, 50]}
          emptyText={t('type.noTypes', { typeOfUse: typeOfUseLabel })}
          maxHeightClassName="max-h-[320px] sm:max-h-[350px] lg:max-h-[415px] overflow-y-auto"
          className="border-none rounded-none shadow-none"
          renderCard={(typeItem) => {
            const selected = getTypeApiId(typeItem) === selectedTypeId;
            return (
              <div key={typeItem.typeOfUseId} className="w-full px-2 mb-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onTypeSelect(String(typeItem.typeOfUseGroupId), getTypeApiId(typeItem));
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).click();
                    }
                  }}
                  className={clsx(
                    "cursor-pointer select-none rounded-xl border px-4 py-3 text-left shadow-sm transition",
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    {/* LEFT: Code + Description */}
                    <div className="flex items-center gap-2 min-w-0 shrink">
                      <span className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white whitespace-nowrap">
                        {typeItem.typeOfUseCode}
                      </span>
                      <Tooltip content={typeItem.description} placement="bottom">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {typeItem.description}
                        </span>
                      </Tooltip>
                    </div>

                    {/* RIGHT: Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-300 text-xs whitespace-nowrap">
                        {t("seq")}: <b>{typeItem.searchSequence ?? "—"}</b>
                      </span>

                      <StatusBadge value={typeItem.status ?? "Active"} />

                      <EditButton
                        size="sm"
                        title={t('buttons.edit')}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/${locale}/property-tax/typeofusemaster/type/edit/${typeItem.typeOfUseId}`
                          );
                        }}
                      />
                      <DeleteButton
                        size="sm"
                        title={t('buttons.delete')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteType(typeItem);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
