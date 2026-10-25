"use client";

import { Settings } from "lucide-react";
import { SearchInput } from "@/components/common";
import { AddButton } from "@/components/common/ActionButtons";
import { useRouter } from "next/navigation";

interface OwningDepartmentHeaderProps {
  search: string;
  handleSearchChange: (val: string) => void;
  locale: string;
  t: (key: string) => string;
}

export function OwningDepartmentHeader({
  search,
  handleSearchChange,
  locale,
  t,
}: OwningDepartmentHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-slate-700" />
        <div>
          <div className="text-lg font-semibold text-slate-900">{t("title")}</div>
          <div className="text-sm text-slate-500">{t("subtitle")}</div>
        </div>
      </div>
      <div className="flex w-full max-w-xl items-center gap-3">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder={t("searchPlaceholder")}
          className="mb-0 w-full"
        />
        <AddButton
          label={t("add")}
          onClick={() => router.push(`/${locale}/assets/configuration/master-data/owning-department/add`)}
          className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
        />
      </div>
    </div>
  );
}
