import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common";
import { RoomWiseSubmissionProps } from "@/types/room-details.types";
// useConfirm kept for the "no rooms" warning dialog
import { convertAreaUnit } from "@/lib/utils/RoomSubmission/room-calculation.util";
import { RoomSubmissionState } from "@/hooks/ptis/RoomSubmission/useRoomSubmissionState";

/**
 * Apartment QC–specific persistence hook.
 *
 * ADD/UPDATE/DELETE have already been persisted individually. "SAVE DATA":
 *   1. Calls onUpdate which syncs room aggregates on the backend and refetches Floor QC.
 *   2. Shows a success toast and closes the drawer programmatically.
 *
 * Note: sync-rooms is called by onUpdate (handleRoomUpdate in PropertyDetailsEditScreen),
 * so we don't call it here to avoid duplicate calls.
 */
export const useApartmentQCRoomPersistenceActions = (
  state: RoomSubmissionState,
  props: RoomWiseSubmissionProps
) => {
  const t = useTranslations("quickDataEntry");
  const { confirm } = useConfirm();

  const { rooms, grandTotal, builtupGrandTotal, areaUnit, setIsUpdating } = state;
  const { onClose, onUpdate, floorNumber } = props;

  const handleSaveData = async () => {
    if (grandTotal <= 0) {
      confirm({
        variant: "warning",
        title: t("common.warning") || "Warning",
        description:
          t("roomSubmission.validation.atLeastOneRoom") ||
          "Please add at least one room before saving.",
        confirmText: t("common.ok") || "OK",
        onConfirm: () => {},
      });
      return;
    }

    setIsUpdating(true);

    try {
      const areaSqM = convertAreaUnit(grandTotal, areaUnit || "sq.m", "sq.m");
      const builtUpSqM = convertAreaUnit(
        builtupGrandTotal,
        areaUnit || "sq.m",
        "sq.m"
      );

      // Await onUpdate so the Floor QC refetch completes (area + noOfRooms update)
      // before we close the drawer. onUpdate calls sync-rooms internally.
      // The prop is typed as void but the actual handler is async, so we cast
      // through unknown to allow await.
      if (onUpdate) {
        await (onUpdate as unknown as (...a: unknown[]) => Promise<void>)({
          floorNumber: floorNumber || "0",
          rooms,
          totalAreaSqM: parseFloat(areaSqM.toFixed(2)),
          builtUpAreaSqM: parseFloat(builtUpSqM.toFixed(2)),
          roomCount: rooms.filter((r) => Number(r.area || 0) > 0).length,
        });
      }

      toast.success(
        t("roomSubmission.success.message") || "Room data saved successfully."
      );
      if (onClose) onClose();
    } catch {
      toast.error(
        t("roomSubmission.validation.updateFailed") ||
          "An error occurred while saving room data."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return { handleSaveData };
};
