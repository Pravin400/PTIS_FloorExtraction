"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { MeterType, MeterTypeProps } from "@/types/water-bill/meter-type-master.types";
import { getMeterTypeColumns } from "@/components/modules/water-bill/meter-type-master/MeterTypeColumns";
import { deleteMeterTypeAction } from "@/app/[locale]/water-bill/metertypemaster/action";

import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";

export function useMeterTypeMaster({
  pageSize,
  sortBy,
  sortOrder,
}: MeterTypeProps) {
  const router = useRouter();
  const locale = useLocale();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("meterTypeMaster");

  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = useCallback(
    (columnKey: string) => {
      let newSortOrder = "asc";
      if (sortBy === columnKey) {
        newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      if (searchTerm) params.set("q", searchTerm);
      params.set("sortBy", columnKey);
      params.set("sortOrder", newSortOrder);

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [sortBy, sortOrder, pageSize, searchTerm, router]
  );

  const columns = getMeterTypeColumns(sortBy, sortOrder, handleSort, t);

  const handleSearchChange = useCallback((val: string) => {
    const sanitized = val.replace(TEXT_SANITIZE, "");
    setSearchTerm(sanitized);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    if (sanitized) params.set("q", sanitized);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }, [pageSize, sortBy, sortOrder, router]);

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    if (searchTerm) params.set("q", searchTerm);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }, [pageSize, searchTerm, sortBy, sortOrder, router]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", newSize);
    if (searchTerm) params.set("q", searchTerm);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }, [searchTerm, sortBy, sortOrder, router]);

  const handleOpenAdd = useCallback(() => {
    startTransition(() => {
      router.push(`/${locale}/water-bill/metertypemaster/add`);
    });
  }, [router, locale]);

  const handleOpenEdit = useCallback(
    (item: MeterType) => {
      startTransition(() => {
        router.push(`/${locale}/water-bill/metertypemaster/edit/${item.id}`);
      });
    },
    [router, locale]
  );

  const handleDelete = useCallback((row: MeterType) => {
    const codeVal = row.meterTypeCode || row.code || "";
    confirm({
      variant: "delete",
      title: t("confirm.deleteTitle", { code: codeVal }),
      description: t("confirm.deleteDescription"),
      meta: {
        name: row.meterType,
      },
      onConfirm: async () => {
        const res = await deleteMeterTypeAction(row.id);
        if (res.success) {
          toast.success(t("messages.deleteSuccess"));
          startTransition(() => {
            router.refresh();
          });
        } else {
          toast.error(res.message || t("messages.deleteFailed"));
        }
      },
    });
  }, [confirm, router, t]);

  return {
    isPending,
    searchTerm,
    columns,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleOpenAdd,
    handleOpenEdit,
    handleDelete,
  };
}
