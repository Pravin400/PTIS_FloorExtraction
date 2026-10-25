"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { UserDepartmentAllocationDrawer } from "./UserDepartmentAllocationDrawer";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  GrievanceWorkflowStageOption,
} from "@/types/asset-masters/user-department-allocation.types";

export interface UserDepartmentAllocationEditWrapperProps {
  user: AssetUserListItem;
  owningDepartments: OwningDepartmentOption[];
  zones: ZoneOption[];
  stages?: GrievanceWorkflowStageOption[];
  initialStep?: 1 | 2 | 3;
  initialZoneId?: number;
  initialWardsByZone?: Record<number, WardOption[]>;
}

export function UserDepartmentAllocationEditWrapper({
  user,
  owningDepartments,
  zones,
  stages,
  initialStep,
  initialZoneId,
  initialWardsByZone,
}: UserDepartmentAllocationEditWrapperProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("userDepartmentAllocation");
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const navigateBack = useCallback(() => {
    setOpen(false);
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/assets/configuration/master-data/user-department-allocation`);
      });
    }, 300);
  }, [router, locale]);

  const handleClose = navigateBack;
  const handleSuccess = navigateBack;

  return (
    <UserDepartmentAllocationDrawer
      open={open}
      onClose={handleClose}
      user={user}
      owningDepartments={owningDepartments}
      zones={zones}
      stages={stages}
      initialStep={initialStep}
      initialZoneId={initialZoneId}
      initialWardsByZone={initialWardsByZone}
      t={t}
      onSuccess={handleSuccess}
    />
  );
}
