import { LockedScreen, LockUnlockPropertyItem } from "@/types/lockunlock.types";

/**
 * Converts a list that may contain screen IDs or screen objects into an array of numeric IDs.
 */
export function getScreenIds(screensList: (number | LockedScreen)[]): number[] {
  return (screensList || [])
    .map((item: number | LockedScreen) => {
      if (item && typeof item === "object") {
        const obj = item as { id?: number; screenId?: number };
        return Number(obj.id ?? obj.screenId ?? 0);
      }
      return Number(item);
    })
    .filter((id) => id > 0);
}

/**
 * Maps locked screen IDs to their display names using the available screens list.
 */
export function getScreenNames(
  lockedScreenIds: number[],
  allScreens: LockedScreen[]
): string[] {
  return lockedScreenIds.map((id) => {
    const match = allScreens.find((s) => s.id === id);
    return match ? match.screenName : `Screen ID: ${id}`;
  });
}

/**
 * Resolves screen names from LockUnlockPropertyItem.lockedScreens.
 * Handles both number arrays and object arrays gracefully.
 */
export function resolveLockedScreenNames(
  property: LockUnlockPropertyItem,
  allScreens: LockedScreen[]
): string[] {
  const ids = getScreenIds(property.lockedScreens as unknown as (number | LockedScreen)[]);
  return getScreenNames(ids, allScreens);
}

import type { ConfirmOptions } from "@/components/common/ConfirmProvider";

export interface ExecuteToggleLockParams {
  row: LockUnlockPropertyItem;
  selectedScreenIds: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  confirm: (payload: ConfirmOptions) => void;
  setIsActionPending: (pending: boolean) => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  bulkLockUnlockAction: (payload: {
    propertyIds: number[];
    screenIds: number[];
    action: "lock" | "unlock";
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRefresh: () => void;
  validateScreenState?: boolean;
}

/**
 * Common logic for single-property Lock/Unlock confirmation and mutation.
 * Reused across Master mode and Excel mode.
 */
export function executeToggleLock({
  row,
  selectedScreenIds,
  t,
  confirm,
  setIsActionPending,
  toast,
  bulkLockUnlockAction,
  onRefresh,
  validateScreenState = false,
}: ExecuteToggleLockParams): void {
  const willLock = !row.isLocked;

  if (selectedScreenIds.length === 0) {
    toast.error(
      t("messages.screenRequired", {
        action: willLock
          ? t("messages.lockButtonText").toLowerCase()
          : t("messages.unlockButtonText").toLowerCase(),
      })
    );
    return;
  }

  if (validateScreenState) {
    const lockedIds = getScreenIds(row.lockedScreens as unknown as []);
    if (willLock) {
      const allAlreadyLocked = selectedScreenIds.every((id) => lockedIds.includes(id));
      if (allAlreadyLocked) {
        toast.error(t("messages.wrongScreenSelectedLock"));
        return;
      }
    } else {
      const noneAreLocked = selectedScreenIds.every((id) => !lockedIds.includes(id));
      if (noneAreLocked) {
        toast.error(t("messages.wrongScreenSelectedUnlock"));
        return;
      }
    }
  }

  const title = willLock ? t("messages.lockConfirmTitle") : t("messages.unlockConfirmTitle");
  const fullPropertyNo =
    row.property ||
    `${row.wardNo} - ${row.propertyNo}${row.partitionNo ? ` - ${row.partitionNo}` : ""}`;
  const description = willLock
    ? t("messages.lockConfirmDescription", { propertyNo: fullPropertyNo })
    : t("messages.unlockConfirmDescription", { propertyNo: fullPropertyNo });

  confirm({
    variant: willLock ? "warning" : "info",
    title,
    description,
    confirmText: willLock ? t("messages.lockButtonText") : t("messages.unlockButtonText"),
    onConfirm: async () => {
      setIsActionPending(true);
      try {
        const response = await bulkLockUnlockAction({
          propertyIds: [Number(row.propertyId)],
          screenIds: selectedScreenIds.map(Number),
          action: willLock ? "lock" : "unlock",
        });

        if (response.success) {
          toast.success(
            willLock
              ? t("messages.bulkSuccessLock", { count: 1 })
              : t("messages.bulkSuccessUnlock", { count: 1 })
          );
          onRefresh();
        } else {
          toast.error(response.error || t("messages.operationFailed"));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("messages.unexpectedError"));
      } finally {
        setIsActionPending(false);
      }
    },
  });
}