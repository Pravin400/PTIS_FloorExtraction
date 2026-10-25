"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SupportedLanguageCode } from "@/types/multilingual-translation.types";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/app/[locale]/configuration-settings/multilingual-translation/page";

interface UseMultilingualTranslationPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  resource?: string;
  languages: SupportedLanguageCode[];
  startTransition: (callback: () => void) => void;
}

const ROUTE_BASE = "configuration-settings/multilingual-translation";

export function useMultilingualTranslationPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  resource,
  languages,
  startTransition,
}: UseMultilingualTranslationPaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (
      page: number,
      size: number,
      nextResource?: string,
      nextLanguages?: SupportedLanguageCode[]
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));

      const effectiveResource = nextResource ?? resource;
      if (effectiveResource) {
        params.set("resource", effectiveResource);
      }

      const effectiveLanguages = nextLanguages ?? languages;
      for (const lang of effectiveLanguages) {
        params.append("languages", lang);
      }

      return `/${locale}/${ROUTE_BASE}?${params.toString()}`;
    },
    [locale, resource, languages]
  );

  const changePage = useCallback(
    (p: number): void => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize));
      });
    },
    [pageSize, buildUrl, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const next = Number(value);
      const clampedSize =
        Number.isFinite(next) && next > 0 && next <= MAX_PAGE_SIZE
          ? next
          : DEFAULT_PAGE_SIZE;
      startTransition(() => {
        router.push(buildUrl(1, clampedSize));
      });
    },
    [buildUrl, router, startTransition]
  );

  const handleResourceChange = useCallback(
    (nextResource: string) => {
      startTransition(() => {
        router.push(buildUrl(1, pageSize, nextResource, languages));
      });
    },
    [buildUrl, pageSize, languages, router, startTransition]
  );

  const handleLanguagesChange = useCallback(
    (nextLanguages: SupportedLanguageCode[]) => {
      startTransition(() => {
        router.push(buildUrl(1, pageSize, resource, nextLanguages));
      });
    },
    [buildUrl, pageSize, resource, router, startTransition]
  );

  const start = totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1;
  const end = Math.min(start + (pageSize || 10) - 1, totalCount);

  return {
    buildUrl,
    changePage,
    handlePageSizeChange,
    handleResourceChange,
    handleLanguagesChange,
    paginationInfo: { start, end, total: totalCount || 0 },
  };
}
