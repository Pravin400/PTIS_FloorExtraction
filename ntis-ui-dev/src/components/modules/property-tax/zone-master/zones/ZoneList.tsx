"use client";

import { useState, useEffect, useRef } from "react";
import { Layers, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ZoneItem } from "@/types/zoneMaster.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  AddButton,
  EditButton,
  DeleteButton,
  Card,
  SearchInput,
} from "@/components/common";
import { CardList } from "@/components/common/CardList";
import { useZoneListHandlers } from "@/hooks/zoneMaster/useZoneListHandlers";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";

interface Props {
  zones: ZoneItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
  selectedZoneId: number | null;
  onZoneSelect: (id: number) => void;
  newlyCreatedZoneNo?: string | null;
}

export default function ZoneList({
  zones,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  searchTerm = "",
  selectedZoneId,
  onZoneSelect,
  newlyCreatedZoneNo,
}: Props) {
  const t = useTranslations("zoneMaster");
  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const zonesAlias = useAliasLabel("Zones", t("defaults.zones"));
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const prevSearchTermRef = useRef(searchTerm);

  const {
    handleDeleteClick,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
  } = useZoneListHandlers({
    zones,
    zoneAlias,
    wardsAlias,
    t: (key: string, values?: Record<string, unknown>) => t(key, values as never),
  });

  // Sync search state when searchTerm changes from URL (non-cascading)
  useEffect(() => {
    if (prevSearchTermRef.current !== searchTerm) {
      prevSearchTermRef.current = searchTerm;
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchChange(localSearch, searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, handleSearchChange]);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-5 h-5 text-[#1A86E8]" />
        <h3 className="text-lg font-semibold text-[#1A86E8]">
          {t("zoneList.title", { zones: zonesAlias })}
        </h3>

        <div className="ml-auto flex items-center gap-3">
          <SearchInput
            className="w-64 mb-0"
            placeholder={t("zoneList.searchPlaceholder", { zone: zoneAlias })}
            value={localSearch}
            onChange={(value) => {
              const sanitized = value.replace(TEXT_SANITIZE, '');
              setLocalSearch(sanitized);
            }}
          />

          <AddButton
            size="sm"
            label={t("zoneList.addZone", { zone: zoneAlias })}
            onClick={() => {
              const params = new URLSearchParams(
                searchParams.toString()
              );
              params.set("addZone", "");
              router.push(
                `${pathname}?${params.toString()}`
              );
            }}
            disabled={false}
          />
        </div>
      </div>

      <CardList<ZoneItem>
        data={zones}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        emptyText={
          searchTerm
            ? t("zoneList.notFound", { zones: zonesAlias })
            : t("zoneList.notAvailable", { zones: zonesAlias })
        }
        emptyIcon={
          <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        }
        renderCard={(zone) => {
          const isSelected =
            selectedZoneId === zone.id;
          const isNewlyCreated =
            newlyCreatedZoneNo === zone.zoneNo;

          const zoneId = zone.id;
          const zoneNo = zone.zoneNo;
          const description = zone.description || "";
          const descriptionEnglish = zone.descriptionEnglish || "";
          const isActive = zone.isActive;

          return (
            <div
              key={zone.id}
              className="w-full px-2 mb-1"
            >
              <Card
                padding="sm"
                role="button"
                aria-pressed={isSelected}
                tabIndex={0}
                onClick={() =>
                  zoneId !== undefined &&
                  onZoneSelect(zoneId)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (zoneId !== undefined) {
                      onZoneSelect(zoneId);
                    }
                  }
                }}
                className={`relative p-1 rounded-xl cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A86E8] focus:ring-offset-2 ${isNewlyCreated
                  ? "bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-100 border-2 border-emerald-400 shadow-lg animate-pulse"
                  : isSelected
                    ? "bg-gradient-to-br from-[#E8EFF8] via-[#F4F9FE] to-[#F0F5FC] border-2 border-[#B3D6F6] shadow-lg"
                    : "bg-white border-2 border-gray-200 hover:border-[#1A86E8]/40 hover:shadow-md"
                  }`}
              >
                <div className="flex items-center gap-1">
                  <div
                    className={`px-3 py-1 rounded-lg flex-shrink-0 ${isSelected
                      ? "bg-gradient-to-br from-[#1A86E8] via-[#6A88BC] to-[#1A86E8]"
                      : "bg-gradient-to-br from-[#E8EDF5] to-[#D5DFF0]"
                      }`}
                  >
                    <span
                      className={`text-sm font-bold ${isSelected
                        ? "text-white"
                        : "text-[#1A86E8]"
                        }`}
                    >
                      {zoneNo}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-bold text-sm truncate ${isSelected
                            ? "text-[#2C4A75]"
                            : "text-gray-900"
                            }`}
                        >
                          {description ||
                            t("zoneList.zoneName", { zone: zoneAlias })}
                        </h4>
                        {descriptionEnglish && (
                          <p
                            className={`text-xs truncate ${isSelected
                              ? "text-[#4A5F8C]"
                              : "text-gray-500"
                              }`}
                          >
                            {descriptionEnglish}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1 items-center flex-shrink-0">
                        <StatusBadge
                          value={
                            isActive
                              ? "active"
                              : "inactive"
                          }
                        />
                        <EditButton
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();

                            if (!zoneId) return;

                            const params = new URLSearchParams(searchParams.toString());
                            params.set("editZone", String(zoneId));
                            router.push(`${pathname}?${params.toString()}`);
                          }}
                        />
                        <DeleteButton
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              zoneId &&
                              zoneNo
                            ) {
                              handleDeleteClick(
                                zoneId,
                                zoneNo,
                                description
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-[#4A5F8C]" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        }}
      />
    </div>
  );
}