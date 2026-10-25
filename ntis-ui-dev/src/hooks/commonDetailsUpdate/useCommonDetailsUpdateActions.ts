import { useState, useCallback } from "react";
import { useToast } from "@/components/common";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import {
  BulkUpdateFieldConfig,
  PropertyPreviewRow,
  WingOption,
  PropertyFilterParams,
  PropertyFilterByCategoryParams,
  BulkUpdatePayload,
  BulkUpdateResponse,
  SelectOption,
  CommonDetailsUpdateActions,
} from "@/types/common-details-update/common-details-update.types";
import { ScopeOption } from "@/lib/api/common-details-update/common-details-update.service";
import { PagedResponse } from "@/types/common.types";

import { isConstructionYearField, isAssessmentYearField } from "@/hooks/commonDetailsUpdate/useUpdateFieldsValidation";

/**
 * Cleans backend error messages for display in toasts.
 * Removes internal bracket tags (e.g. [ASSESSMENT_YEAR]), transaction rollback boilerplate text,
 * and hides internal property IDs (e.g. Property 2075125:) to prevent exposing DB IDs to users.
 * Adapts error message text appropriately for Construction Year vs Assessment Year context.
 */
export function formatCleanServerError(rawMessage?: string, fieldConfigs?: BulkUpdateFieldConfig[]): string {
  if (!rawMessage) return "";
  let cleaned = String(rawMessage).trim();

  const hasConstructionTag = /\[CONSTRUCTION_YEAR\]/i.test(rawMessage);
  const hasAssessmentTag = /\[ASSESSMENT_YEAR\]/i.test(rawMessage);

  const isConstructionContext =
    (hasConstructionTag && !hasAssessmentTag) ||
    (fieldConfigs &&
      fieldConfigs.some(f => isConstructionYearField(f.fieldName, f.displayName)) &&
      !fieldConfigs.some(f => isAssessmentYearField(f.fieldName, f.displayName)));

  // 2. If message contains a specific error detail after "Property <id>:", extract the actual error statement
  const propertyMatch = cleaned.match(/Property\s+\d+:\s*(.+)/i);
  if (propertyMatch && propertyMatch[1]) {
    cleaned = propertyMatch[1].trim();
  }

  // 3. Strip transaction rollback boilerplate text
  cleaned = cleaned.replace(
    /Transaction rolled back\s*—\s*no properties were updated\.\s*\d+ of \d+ processed before the error\(s\) occurred\.\s*but all changes were reverted\.\s*/gi,
    ""
  );

  // 4. Strip any bracketed code prefixes like [ASSESSMENT_YEAR] or [CONSTRUCTION_YEAR]
  cleaned = cleaned
    .replace(/^(\[[^\]]+\]\s*)+/g, "")
    .replace(/\[[^\]]+\]\s*/g, "")
    .trim();

  // 5. Hide internal database Property ID references if still present
  cleaned = cleaned.replace(/^Property\s+\d+:\s*/gi, "").trim();

  // 6. If in Construction Year context, rephrase "Assessment Year cannot be less than Construction Year" to "Construction Year cannot be greater than Assessment Year"
  if (isConstructionContext && /Assessment Year cannot be less than Construction Year/i.test(cleaned)) {
    cleaned = "Construction Year cannot be greater than Assessment Year.";
  }

  // 7. Capitalize first character
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

export const useCommonDetailsUpdateActions = (
  t: (key: string, values?: Record<string, string | number>) => string,
  actions: Partial<CommonDetailsUpdateActions>
) => {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const loadFieldConfigs = useCallback(async (
    updateCode: string,
    onSuccess: (configs: BulkUpdateFieldConfig[]) => void
  ) => {
    try {
      if (!actions.getFieldConfigsAction) return;
      const result = await actions.getFieldConfigsAction(updateCode);
      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        toast.error(t("messages.fetchFieldConfigFailed"));
      }
    } catch {
      toast.error(t("messages.configLoadFailed"));
    }
  }, [t, actions, toast]);

  const loadProperties = useCallback(async (
    params: PropertyFilterParams,
    onSuccess: (data: PagedResponse<PropertyPreviewRow>) => void
  ) => {
    try {
      if (!actions.getFilteredPropertiesAction) return;
      const result = await actions.getFilteredPropertiesAction(params);
      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        toast.error(result.error || t("messages.fetchPropertiesFailed"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("messages.fetchPropertiesFailed"));
    }
  }, [t, actions, toast]);

  const loadPreviewListByCategory = useCallback(async (
    params: PropertyFilterByCategoryParams,
    onSuccess: (data: PagedResponse<PropertyPreviewRow>) => void
  ) => {
    try {
      if (!actions.getPreviewListByCategoryAction) {
        onSuccess({ items: [], totalCount: 0, pageNumber: 1, pageSize: params.PageSize || 10, totalPages: 0, hasPrevious: false, hasNext: false });
        return;
      }
      if (!params.UpdateCode || (Array.isArray(params.UpdateCode) && params.UpdateCode.length === 0)) {
        onSuccess({ items: [], totalCount: 0, pageNumber: 1, pageSize: params.PageSize || 10, totalPages: 0, hasPrevious: false, hasNext: false });
        return;
      }
      const result = await actions.getPreviewListByCategoryAction(params);
      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        toast.error(result.error || t("messages.fetchPropertiesFailed"));
        onSuccess({ items: [], totalCount: 0, pageNumber: 1, pageSize: params.PageSize || 10, totalPages: 0, hasPrevious: false, hasNext: false });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("messages.fetchPropertiesFailed"));
      onSuccess({ items: [], totalCount: 0, pageNumber: 1, pageSize: params.PageSize || 10, totalPages: 0, hasPrevious: false, hasNext: false });
    }
  }, [t, actions, toast]);

  const loadWings = useCallback(async (
    wardId: number,
    onSuccess: (wings: WingOption[]) => void
  ) => {
    try {
      if (!actions.getWingsAction) return;
      const result = await actions.getWingsAction(wardId);
      if (result.success && result.data) {
        onSuccess(result.data);
      }
    } catch {
      // Wings are optional — silently ignore
    }
  }, [actions]);

  const loadAllWards = useCallback(async (
    zoneId: number | undefined,
    onSuccess: (wards: SelectOption[]) => void
  ) => {
    try {
      if (!actions.getAllWardsAction) return;
      const result = await actions.getAllWardsAction(zoneId);
      if (result.success && result.data) {
        const items = result.data.items || [];
        const options: SelectOption[] = items.map((ward: { id: number; wardNo: string }) => ({
          label: ward.wardNo,
          value: String(ward.id),
        }));
        onSuccess(options);
      } else {
        logger.warn("Failed to load wards");
        onSuccess([]);
      }
    } catch (error) {
      logger.error("Failed to load all wards", { error: error as Error });
      onSuccess([]);
    }
  }, [actions]);

  const loadPropertiesByWard = useCallback(async (
    wardId: number,
    updateCode: string,
    onSuccess: (properties: SelectOption[]) => void
  ) => {
    try {
      if (!actions.getPropertiesByWardAction) return;
      const result = await actions.getPropertiesByWardAction(wardId, updateCode);
      if (result.success && result.data) {
        const items = result.data.items || [];
        const options: SelectOption[] = items.map((prop: { propertyNo: string; partitionNo?: string }) => {
          const normalizedPartitionNo = String(prop.partitionNo ?? "").trim();
          const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
          const displayValue = hasPartition
            ? `${prop.propertyNo}-${normalizedPartitionNo}`
            : prop.propertyNo;
          return {
            label: displayValue,
            value: displayValue,
          };
        });
        onSuccess(options);
      } else {
        logger.warn("Failed to load properties by ward");
        onSuccess([]);
      }
    } catch (error) {
      logger.error("Failed to load properties by ward", { error: error as Error });
      onSuccess([]);
    }
  }, [actions]);

  const loadPropertiesByCategory = useCallback(async (
    searchCategory: number,
    zoneId: number | undefined,
    wardId: number,
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    propertyFrom?: string,
    onSuccess?: (data: PagedResponse<{ propertyId: number; propertyNo: string; partitionNo: string }>) => void
  ) => {
    try {
      if (!actions.getPropertiesByCategoryAction) return;
      const result = await actions.getPropertiesByCategoryAction(
        searchCategory,
        zoneId,
        wardId,
        pageNumber,
        pageSize,
        searchTerm,
        propertyFrom
      );
      if (result.success && result.data) {
        onSuccess?.(result.data);
      } else {
        logger.warn("Failed to load properties by category");
        onSuccess?.({
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 0,
          totalPages: 0,
          hasPrevious: false,
          hasNext: false,
        });
      }
    } catch (error) {
      logger.error("Failed to load properties by category", { error: error as Error });
      onSuccess?.({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });
    }
  }, [actions]);

  const loadAllWings = useCallback(async (
    onSuccess: (wings: SelectOption[]) => void
  ) => {
    try {
      if (!actions.getAllWingsAction) return;
      const result = await actions.getAllWingsAction();
      if (result.success && result.data) {
        const items = result.data.items || [];
        const options: SelectOption[] = items.map((wing: { id: number; wingNo: string }) => ({
          label: wing.wingNo,
          value: String(wing.id),
        }));
        onSuccess(options);
      } else {
        logger.warn("Failed to load wings");
        onSuccess([]);
      }
    } catch (error) {
      logger.error("Failed to load all wings", { error: error as Error });
      onSuccess([]);
    }
  }, [actions]);

  const loadScopeOptions = useCallback(async (
    onSuccess: (options: ScopeOption[]) => void
  ) => {
    try {
      if (!actions.getScopeOptionsAction) return;
      const result = await actions.getScopeOptionsAction();
      if (result.success && result.data) {
        onSuccess(result.data);
      } else {
        onSuccess([]);
      }
    } catch (error) {
      logger.error("Failed to load scope options", { error: error as Error });
      onSuccess([]);
    }
  }, [actions]);

  const loadScopeCategoryOptions = useCallback(async (
    categoryId: number,
    onSuccess: (option: ScopeOption) => void
  ) => {
    try {
      if (!actions.getScopeCategoryOptionsAction) return;
      const result = await actions.getScopeCategoryOptionsAction(categoryId);
      if (result.success && result.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      logger.error("Failed to load scope category options", { error: error as Error });
    }
  }, [actions]);

  const loadAllZones = useCallback(async (
    onSuccess: (zones: SelectOption[]) => void
  ) => {
    try {
      if (!actions.getAllZonesAction) return;
      const result = await actions.getAllZonesAction();
      if (result.success && result.data) {
        const items = result.data.items || [];
        const options: SelectOption[] = items.map((zone: { id: number; zoneNo: string; description?: string | null }) => ({
          label: zone.description || zone.zoneNo,
          value: String(zone.id),
        }));
        onSuccess(options);
      } else {
        logger.warn("Failed to load zones");
        onSuccess([]);
      }
    } catch (error) {
      logger.error("Failed to load all zones", { error: error as Error });
      onSuccess([]);
    }
  }, [actions]);

  const handleBulkUpdate = useCallback(async (
    apiRoute: string,
    payload: BulkUpdatePayload | BulkUpdatePayload[],
    onSuccess: () => void
  ): Promise<BulkUpdateResponse | null> => {
    setSaving(true);
    try {
      if (!actions.executeBulkUpdateAction) return null;
      const result = await actions.executeBulkUpdateAction({ apiRoute, payload });

      if (result.success && result.data) {
        const response = result.data as BulkUpdateResponse;

        if (response.success === false) {
          const cleanErr = formatCleanServerError(response.message);
          toast.error(cleanErr || t("messages.updateFailed"));
          return response;
        }

        let successMessage = response.message || t("messages.updateSuccess");

        // Enhance default backend message format: "Processed X update item(s): Y properties updated successfully"
        const match = successMessage.match(/Processed (\d+) update item\(s\):\s*(\d+) properties updated successfully/i);
        if (match) {
          const numProperties = Array.isArray(payload)
            ? payload[0]?.propertyIds?.length
            : payload.propertyIds?.length;

          successMessage = t("messages.processedGroupsSuccess", {
            groups: match[1],
            properties: numProperties !== undefined ? String(numProperties) : match[2]
          });
        }

        toast.success(successMessage);

        const itemsList = Array.isArray(response.items) ? response.items : (response.items ? [response.items] : []);
        const totalFailed = itemsList.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.failedCount) || 0), 0);
        const totalSuccess = itemsList.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.successCount) || 0), 0);

        if (totalFailed > 0) {
          toast.warning(t("messages.partialUpdate", {
            success: totalSuccess,
            failed: totalFailed
          }));
        }

        router.refresh();
        onSuccess();
        return response;
      } else if (!result.success) {
        toast.error(formatCleanServerError(result.error) || t("messages.updateFailed"));
      }
      return null;
    } catch (error) {
      logger.error("Bulk update failed", { apiRoute, error: error as Error });
      toast.error(t("messages.somethingWrong"));
      return null;
    } finally {
      setSaving(false);
    }
  }, [t, router, actions, toast]);

  return {
    saving,
    loadFieldConfigs,
    loadProperties,
    loadPreviewListByCategory,
    loadWings,
    loadAllWards,
    loadPropertiesByWard,
    loadPropertiesByCategory,
    loadAllWings,
    loadScopeOptions,
    loadScopeCategoryOptions,
    loadAllZones,
    handleBulkUpdate,
  };
};
