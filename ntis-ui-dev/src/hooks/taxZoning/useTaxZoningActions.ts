"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import {
  createTaxZoningAction,
  updateTaxZoningAction,
} from "@/app/[locale]/property-tax/taxzone-master/taxzoning/actions";
import { ZoningRecord, PreviewRow, Ward } from "@/types/taxzoning.types";
import { PagedResponse } from "@/types/common.types";

export const useTaxZoningActions = (
  t: (key: string, values?: Record<string, string | number>) => string,
  wardLabel?: string
) => {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleUpdate = async ({
    zone,
    ward,
    previewData,
    onSuccess
  }: {
    zone: string;
    ward: string[];
    previewData: PreviewRow[];
    records: ZoningRecord[];
    wardsData: PagedResponse<Ward>;
    onSuccess: () => void;
  }) => {
    try {
      setSaving(true);

      if (ward.length === 1) {
        const payload = {
          taxZoneId: Number(zone),
          wardId: Number(ward[0]),
          propertyNo: "",
          fromProperty: previewData[0].propertyNo,
          toProperty: previewData[previewData.length - 1].propertyNo,
          isActive: true,
          updatedBy: 1,
          propertyId: 0,
        };

        const result = await updateTaxZoningAction(payload);
        if (!result.success) {
          toast.error(t(result.message));
          return;
        }
        toast.success(t(result.message));
      } else {
        const validWards: string[] = [...ward];

        let successCount = 0;
        let errorCount = 0;
        for (const wardId of validWards) {
          try {
            const payload = {
              taxZoneId: Number(zone),
              wardId: Number(wardId),
              propertyNo: "", fromProperty: "", toProperty: "",
              isActive: true, updatedBy: 1, propertyId: 0,
            };
            const result = await updateTaxZoningAction(payload);
            if (result.success) successCount++; else errorCount++;
          } catch (_err) { errorCount++; }
        }

        if (successCount > 0 && errorCount === 0) {
          toast.success(`${t('messages.dbOperationCompleted')} ${successCount} ${t('messages.wardsUpdatedSuccessfully', { ward: wardLabel ?? '' })}`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.warning(`${successCount} ${t('messages.wardsUpdatedSuccessfully', { ward: wardLabel ?? '' })}, ${errorCount} ${t('messages.wardsFailed', { ward: wardLabel ?? '' })}`);
        } else {
          toast.error(t('messages.updateFailed'));
          return;
        }
      }

      router.refresh();
      onSuccess();
    } catch (error) {
      logger.error("Tax zoning update failed", { zone, ward, error: error as Error });
      toast.error(t('messages.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (importedChanges: ZoningRecord[], clearImported: () => void) => {
    if (!importedChanges.length) {
      toast.error(t('messages.noChanges'));
      return;
    }

    try {
      setSaving(true);
      let newCount = 0, updateCount = 0, errorCount = 0;

      for (const row of importedChanges) {
        try {
          const payload = {
            taxZoneId: row.taxZoneId,
            wardId: row.wardId,
            propertyNo: "",
            fromProperty: row.fromProperty,
            toProperty: row.toProperty,
            isActive: true,
            updatedBy: 1,
            propertyId: 0,
          };

          logger.info(`[BulkUpdate] ${row.status} -> ward:${row.wardId} from:${row.fromProperty} to:${row.toProperty} taxZone:${row.taxZoneId}`);


          const result = row.status === "New"
            ? await createTaxZoningAction(payload)
            : await updateTaxZoningAction(payload);

          if (result.success) {
            if (row.status === "Updated") updateCount++; else newCount++;
          } else {
            logger.error(`[BulkUpdate] FAILED ${row.status} ward:${row.wardId}`, { message: result.message });
            errorCount++;
          }
        } catch (err) {
          logger.error(`[BulkUpdate] EXCEPTION ${row.status} ward:${row.wardId}`, { error: err as Error });
          errorCount++;
        }
      }

      if (newCount > 0 || updateCount > 0) {
        let message = "";
        if (newCount > 0 && updateCount > 0) {
          message = `${t('messages.dbOperationCompleted')} ${newCount} ${t('messages.newRecordsCreatedAnd')} ${updateCount} ${t('messages.recordsUpdatedSuccessfully')}`;
        } else if (newCount > 0) {
          message = `${t('messages.dbOperationCompleted')} ${newCount} ${t('messages.newRecordsCreated')}`;
        } else if (updateCount > 0) {
          message = `${t('messages.dbOperationCompleted')} ${updateCount} ${t('messages.recordsUpdatedSuccessfully')}`;
        }

        if (errorCount > 0) {
          message += `. ${errorCount} ${t('messages.recordsFailed')}`;
          toast.warning(message);
        } else {
          toast.success(message);
        }

        clearImported();
        setTimeout(() => router.refresh(), 1000);
      } else {
        toast.error(t('messages.noRecordsProcessed'));
      }
    } catch (err) {
      logger.error("Bulk update critical error", { error: err as Error });
      toast.error(t('messages.criticalError'));
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleUpdate, handleBulkUpdate };
};
