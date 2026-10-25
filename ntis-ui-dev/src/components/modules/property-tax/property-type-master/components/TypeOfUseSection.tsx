"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/common";
import { SelectAllButton, ClearButton } from "@/components/common/ActionButtons";
import { Checkbox } from "@/components/common/checkbox";
import { cn } from "@/lib/utils/cn";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";
import type { UseType } from "@/types/typeOfUse.types";

interface TypeOfUseSectionProps {
  typeOfUseList: UseType[];
  selectedTypeOfUseIds: Set<number>;
  initialTypeOfUseIds: Set<number>;
  selectedTypeValue?: string;
  onToggle: (touId: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (...args: any[]) => string;
  typeOfUseLabel?: string;
}

export const TypeOfUseSection = ({
  typeOfUseList,
  selectedTypeOfUseIds,
  initialTypeOfUseIds,
  selectedTypeValue,
  onToggle,
  onSelectAll,
  onClearAll,
  t,
  typeOfUseLabel,
}: TypeOfUseSectionProps) => {
  const typeOfUse = typeOfUseLabel || t("aliasFallback.typeOfUse");
  // --- Search & filter state ---
  const [touSearchTerm, setTouSearchTerm] = useState("");
  const [manualTouType, setManualTouType] = useState<string>("ALL");
  const [prevSelectedTypeValue, setPrevSelectedTypeValue] = useState<string | undefined>(undefined);

  // Sync manual filter with left-side form selection, but allow manual overrides afterwards
  if (selectedTypeValue !== prevSelectedTypeValue) {
    setPrevSelectedTypeValue(selectedTypeValue);
    const normalizedType = String(selectedTypeValue ?? "").trim().toUpperCase();
    const syncableTypes = new Set(["R", "C", "I", "N"]);
    
    if (syncableTypes.has(normalizedType)) {
      setManualTouType(normalizedType);
    } else {
      setManualTouType("ALL");
    }
  }

  const effectiveTouType = manualTouType;

  // Sanitize search input
  const sanitizeSearchText = (value: string) => {
    return value.replace(TEXT_SANITIZE, '');
  };

  // Compute unique type options from the list
  const touTypeOptions = useMemo(() => {
    const types = new Set(typeOfUseList.map(item => item.type).filter(Boolean));
    return ["ALL", ...Array.from(types)];
  }, [typeOfUseList]);

  // Filtered list based on search and type filter, sorted with initial items first
  const filteredTypeOfUseList = useMemo(() => {
    const filtered = typeOfUseList.filter((item) => {
      const matchesSearch =
        !touSearchTerm ||
        item.description.toLowerCase().includes(touSearchTerm.toLowerCase()) ||
        item.typeOfUseCode.toLowerCase().includes(touSearchTerm.toLowerCase());

      const matchesType =
        effectiveTouType === "ALL" || item.type === effectiveTouType;

      return matchesSearch && matchesType;
    });

    // Sort: initial items first, then the rest in their original order
    return filtered.sort((a, b) => {
      const aIsInitial = initialTypeOfUseIds.has(a.typeOfUseId);
      const bIsInitial = initialTypeOfUseIds.has(b.typeOfUseId);

      if (aIsInitial && !bIsInitial) return -1;
      if (!aIsInitial && bIsInitial) return 1;
      return 0; // Preserve original order for items in same category
    });
  }, [typeOfUseList, touSearchTerm, effectiveTouType, initialTypeOfUseIds]);

  return (
    <div className="flex flex-col h-full min-h-[300px] max-h-[750px] md:min-h-[400px] lg:min-h-[500px] overflow-y-auto">
      <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 flex flex-col h-full">

        {/* Header */}
        <div className="p-4 border-b border-[#DCEAFF] bg-white/50 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700">
              {t("form.typeOfUseSection.title", { typeOfUse })}
            </label>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {t("form.typeOfUseSection.selected", { count: selectedTypeOfUseIds.size })}
            </span>
          </div>

          <div className="flex gap-4 items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("form.typeOfUseSection.search")}
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder={t("form.typeOfUseSection.searchPlaceholder")}
                  value={touSearchTerm}
                  onChange={(e) => {
                    const sanitized = sanitizeSearchText(e.target.value);
                    setTouSearchTerm(sanitized);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-700"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("form.typeOfUseSection.typeLabel", { typeOfUse })}
              </label>
              <Select
                value={effectiveTouType}
                placeholder={t("form.typeOfUseSection.allTypes")}
                options={touTypeOptions.map((type) => ({
                  label: type === "ALL" ? t("form.typeOfUseSection.allTypes") : type,
                  value: type,
                }))}
                onChange={(_, value) => setManualTouType(value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <SelectAllButton
              onClick={onSelectAll}
              label={t("form.typeOfUseSection.selectAll")}
              size="xs"
              className="flex-1"
            />
            <ClearButton
              onClick={onClearAll}
              label={t("form.typeOfUseSection.clear")}
              size="xs"
              className="flex-1"
            />
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {typeOfUseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-sm">{t("form.typeOfUseSection.noItems", { typeOfUse })}</span>
            </div>
          ) : filteredTypeOfUseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-sm">{t("form.typeOfUseSection.noMatches")}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTypeOfUseList.map((item) => {
                const isChecked = selectedTypeOfUseIds.has(item.typeOfUseId);
                return (
                  <label
                    key={item.typeOfUseId}
                    onClick={() => onToggle(item.typeOfUseId)}
                    tabIndex={0} // Add this to make the label focusable
                    onKeyDown={(e) => {
                      // Add keyboard support for Enter and Space keys
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); // Prevent page scroll on Space
                        onToggle(item.typeOfUseId);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border shadow-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", // Add focus styles
                      isChecked
                        ? "bg-blue-50/50 border-blue-200"
                        : "bg-white hover:border-blue-200 border-gray-200"
                    )}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggle(item.typeOfUseId)}
                        aria-label={item.typeOfUseCode}
                        className={isChecked ? 'data-[state=checked]:text-blue-600' : ''}
                        tabIndex={-1}
                      />
                    </div>

                    {/* ID Badge */}
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide shrink-0",
                      isChecked
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {item.typeOfUseCode}
                    </span>

                    {/* Description */}
                    <span className={cn(
                      "text-sm truncate min-w-0 flex-1",
                      isChecked ? "text-gray-900 font-medium" : "text-gray-600"
                    )}>
                      {item.description}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-[#DCEAFF] bg-white/50 text-center shrink-0">
          <p className="text-[10px] text-gray-400">
            {t("form.typeOfUseSection.hint", { typeOfUse })}
          </p>
        </div>
      </div>
    </div>
  );
};
