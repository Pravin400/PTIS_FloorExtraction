"use client";
 
import { useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SearchInput } from "@/components/common";
import { AddButton } from "@/components/common/ActionButtons";
import { useMoujaSearch } from "@/hooks/moujamaster/useMoujaSearch";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export function MoujaMasterHeaderExtra() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("mouja.moujaMaster");
  const [, startTransition] = useTransition();

  const moujaLabel = useAliasLabel("Mouja", t("aliasFallback.entity"));
  const values = useMemo(
    () => ({ mouja: moujaLabel, entity: moujaLabel }),
    [moujaLabel]
  );

  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;

  const { search, handleSearchChange } = useMoujaSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
    startTransition,
  });

  // Only render on the main listing page, not on add/edit pages
  if (pathname !== `/${locale}/property-tax/moujamaster`) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-3 ml-auto">
      <SearchInput
        value={search}
        onChange={handleSearchChange}
        placeholder={t("list.filters.search", values) || "Search Mouja..."}
        className="mb-0 w-full max-w-xs text-gray-900"
      />
      <AddButton
        onClick={() => {
          router.push(`/${locale}/property-tax/moujamaster/add`);
        }}
        label={t("list.buttons.add", values)}
      />
    </div>
  );
}
