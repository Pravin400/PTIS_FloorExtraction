"use client";

import { Settings, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SaveButton,
  CancelButton,
  Input
} from "@/components/common";
import { BulkUpdateFieldConfig, BulkUpdateMaster, SelectOption } from "@/types/common-details-update/common-details-update.types";
import { DynamicFormField } from "./DynamicFormField";
import { cn } from "@/lib/utils/cn";

interface BulkUpdateFormProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  selectedMenuItem: BulkUpdateMaster | undefined;
  fieldConfigs: BulkUpdateFieldConfig[];
  loadingConfigs: boolean;
  formValues: Record<string, string | number | boolean>;
  formErrors?: Record<string, string>;
  formWarnings?: Record<string, string>;
  formSubmitted: boolean;
  saving: boolean;
  selectedCount: number;
  onFieldChange: (fieldName: string, value: string | number | boolean) => void;
  onUpdate: () => void;
  onClear: () => void;
  showValidationStatus?: boolean;
  matchedProperties?: number;
  selectedFieldsCount?: number;
  optionsMap?: Record<string, SelectOption[]>;
  loadingMap?: Record<string, boolean>;
  hasMoreMap?: Record<string, boolean>;
  loadingMoreMap?: Record<string, boolean>;
  onFocus?: (fieldName: string) => void;
  onLoadMore?: (fieldName: string, searchQuery?: string) => void;
  onSearchChange?: (fieldName: string, searchQuery: string) => void;
}

export const BulkUpdateForm = ({
  t,
  selectedMenuItem,
  fieldConfigs,
  loadingConfigs,
  formValues,
  formErrors = {},
  formWarnings = {},
  formSubmitted,
  saving,
  selectedCount,
  onFieldChange,
  onUpdate,
  onClear,
  showValidationStatus = false,
  matchedProperties = 0,
  selectedFieldsCount = 0,
  optionsMap = {},
  loadingMap = {},
  hasMoreMap = {},
  loadingMoreMap = {},
  onFocus,
  onLoadMore,
  onSearchChange,
}: BulkUpdateFormProps) => {
  
  return (
    <Card
      variant="default"
      padding="none"
      className="border border-blue-200 rounded-xl shadow-sm flex flex-col h-full min-h-0"
    >
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-[#F8FAFF] rounded-t-xl mb-0 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold text-[#1E3A8A]">
            {t("newValues.title")}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {showValidationStatus && selectedFieldsCount > 0 && (
            <span className="text-xs text-gray-500">
              {selectedFieldsCount} {t("newValues.fieldsSelected")}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 overflow-y-auto">
        {!selectedMenuItem && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="w-10 h-10 mb-2 rounded-full bg-blue-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-500">{t("form.selectMenuPrompt")}</p>
          </div>
        )}

        {selectedMenuItem && loadingConfigs && fieldConfigs.length === 0 && (
          <div className="flex items-center justify-center h-full py-10">
            <p className="text-sm text-gray-400 animate-pulse">{t("loading.message")}</p>
          </div>
        )}

        {selectedMenuItem && !loadingConfigs && fieldConfigs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <p className="text-sm text-gray-500">{t("form.noFields")}</p>
          </div>
        )}

        {selectedMenuItem && (!loadingConfigs || fieldConfigs.length > 0) && fieldConfigs.length > 0 && (
          <div className={cn("space-y-3 transition-opacity", loadingConfigs ? "opacity-50 pointer-events-none" : "")}>
            {fieldConfigs.map((config) => {
              let overrideConfig = config;
              let options: SelectOption[] = [];

              if (config.bindApi || config.controlType === "dropdown" || config.controlType === "select") {
                overrideConfig = { ...config, controlType: "dropdown" };
                options = optionsMap[config.fieldName] || [];
              }

              return (
                <DynamicFormField
                  key={overrideConfig.fieldName}
                  config={overrideConfig}
                  value={formValues[overrideConfig.fieldName] ?? ""}
                  onChange={onFieldChange}
                  submitted={formSubmitted}
                  error={formErrors[overrideConfig.fieldName]}
                  warning={formWarnings[overrideConfig.fieldName]}
                  dropdownOptions={options}
                  isLoading={loadingMap[overrideConfig.fieldName]}
                  hasMore={hasMoreMap[overrideConfig.fieldName]}
                  isLoadingMore={loadingMoreMap[overrideConfig.fieldName]}
                  onFocus={() => onFocus?.(overrideConfig.fieldName)}
                  onLoadMore={(sq) => onLoadMore?.(overrideConfig.fieldName, sq)}
                  onSearchChange={(sq) => onSearchChange?.(overrideConfig.fieldName, sq)}
                />
              );
            })}
          </div>
        )}

        {/* Common Remarks Field */}
        {selectedMenuItem && !loadingConfigs && fieldConfigs.length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <Input
              label={t("form.remarks")}
              required
              type="text"
              placeholder={t("form.remarksPlaceholder")}
              value={String(formValues["remarks"] || "")}
              onChange={(e) => onFieldChange("remarks", e.target.value)}
              error={formSubmitted && !String(formValues["remarks"] || "").trim() ? (formErrors["remarks"] || t("messages.remarksRequired")) : formErrors["remarks"]}
              className="w-full"
              fullWidth
            />
          </div>
        )}
      </CardContent>
      {/* Validation Status & Actions */}
      {selectedMenuItem && !loadingConfigs && fieldConfigs.length > 0 && (
        <div className="border-t border-blue-200 bg-[#F8FAFF] px-4 py-3 rounded-b-xl shrink-0 space-y-3">
          {/* Validation Ready Status */}
          {showValidationStatus && selectedFieldsCount > 0 && matchedProperties > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-medium">{t("newValues.validationReady")}</span>
                <p className="text-xs text-blue-600">
                  {t("newValues.validationSummary", { fields: selectedFieldsCount, properties: matchedProperties.toLocaleString() })}
                </p>
              </div>
            </div>
          )}

          {/* Legacy: Selected properties count */}
          {!showValidationStatus && selectedCount > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {selectedCount} {selectedCount === 1 ? t("preview.property") : t("preview.properties")} {t("preview.selected")}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <CancelButton
              size="sm"
              label={t("form.clear")}
              onClick={onClear}
            />
            <SaveButton
              size="sm"
              label={saving ? t("form.updating") : t("form.update")}
              onClick={onUpdate}
              disabled={saving || selectedFieldsCount === 0 || selectedCount === 0 || !String(formValues["remarks"] || "").trim()}
            />
          </div>
        </div>
      )}
    </Card>
  );
};
