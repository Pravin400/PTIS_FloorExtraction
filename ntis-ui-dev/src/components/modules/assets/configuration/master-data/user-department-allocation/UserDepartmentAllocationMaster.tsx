"use client";

import { useCallback, useTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ShieldCheck, Building2, Pencil } from "lucide-react";
import {
  PageContainer,
  SearchInput,
  Button,
  MasterTable,
  TableHeader,
} from "@/components/common";
import type {
  AssetUserListItem,
  UserDepartmentAllocationMasterProps,
} from "@/types/asset-masters/user-department-allocation.types";
import { getUserDepartmentAllocationColumns } from "./UserDepartmentAllocationColumns";
import { useUserDepartmentAllocationSearch } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationSearch";
import { useUserDepartmentAllocationPagination } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationPagination";

function hasUserAllocation(user: AssetUserListItem): boolean {
  if (user.owningDepartments && user.owningDepartments.length > 0) return true;
  if (user.zoneAllocations && user.zoneAllocations.length > 0) return true;
  if (user.stageAccess && user.stageAccess.length > 0) return true;
  return false;
}

export function UserDepartmentAllocationMaster(props: UserDepartmentAllocationMasterProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("userDepartmentAllocation");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [navigatingUserId, setNavigatingUserId] = useState<number | null>(null);

  const {
    data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    sortBy,
    sortOrder,
  } = props;

  // Search hook matching designation-master architecture
  const { search, currentSearchTerm, handleSearchChange } = useUserDepartmentAllocationSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  // Pagination & Sorting hook matching designation-master architecture
  const { handleSort, handlePageChange, handlePageSizeChange } =
    useUserDepartmentAllocationPagination({
      pageNumber,
      pageSize,
      totalCount,
      locale,
      currentSearchTerm,
      sortBy,
      sortOrder,
    });

  // Dynamic routing with startTransition to keep UI active without full-page loading flash
  const handleNavigateToEdit = useCallback(
    (userId: number) => {
      setNavigatingUserId(userId);
      startTransition(() => {
        router.push(`/${locale}/assets/configuration/master-data/user-department-allocation/edit/${userId}`);
      });
    },
    [locale, router]
  );

  const columns = useMemo(() => {
    return getUserDepartmentAllocationColumns(t, tCommon, sortBy, sortOrder, handleSort);
  }, [t, tCommon, sortBy, sortOrder, handleSort]);

  return (
    <PageContainer className="p-3 sm:p-4 md:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* TableHeader with search input */}
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={ShieldCheck}
          rightContent={
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("searchPlaceholder")}
                className="mb-0 w-full sm:w-64 lg:w-80 text-gray-900"
              />
            </div>
          }
        />

        {/* Master Table with consistent spacing and individual Allocation button per user */}
        <MasterTable<AssetUserListItem>
          theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
          footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
          columns={columns}
          data={data || []}
          // Data is pre-fetched on the server via SSR (page.tsx); loading skeleton is handled by Next.js loading.tsx
          loading={false}
          emptyText={t("emptyStates.noUsersFound")}
          loadingText={t("drawer.pleaseWait")}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          renderActions={(row) => {
            const isAllocated = hasUserAllocation(row);
            const actionText = isAllocated ? t("updateButton") : t("allocateButton");
            const isRowLoading = isPending && navigatingUserId === row.id;

            return (
              <Button
                variant="primary"
                size="xs"
                icon={isAllocated ? Pencil : Building2}
                onClick={() => handleNavigateToEdit(row.id)}
                disabled={isPending}
                isLoading={isRowLoading}
                title={`${actionText} - ${row.userName}`}
                className="!bg-blue-900 hover:!bg-blue-950 !text-white font-medium disabled:!opacity-60"
              >
                {actionText}
              </Button>
            );
          }}
          actionLabel={t("columns.actions")}
          actionCellAlign="center"
          actionHeaderAlign="center"
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </PageContainer>
  );
}
