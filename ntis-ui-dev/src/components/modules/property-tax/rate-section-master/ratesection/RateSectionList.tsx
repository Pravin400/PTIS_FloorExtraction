"use client";

import { Layers } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { RateSectionListProps, RateItem } from "@/types/rateSectionMaster.types";
import { useConfirm } from "@/components/common";
import { CardList } from "@/components/common/CardList";
import RateSectionCard from "./RateSectionCard";
import RateSectionListHeader from "./RateSectionListHeader";
import { handleRateSectionDelete } from "./rateSectionHandlers";
import { useRateSectionList } from "@/hooks/rateSectionMaster/useRateSectionList";

export default function RateSectionList({
  rates = [],
  selectedRateSection,
  newlyCreatedRateNo,
  initialWardCounts = {},
  totalCount = 0,
  onDeleteSuccess,
  rateSectionAlias: propRateSectionAlias,
  wardsAlias: propWardsAlias
}: RateSectionListProps) {
  const t = useTranslations("rateSectionMaster");
  const defaultRateSection = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const defaultWards = useAliasLabel("Wards", t("defaults.wards"));
  const rateSection = propRateSectionAlias || defaultRateSection;
  const wards = propWardsAlias || defaultWards;

  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageNumber = Number(searchParams?.get("ratesectionpage")) || 1;
  const pageSize = Number(searchParams?.get("ratesectionpagesize")) || 10;
  const initialSearch = searchParams?.get("q") || "";

  const {
    wardCounts,
    deletingId,
    setDeletingId,
    searchValue,
    setSearchValue,
    totalPages,
    effectivePageSize,
    changePageSize,
    handlePageChange
  } = useRateSectionList({
    initialWardCounts,
    initialSearch,
    totalCount,
    pageSize
  });

  const handleDeleteClick = (rateId: string, rateName: string) => {
    const displayName = rateName;

    confirm({
      variant: "delete",
      title: t("dialogs.deleteTitle", { rateSection }),
      description: t("dialogs.deleteDescription", { name: displayName, rateSection }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      onConfirm: () => handleRateSectionDelete({
        rateId,
        rateName,
        wardCounts,
        searchParams,
        pathname,
        rates,
        router,
        onDeleteSuccess,
        t,
        setDeletingId,
        rateSectionAlias: rateSection,
        wardsAlias: wards
      }),
    });
  };

  return (
    <div className="p-3">
      <RateSectionListHeader
        title={t('list.title', { rateSection })}
        searchPlaceholder={t('list.searchPlaceholder', { rateSection })}
        addButtonLabel={t('list.addRateSection', { rateSection })}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAddClick={() => {
          const params = new URLSearchParams(searchParams?.toString());
          params.set("addRateSection", "");
          router.push(`?${params.toString()}`);
        }}
      />

      <CardList<RateItem>
        data={rates}
        pageNumber={pageNumber}
        pageSize={effectivePageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={changePageSize}
        emptyText={searchValue ? t('list.noRateSectionsFound', { rateSection }) : t('list.noRateSectionsAvailable', { rateSection })}
        emptyIcon={<Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />}
        renderCard={(rate, index) => {
          const rateId = String(rate.id);
          const isSelected = selectedRateSection === rateId;
          const isNewlyCreated = newlyCreatedRateNo === rateId;
          const serialNo = (pageNumber - 1) * effectivePageSize + index + 1;

          return (
            <RateSectionCard
              key={rate.id || index}
              rate={rate}
              index={index}
              serialNo={serialNo}
              isSelected={isSelected}
              isNewlyCreated={isNewlyCreated}
              onDelete={handleDeleteClick}
              deletingId={deletingId}
              searchParams={searchParams}
              pathname={pathname}
              t={t}
              rateSectionAlias={rateSection}
            />
          );
        }}
      />

    </div>
  );
}


