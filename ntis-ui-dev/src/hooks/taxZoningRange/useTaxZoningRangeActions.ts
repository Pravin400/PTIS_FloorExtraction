"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import {
  createTaxZoningRangeAction,
  updateTaxZoningRangeAction,
  bulkUpsertTaxZoningRangesAction,
} from "@/app/[locale]/property-tax/taxzoningmaster/actions";
import {
  CreateTaxZoningRangePayload,
  TaxZoningRangeFormModel,
} from "@/types/taxZoningRange.types";

export function useTaxZoningRangeActions(t: (key: string, values?: Record<string, string | number>) => string) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const buildPayload = (form: TaxZoningRangeFormModel): CreateTaxZoningRangePayload => ({
    wardIds: form.wardIds,
    taxZoneId: Number(form.taxZoneId),
    assignEntireWard: form.wardIds.length > 1 ? true : form.assignEntireWard,
    fromPropertyNo: form.wardIds.length > 1 ? undefined : form.fromPropertyNo || undefined,
    toPropertyNo: form.wardIds.length > 1 ? undefined : form.toPropertyNo || undefined,
    zoneDescription: form.zoneDescription.trim(),
  });

  const handleSave = async (form: TaxZoningRangeFormModel, onSuccess?: () => void) => {
    setSaving(true);
    try {
      const payload = buildPayload(form);

      const result = form.id
        ? await updateTaxZoningRangeAction(form.id, {
            wardId: payload.wardIds[0],
            taxZoneId: payload.taxZoneId,
            assignEntireWard: payload.assignEntireWard,
            fromPropertyNo: payload.fromPropertyNo,
            toPropertyNo: payload.toPropertyNo,
            zoneDescription: payload.zoneDescription,
          })
        : await createTaxZoningRangeAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      toast.success(result.message || t("messages.saveSuccess"));
      router.refresh();
      onSuccess?.();
      return true;
    } catch (error) {
      logger.error("Tax zoning range save failed", { error: error as Error });
      toast.error(t("messages.somethingWrong"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleBulkApply = async (rows: CreateTaxZoningRangePayload[], onSuccess?: () => void) => {
    if (!rows.length) {
      toast.error(t("messages.noChanges"));
      return false;
    }
    setSaving(true);
    try {
      const result = await bulkUpsertTaxZoningRangesAction(rows);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      const { successCount, failedCount } = result.data;
      if (successCount > 0 && failedCount === 0) {
        toast.success(`${successCount} ${t("messages.recordsUpdatedSuccessfully")}`);
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(`${successCount} ${t("messages.recordsUpdatedSuccessfully")}, ${failedCount} ${t("messages.recordsFailed")}`);
      } else {
        toast.error(t("messages.noRecordsProcessed"));
        return false;
      }
      router.refresh();
      onSuccess?.();
      return true;
    } catch (error) {
      logger.error("Tax zoning range bulk apply failed", { error: error as Error });
      toast.error(t("messages.criticalError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleSave, handleBulkApply };
}
