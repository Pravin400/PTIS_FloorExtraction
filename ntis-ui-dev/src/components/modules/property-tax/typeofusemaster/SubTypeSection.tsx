import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Layers3, AlertCircle } from "lucide-react";
import { AddButton, DeleteButton, EditButton, SearchInput } from "@/components/common";
import { MasterTable, type Column } from "@/components/common/MasterTable";
import type { UseSubType, UseType, TranslatorFunction } from "@/types/typeOfUse.types";
import type { SubTypeTableRow } from "./TypeOfUseMasterColumns";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface SubTypeSectionProps {
  selectedType: UseType | undefined | null;
  selectedTypeId: string | null;
  subTypeSearch: string;
  searchActive: boolean;
  subLoading: boolean;
  loadingAll: boolean;
  subPageSize: number;
  effectivePageNumber: number;
  effectiveTotalCount: number;
  effectiveTotalPages: number;
  subTypeTableRows: SubTypeTableRow[];
  subTotalCount: number;
  subTypeColumns: Column<SubTypeTableRow>[];
  onSearchChange: (value: string) => void;
  changeSubPage: (page: number) => void;
  changeSubPageSize: (size: number) => void;
  onDeleteSubType: (subType: UseSubType) => void;
  t: TranslatorFunction;
  allTypes: UseType[];
  onTypeSelect: (groupId: string, typeId: string) => void;
}

export function SubTypeSection({
  selectedType,
  selectedTypeId,
  subTypeSearch,
  searchActive,
  subLoading,
  loadingAll,
  subPageSize,
  effectivePageNumber,
  effectiveTotalCount,
  effectiveTotalPages,
  subTypeTableRows,
  subTotalCount,
  subTypeColumns,
  onSearchChange,
  changeSubPage,
  changeSubPageSize,
  onDeleteSubType,
  t,
  allTypes,
  onTypeSelect,
}: SubTypeSectionProps) {
  const router = useRouter();
  const locale = useLocale();

  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  return (
    <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[600px] flex flex-col">
      <div className="flex gap-3 rounded-t-2xl border-b border-slate-100 px-4 py-3 sticky top-0 bg-white justify-between z-10 flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Top row: Title + badge */}
        <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-2">
          {t('subtype.title', { subTypeOfUse: subTypeOfUseLabel })}
          {selectedType && (
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-200">
              {selectedType.typeOfUseCode}
            </span>
          )}
          {selectedType && (
            <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-300">
              <Layers3 className="h-4 w-4" />
              <span>
                {subTotalCount} {t("subtype.title", { subTypeOfUse: subTypeOfUseLabel })}
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: Search + Add button — wraps on small screens */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={subTypeSearch}
            onChange={onSearchChange}
            placeholder={t('subtype.searchPlaceholder', { subTypeOfUse: subTypeOfUseLabel })}
            className="mb-0 flex-1 min-w-[180px] text-gray-700"
          />
          <AddButton
            size="md"
            label={t('subtype.add', { subTypeOfUse: subTypeOfUseLabel })}
            disabled={!selectedTypeId}
            onClick={() =>
              router.push(
                `/${locale}/property-tax/typeofusemaster/subtype/add?typeId=${selectedTypeId}`
              )
            }
          />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {searchActive && (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {loadingAll ? (
                <span>{t('subtype.searching')}</span>
              ) : (
                <span>{t('subtype.found', { count: subTotalCount })}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-blue-600 hover:underline font-medium"
            >
              {t('subtype.clear')}
            </button>
          </div>
        )}

        <div className="mt-0">
          {!selectedTypeId ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {t('type.selectTypeFirst')}
            </div>
          ) : (
            <MasterTable
              columns={subTypeColumns}
              data={subTypeTableRows}
              loading={loadingAll || subLoading}
              pageNumber={effectivePageNumber}
              pageSize={subPageSize}
              height="sm"
              totalCount={effectiveTotalCount}
              totalPages={effectiveTotalPages}
              onPageChange={changeSubPage}
              onPageSizeChange={changeSubPageSize}
              getRowKey={(row) => row.subTypeOfUseId ?? row.srNo}
              paginationConfig={{
                enabled: true,
                showPageSizeSelector: true,
              }}
              onRowClick={(row) => {
                const subType = row as UseSubType;
                const typeItem = allTypes.find((t) => t.typeOfUseId === subType.typeOfUseId);
                if (typeItem) {
                  onTypeSelect(String(typeItem.typeOfUseGroupId), String(typeItem.typeOfUseId));
                }
              }}
              renderActions={(row) => (
                <div className="flex items-center gap-2">
                  <EditButton
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/${locale}/property-tax/typeofusemaster/subtype/edit/${row.subTypeOfUseId}`
                      );
                    }}
                  />
                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubType(row as UseSubType);
                    }}
                  />
                </div>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
