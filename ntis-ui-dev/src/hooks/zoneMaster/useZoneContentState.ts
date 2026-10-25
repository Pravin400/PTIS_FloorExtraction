import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function useZoneContentState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [, startTransition] = useTransition();
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  // =========================
  // 🔥 ACTION CONTROL (ONLY SOURCE OF TRUTH)
  // =========================
  const editWardId = searchParams.get("editWard");
  const editZoneId = searchParams.get("editZone");

  const isAddZoneOpen = searchParams.has("addZone");
  const isAddWardOpen = searchParams.has("linkWard");
  const isCreateWardOpen = searchParams.has("createWard") || searchParams.has("createWardBulk");
  const isEditWardOpen = editWardId !== null;
  const isEditZoneOpen = editZoneId !== null;

  const handleCloseDrawer = () => {
    // Immediate visual close
    setIsDrawerClosing(true);
    
    const params = new URLSearchParams(searchParams.toString());
    // Remove all drawer-related params
    params.delete("addZone");
    params.delete("linkWard");
    params.delete("createWard");
    params.delete("createWardBulk");
    params.delete("createWardMode");
    params.delete("editWard");
    params.delete("editZone");
    // Clean up LinkWard-related params
    params.delete("availablewardq");
    params.delete("viewwardq");
    params.delete("viewwardpage");
    params.delete("viewwardpagesize");
    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
      // Reset closing state after navigation starts
      setTimeout(() => setIsDrawerClosing(false), 100);
    });
  };

  const handleZoneSelect = (zoneId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zoneId", String(zoneId));
    params.delete("wardQ");
    params.delete("wardPage");
    // Clear property ward selection when zone changes
    // SSR will auto-select first ward of the new zone
    params.delete("propWardId");
    params.delete("propPage");
    params.delete("propQ");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Clean refresh after update (no _r param)
  const refreshAfterUpdate = () => {
    router.refresh();
  };

  return {
    isDrawerClosing,
    isAddZoneOpen,
    isAddWardOpen,
    isCreateWardOpen,
    isEditWardOpen,
    isEditZoneOpen,
    editWardId,
    editZoneId,
    handleCloseDrawer,
    handleZoneSelect,
    refreshAfterUpdate,
  };
}
