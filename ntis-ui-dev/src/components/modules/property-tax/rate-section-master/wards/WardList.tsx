"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WardListProps } from "@/types/rateSectionMaster.types";
import { useConfirm } from "@/components/common";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { TEXT_SANITIZE } from "@/lib/utils/validation";
import WardTable from "./WardTable";
import WardListHeader from "./WardListHeader";
import { handleWardDelete, handleWardEdit } from "./wardHandlers";
import { useWardData } from "@/hooks/rateSectionMaster/useWardData";
import { useWardRateSectionLabel } from "@/hooks/rateSectionMaster/useWardRateSectionLabel";

const sanitizeSearch = (value: string) => value.replace(TEXT_SANITIZE, '');

export default function WardList({
  rates = [],
  sections = [],
  sectionsTotalCount = 0,
  selectedRateSection: propSelectedRateSection,
  selectedRateSectionLabel: propSelectedRateSectionLabel,
  onWardsChanged,
  rateSectionAlias: propRateSectionAlias,
  wardAlias: propWardAlias,
  wardsAlias: propWardsAlias
}: WardListProps) {
  const t = useTranslations("rateSectionMaster");
  const defaultRateSection = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const defaultWard = useAliasLabel("Ward", t("defaults.ward"));
  const defaultWards = useAliasLabel("Wards", t("defaults.wards"));
  const rateSection = propRateSectionAlias || defaultRateSection;
  const ward = propWardAlias || defaultWard;
  const wards = propWardsAlias || defaultWards;

  const router = useRouter();
  const { confirm } = useConfirm();
  const searchParams = useSearchParams();

  const rateSectionFromUrl = searchParams.get("zone");
  const selectedRateSection = rateSectionFromUrl || propSelectedRateSection;
  const pageNumber = Number(searchParams?.get("wardpage")) || 1;
  const pageSize = Number(searchParams?.get("wardpagesize")) || 10;
  const initialSearch = searchParams?.get("wardq") || "";
  const [search, setSearch] = useState(sanitizeSearch(initialSearch));

  useEffect(() => {
    startTransition(() => {
      setSearch(sanitizeSearch(initialSearch));
    });
  }, [initialSearch]);

  const { rateSectionLabel, effectiveSelectedRateSection } = useWardRateSectionLabel({
    selectedRateSection,
    propSelectedRateSectionLabel,
    rates,
    sections
  });

  const {
    paginatedWards,
    totalCount,
    totalPages,
    effectivePageNumber,
    effectivePageSize,
    setDeletedIds
  } = useWardData({
    sections,
    sectionsTotalCount,
    search,
    pageNumber,
    pageSize
  });

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("wardpage", page.toString());
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("wardpagesize", newSize.toString());
      params.set("wardpage", "1");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      const sanitizedValue = sanitizeSearch(value);
      setSearch(sanitizedValue);
      const params = new URLSearchParams(searchParams.toString());
      params.set("wardpage", "1");
      const trimmed = sanitizedValue.trim();
      if (trimmed) {
        params.set("wardq", trimmed);
      } else {
        params.delete("wardq");
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handleAddWard = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("addWard", "");
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <div className="flex flex-col h-full">
      <WardListHeader
        title={t('wards.title', { wards })}
        effectiveSelectedRateSection={effectiveSelectedRateSection}
        rateSectionLabel={rateSectionLabel}
        selectRateSectionText={t("wards.selectRateSection", { rateSection })}
        totalCount={totalCount}
        totalWardsLabel={t('list.totalWards', { wards })}
        search={search}
        searchPlaceholder={t('wards.searchWardNo', { ward })}
        linkWardLabel={t('wards.linkWard', { ward })}
        onSearch={handleSearch}
        onAddWard={handleAddWard}
      />

      <div className="flex-1 px-4 pb-4">
        {!effectiveSelectedRateSection ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t('wards.selectRateSectionToView', { rateSection, wards })}
          </div>
        ) : (
          <WardTable
            data={paginatedWards}
            pageNumber={effectivePageNumber}
            pageSize={effectivePageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={(row) => handleWardEdit({ row, searchParams, router })}
            onDelete={(row) => handleWardDelete({
              row,
              rateSectionLabel,
              effectiveSelectedRateSection,
              confirm,
              setDeletedIds,
              onWardsChanged,
              t,
              wardAlias: ward,
              rateSectionAlias: rateSection,
              wardsAlias: wards
            })}
            emptyText={t('wards.noWardsFound', { wards })}
            wardAlias={ward}
            rateSectionAlias={rateSection}
          />
        )}
      </div>
    </div>
  );
}

