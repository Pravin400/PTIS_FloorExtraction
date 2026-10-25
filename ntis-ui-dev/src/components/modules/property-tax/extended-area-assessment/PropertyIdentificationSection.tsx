import { Search, RotateCcw } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Input, Select, SearchSelect, IconButton, Button, Tooltip } from "@/components/common";
import type { SingleAssessmentForm, SelectOption } from "@/types/extended-area-assessment.types";
import type { UseCascadingPropertyFilters } from "@/hooks/extendedAreaAssessment/useCascadingPropertyFilters";

interface PropertyIdentificationSectionProps {
  t: ReturnType<typeof useTranslations>;
  form: SingleAssessmentForm;
  setField: <K extends keyof SingleAssessmentForm>(key: K, value: SingleAssessmentForm[K]) => void;
  usageTypeOptions: SelectOption[];
  isSearching: boolean;
  onSearch: (value: string, field: "upic" | "oldGpNo") => void;
  onSearchAny: () => void;
  filters: UseCascadingPropertyFilters;
  /** True once a property has been resolved via the UPIC/Old GP Number search — the Ward/Property
   *  No cascading dropdowns are an alternate lookup path and are disabled while that result is in
   *  effect, to avoid the two search paths fighting over which property is "selected". */
  searchLocked: boolean;
  /** Clears the search fields, cascading dropdown selections, and the resolved result — same
   *  action as the "Reset" button at the bottom of the form, offered here too for convenience. */
  onReset: () => void;
}

/** "Property Identification" — UPIC/Old GP search, Ward/Property/Partition cascading dropdowns,
 *  and the read-only Owner/Address/Use Type/Zone fields that get filled in once a property is found. */
export function PropertyIdentificationSection({
  t,
  form,
  setField,
  usageTypeOptions,
  isSearching,
  onSearch,
  onSearchAny,
  filters,
  searchLocked,
  onReset,
}: PropertyIdentificationSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-1.5">
        <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
          {t("section.propertyIdentification")}
        </h3>
        <IconButton
          icon={RotateCcw}
          type="button"
          title={t("actions.reset")}
          onClick={onReset}
        />
      </div>
      <div className="grid grid-cols-2 items-end gap-2.5">
        <Input
          label={t("fields.upic")}
          fullWidth
          value={form.upic}
          onChange={(e) => setField("upic", e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch(form.upic, "upic");
            }
          }}
        />
        <Tooltip content={form.oldGpNo}>
          <Input
            label={t("fields.oldGpNo")}
            fullWidth
            value={form.oldGpNo}
            onChange={(e) => setField("oldGpNo", e.target.value.replace(/[^a-zA-Z0-9,/]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearch(form.oldGpNo, "oldGpNo");
              }
            }}
          />
        </Tooltip>

        <div className="col-span-2 sm:col-span-1">
          <SearchSelect
            label={t("fields.ward")}
            options={filters.wardOptions.filter((o) => o.value !== "")}
            placeholder={filters.wardOptions[0]?.label}
            value={filters.selectedWardId}
            isLoading={filters.isLoadingWards}
            disabled={searchLocked}
            onChange={(_name, v) => void filters.handleWardChange(v)}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <SearchSelect
            label={t("fields.propertyNo")}
            options={filters.propertyOptions.filter((o) => o.value !== "")}
            placeholder={filters.propertyOptions[0]?.label}
            value={filters.selectedPropertyId}
            disabled={searchLocked || !filters.selectedWardId}
            isLoading={filters.isLoadingProperties}
            onChange={(_name, v) => filters.handlePropertyChange(v)}
          />
        </div>

        <div className="col-span-2">
          <Button
            type="button"
            variant="primary"
            icon={Search}
            iconPosition="left"
            disabled={isSearching}
            onClick={onSearchAny}
            className="w-full justify-center"
          >
            {t("actions.searchProperty")}
          </Button>
        </div>

        <div className="col-span-2">
          <Input
            label={t("fields.ownerName")}
            fullWidth
            disabled
            value={form.ownerName}
            onChange={(e) => setField("ownerName", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          {/* Wrapped in a plain (non-disabled) div — a native `disabled` input suppresses
              mouseenter/mouseleave entirely, so the Tooltip must attach to this wrapper
              instead of the disabled Input itself, or hover never fires. */}
          <Tooltip content={form.address}>
            <div>
              <Input
                label={t("fields.address")}
                fullWidth
                disabled
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
          </Tooltip>
        </div>
        <Select
          label={t("fields.useType")}
          options={usageTypeOptions}
          value={form.useType}
          disabled
          onChange={(_e, v) => setField("useType", v)}
        />
        <Tooltip content={form.zone}>
          <div>
            <Input
              label={t("fields.zone")}
              disabled
              value={form.zone}
              onChange={(e) => setField("zone", e.target.value)}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
