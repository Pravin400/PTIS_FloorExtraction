"use client";

import { memo } from "react";
import { User } from "lucide-react";
import { Card, Label, Select, Badge, StatusBadge } from "@/components/common";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

interface UserAllocationHeaderCardProps {
  user: AssetUserListItem | null;
  activeUser: AssetUserListItem;
  allUsers?: AssetUserListItem[];
  selectedUserId?: number | null;
  handleUserChange?: (id: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationHeaderCard = memo(function UserAllocationHeaderCard({
  user,
  activeUser,
  allUsers = [],
  selectedUserId,
  handleUserChange,
  t,
}: UserAllocationHeaderCardProps) {
  const fullName =
    [activeUser.firstName, activeUser.middleName, activeUser.lastName].filter(Boolean).join(" ") ||
    activeUser.userName;

  return (
    <div className="space-y-3.5">
      {/* User Picker (if opened without specific row selection) */}
      {!user && allUsers.length > 0 && (
        <Card
          variant="bordered"
          padding="none"
          className="bg-white rounded-xl border-slate-200 p-3 shadow-xs space-y-1.5"
        >
          <Label className="text-xs font-semibold text-slate-700">
            {t("drawer.userSelectLabel")}
          </Label>
          <Select
            value={String(selectedUserId ?? "")}
            onChange={(e) => handleUserChange?.(Number(e.target.value))}
            options={allUsers.map((u) => ({
              value: String(u.id),
              label: `${u.userName} (${[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName})`,
            }))}
            selectSize="sm"
            className="w-full"
            ariaLabel={t("drawer.userSelectLabel")}
          />
        </Card>
      )}

      {/* User Summary Card (Responsive Compact Height) */}
      <Card
        variant="bordered"
        padding="none"
        className="bg-white rounded-xl border-slate-200 px-3.5 sm:px-4 py-2.5 shadow-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {activeUser.userName ? (
              activeUser.userName.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                {fullName}
              </h3>
              {activeUser.userCode ? (
                <Badge variant="secondary" size="sm" className="font-mono !text-[10px] !py-0 !px-1.5">
                  {activeUser.userCode}
                </Badge>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {activeUser.email || "-"} • {activeUser.mobileNo || "-"}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-center">
          <StatusBadge
            value={activeUser.isActive}
            activeLabel={t("status.active")}
            inactiveLabel={t("status.inactive")}
          />
        </div>
      </Card>
    </div>
  );
});
