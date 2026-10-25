"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common";
import {
  deletePropertyAmenityAction,
  deleteMultiplePropertiesAmenitiesAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import type { SocietyAmenityDetailItem } from "@/types/zone-master/properties/society-amenity-details.types";

interface UsePropertyAmenityDeleteProps {
  isAmenity: boolean;
  selectedRows: Set<number>;
  refreshTable: () => void;
  resetSelection: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: any) => string;
}

interface UsePropertyAmenityDeleteReturn {
  handleSingleDelete: (item: SocietyAmenityDetailItem) => void;
  handleBulkDelete: () => void;
}

export function usePropertyAmenityDelete({
  isAmenity,
  selectedRows,
  refreshTable,
  resetSelection,
  t,
}: UsePropertyAmenityDeleteProps): UsePropertyAmenityDeleteReturn {
  const { confirm } = useConfirm();

  const handleSingleDelete = useCallback(
    (item: SocietyAmenityDetailItem) => {
      confirm({
        variant: "delete",
        title: isAmenity
          ? t("createProperty.deleteAmenityConfirm")
          : t("createProperty.deletePropertyConfirm"),
        description: isAmenity
          ? t("createProperty.deleteSingleAmenityDesc")
          : t("createProperty.deleteSinglePropertyDesc"),
        onConfirm: async () => {
          const result = await deletePropertyAmenityAction(item.propertyId);
          if (result.success) {
            toast.success(
              isAmenity
                ? t("createProperty.amenityDeleteSuccess")
                : t("createProperty.propertyDeleteSuccess")
            );
            refreshTable();
          } else {
            toast.error(
              result.error ||
                (isAmenity
                  ? t("createProperty.failedToDeleteAmenity")
                  : t("createProperty.failedToDeleteProperty"))
            );
          }
        },
      });
    },
    [confirm, isAmenity, refreshTable, t]
  );

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedRows);
    confirm({
      variant: "delete",
      title: isAmenity
        ? t("createProperty.deleteSelectedAmenitiesTitle")
        : t("createProperty.deleteSelectedPropertiesTitle"),
      description: isAmenity
        ? t("createProperty.deleteSelectedAmenitiesDesc", { count: ids.length })
        : t("createProperty.deleteSelectedPropertiesDesc", { count: ids.length }),
      onConfirm: async () => {
        const result = await deleteMultiplePropertiesAmenitiesAction(ids);
        if (result.success) {
          toast.success(
            isAmenity
              ? t("createProperty.amenitiesDeletedSuccess", { count: ids.length })
              : t("createProperty.propertiesDeletedSuccess", { count: ids.length })
          );
          resetSelection();
          refreshTable();
        } else {
          toast.error(
            result.error ||
              (isAmenity
                ? t("createProperty.failedToDeleteSelectedAmenities")
                : t("createProperty.failedToDeleteSelectedProperties"))
          );
        }
      },
    });
  }, [confirm, isAmenity, refreshTable, resetSelection, selectedRows, t]);

  return {
    handleSingleDelete,
    handleBulkDelete,
  };
}
