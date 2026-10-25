"use client";
import { useState, useMemo, useTransition } from "react";
import { AddButton, EditButton, DeleteButton } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { MasterTable, type Column } from "@/components/common/MasterTable";
import { SearchInput } from "@/components/common/SearchInput";
import type { TypeOfUseCategory } from "@/types/typeOfUse.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { deleteTypeOfUseCategory } from "@/app/[locale]/property-tax/typeofusemaster/actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderHeart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface CategoryListDrawerProps {
  categories: TypeOfUseCategory[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export default function CategoryListDrawer({ 
  categories, 
  totalCount = 0, 
  pageNumber = 1, 
  pageSize = 10 
}: CategoryListDrawerProps) {
  const t = useTranslations('typeofusemaster');
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { confirm } = useConfirm();

  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  useSearchNavigation({
    search: searchTerm,
    currentSearchTerm: initialSearchTerm,
    pageSize,
    locale,
    basePath: "/property-tax/typeofusemaster/category",
    startTransition,
    debounceMs: 500,
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => {
      router.push(`/${locale}/property-tax/typeofusemaster/category?${params.toString()}`);
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(newSize));
    params.set("page", "1");
    startTransition(() => {
      router.push(`/${locale}/property-tax/typeofusemaster/category?${params.toString()}`);
    });
  };

  const handleDelete = (category: TypeOfUseCategory) => {
    confirm({
      variant: "delete",
      title: t("messages.deleteConfirmation"),
      meta: { name: category.typeOfUseCategoryName },
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const result = await deleteTypeOfUseCategory(category.id);
          if (result.success) {
            toast.success(t("category.messages.categoryDeleted", { category: categoryLabel }));
            router.refresh();
          } else if (result.statusCode === 409) {
            toast.error(t("category.messages.inUseError", { name: category.typeOfUseCategoryName, category: categoryLabel }));
          } else {
            toast.error(result.message || t("category.messages.deleteFailed", { category: categoryLabel }));
          }
        } catch {
          toast.error(t("category.messages.deleteFailed", { category: categoryLabel }));
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const columns = useMemo<Column<TypeOfUseCategory>[]>(
    () => [
      {
        key: "typeOfUseCategoryCode",
        label: t("category.fields.categoryCode", { category: categoryLabel }),
      },
      {
        key: "typeOfUseCategoryName",
        label: t("category.fields.categoryName", { category: categoryLabel }),
      },
      {
        key: "isActive" as keyof TypeOfUseCategory,
        label: t("category.fields.status"),
        render: (value) => (
          <StatusBadge value={value ? "Active" : "Inactive"} />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, isDeleting, categoryLabel]
  );

  const renderActions = (row: TypeOfUseCategory) => (
    <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
      <EditButton
        size="sm"
        title={t("buttons.edit") + " " + t("category.title", { typeOfUse: typeOfUseLabel, category: categoryLabel })}
        onClick={() => router.push(`/${locale}/property-tax/typeofusemaster/category/edit/${row.id}`)}
      />
      <DeleteButton
        size="sm"
        title={t("buttons.delete") + " " + t("category.title", { typeOfUse: typeOfUseLabel, category: categoryLabel })}
        onClick={() => handleDelete(row)}
        disabled={isDeleting || !row.isActive}
      />
    </div>
  );

  return (
    <Drawer
      open
      onClose={() => router.push(`/${locale}/property-tax/typeofusemaster`)}
      className="border-l-4 border-[#4F6A94]"
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
            <FolderHeart size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {t("category.title", { typeOfUse: typeOfUseLabel, category: categoryLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {t("category.searchPlaceholder", { category: categoryLabel })}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5 bg-[#F8FAFF] min-h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="w-full sm:w-80">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t("category.searchPlaceholder", { category: categoryLabel })}
              className="mb-0 text-gray-700 w-full"
            />
          </div>
          <AddButton
            size="md"
            label={t("category.addNew", { category: categoryLabel })}
            onClick={() => router.push(`/${locale}/property-tax/typeofusemaster/category/add`)}
          />
        </div>

        <div className="rounded-xl border border-[#DCEAFF] bg-white shadow-sm overflow-hidden">
          <MasterTable
            data={categories}
            columns={columns}
            emptyText={t("category.noCategories", { category: categoryLabel })}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            renderActions={renderActions}
            height="md"
          />
        </div>
      </div>
    </Drawer>
  );
}
