"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MasterTable } from "@/components/common/MasterTable";
import { ZoneItem } from "@/types/zoneMaster.types";
import { WardItem } from "@/types/wardMaster.types";
import { AddButton, SearchInput, StatusBadge, EditButton, DeleteButton } from "@/components/common";
import { useWardListHandlers } from "@/hooks/zoneMaster/useWardListHandlers";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface Props {
  wards: WardItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
  selectedZoneId: number | null;
  zones: ZoneItem[];
  onWardsChanged?: () => void;
  currentZone?: ZoneItem | undefined;
  wardCountForZone?: number;
}

export default function WardList({
  wards,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  searchTerm = "",
  selectedZoneId,
  onWardsChanged,
  currentZone,
  wardCountForZone,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("zoneMaster");
  const tCommon = useTranslations("common");

  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  const {
    localSearch,
    handleSearchChange,
    handleDelete,
    handleEdit,
    handlePageChange,
    handlePageSizeChange,
    columns,
  } = useWardListHandlers({
    selectedZoneId,
    searchTerm,
    onWardsChanged,
    pageNumber,
    pageSize,
    wardAlias,
    t: (key: string, values?: Record<string, unknown>) => t(key, values as never),
  });

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <MapIcon className="w-5 h-5 text-[#1A86E8]" />
          <h3 className="text-lg font-semibold text-[#1A86E8]">
            {t("wardList.title", { wards: wardsAlias })}
          </h3>

          <StatusBadge
            label={currentZone && currentZone.description
              ? `${currentZone.description} (${currentZone.zoneNo})`
              : t("wardList.selectZonePlaceholder", { zone: zoneAlias })}
            variant="info"
          />

          {currentZone && (
            <div className="flex items-center gap-1 ml-2">
              <span className="inline-flex items-center px-1.5 py-0.5 xl:px-2 xl:py-1 rounded-md text-[10px] lg:text-xs font-medium bg-green-50 text-green-700 border border-green-300">
                {t("zoneList.totalWards", {
                  count: wardCountForZone ?? currentZone.wardCount ?? totalCount,
                  wards: wardsAlias,
                })}
              </span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {selectedZoneId !== null && (
              <SearchInput
                className="w-64 mb-0"
                placeholder={t("wardList.searchPlaceholder", { ward: wardAlias })}
                value={localSearch}
                onChange={(value) => {
                  const sanitized = value.replace(TEXT_SANITIZE, '');
                  handleSearchChange(sanitized);
                }}
              />
            )}

            {/* ADD WARD BUTTON — UNCHANGED */}
            <AddButton
              size="sm"
              label={t("wardList.linkWard", { ward: wardAlias })}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (selectedZoneId !== null)
                  params.set("zoneId", String(selectedZoneId));
                params.set("linkWard", "");
                router.push(`${pathname}?${params.toString()}`);
              }}
              disabled={selectedZoneId === null}
            />

            {/* CREATE NEW WARD BUTTON — UNCHANGED */}
            <AddButton
              size="sm"
              label={t("wardList.createWard", { ward: wardAlias })}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (selectedZoneId !== null)
                  params.set("zoneId", String(selectedZoneId));
                params.set("createWard", "");
                router.push(`${pathname}?${params.toString()}`);
              }}
              disabled={false}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 px-4 pb-4">
        {selectedZoneId === null ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t("wardList.selectZonePrompt", { zone: zoneAlias, wards: wardsAlias })}
          </div>
        ) : (
          <MasterTable
            columns={columns}
            data={wards as unknown as Record<string, unknown>[]}
            emptyText={t("wardList.noWardsFound", { wards: wardsAlias })}
            height="md"
            paginationConfig={{ enabled: true, showPageSizeSelector: false }}

            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}

            renderActions={(row) => (
              <>
                <EditButton
                  size="xs"
                  aria-label={tCommon("table.actions.edit")}
                  onClick={() => handleEdit(row as unknown as WardItem)}
                />
                <DeleteButton
                  size="xs"
                  aria-label={tCommon("table.actions.delete")}
                  onClick={() => handleDelete(row as unknown as WardItem)}
                />
              </>
            )}
            actionLabel={tCommon("table.columns.actions")}

            onPageChange={handlePageChange}

            footerLeftContent={
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {tCommon("table.showing")}{" "}
                {totalCount === 0
                  ? 0
                  : (pageNumber - 1) * pageSize + 1}{" "}
                {tCommon("table.to")}

                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-blue-200 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  aria-label={tCommon("table.rowsPerPage")}
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                {tCommon("table.of")}{" "}

                <span>
                  {totalCount} {tCommon("table.entries")}
                </span>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}