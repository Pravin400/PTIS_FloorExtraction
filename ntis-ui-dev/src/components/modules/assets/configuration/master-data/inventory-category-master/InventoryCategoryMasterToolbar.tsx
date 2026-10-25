"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AddButton, SearchInput } from "@/components/common";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";

export function InventoryCategoryMasterToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const t = useTranslations("inventoryCategory.configuration.masterData");
  const tNames = useTranslations("inventoryCategory.masterNames");

  const base = `/${locale}/assets/configuration/master-data`;

  // Search state
  const currentSearchTerm = searchParams.get("search") ?? "";
  const [search, setSearch] = useState<string>(currentSearchTerm);
  const [prevSearchFromUrl, setPrevSearchFromUrl] = useState(currentSearchTerm);

  // Sync search state with URL when currentSearchTerm changes (Avoid useEffect to prevent cascading renders)
  if (currentSearchTerm !== prevSearchFromUrl) {
    setSearch(currentSearchTerm);
    setPrevSearchFromUrl(currentSearchTerm);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search === currentSearchTerm) return;

      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, currentSearchTerm, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center">
        <SearchInput
          value={search}
          onChange={(value) => setSearch(value.replace(TEXT_SANITIZE, ""))}
          placeholder={t("searchPlaceholder")}
          className="mb-0 w-64 lg:w-80 text-gray-900"
        />
      </div>

      <AddButton
        label={t("addNew", { name: tNames("inventory-category-master") })}
        onClick={() => router.push(`${base}/inventory-category/add`)}
        className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
      />
    </div>
  );
}
