"use client";

import React, { useState, useMemo } from "react";
import { Layers } from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  Checkbox,
  MultiSelectDropdown,
  ClearButton,
  SelectAllButton,
  SearchInput,
  Label,
} from "@/components/common";
import { useTranslations } from "next-intl";
import { useQueryTransition } from "@/hooks/useQueryTransition";
import { cn } from "@/lib/utils/cn";
import { SEARCH_ALPHANUMERIC_SANITIZE } from "@/lib/utils/validation-rules";
import { LockedScreen, ModuleItem } from "@/types/lockunlock.types";

interface ScreenSelectionCardProps {
  screens: LockedScreen[];
  modules?: ModuleItem[];
  selectedScreenIds: number[];
  setSelectedScreenIds: React.Dispatch<React.SetStateAction<number[]>>;
}

export function ScreenSelectionCard({
  screens = [],
  modules = [],
  selectedScreenIds = [],
  setSelectedScreenIds,
}: ScreenSelectionCardProps) {
  const t = useTranslations("lockUnlock");
  const { updateQueries, searchParams } = useQueryTransition();

  const screenSearchFromUrl = searchParams.get("screenSearch") || "";
  const moduleIdFromUrl = searchParams.get("moduleId") || "ALL";

  const [searchTerm, setSearchTerm] = useState(screenSearchFromUrl);

  const selectedModuleIds = useMemo(() => {
    if (!moduleIdFromUrl || moduleIdFromUrl === "ALL") return [];
    return moduleIdFromUrl.split(",");
  }, [moduleIdFromUrl]);

  // Helper function to extract a clean group/module prefix from screenCode
  const getScreenModule = (code: string) => {
    if (!code) return "OTHERS";
    const underscoreIndex = code.indexOf("_");
    if (underscoreIndex > 0) {
      return code.substring(0, underscoreIndex).toUpperCase();
    }
    if (code.match(/^S\d+$/i)) return "SYSTEM";
    if (code.length <= 5) return code.toUpperCase();
    return "GENERAL";
  };

  // Generate unique module classifications for dropdown from modules API
  const moduleOptions = useMemo(() => {
    return modules
      .map((m) => {
        const label = m.moduleLabel && m.moduleName
          ? `${m.moduleLabel} - ${m.moduleName}`
          : m.moduleLabel || m.moduleName || m.moduleCode;
        return {
          label,
          value: String(m.id),
          tooltip: m.moduleDescription || label,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [modules]);

  // Derived list of filtered screens based on inputs
  const filteredScreens = useMemo(() => {
    return screens.filter((screen) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (screen.screenName && screen.screenName.toLowerCase().includes(searchLower)) ||
        (screen.screenNameLocal && screen.screenNameLocal.toLowerCase().includes(searchLower)) ||
        (screen.screenCode && screen.screenCode.toLowerCase().includes(searchLower)) ||
        (screen.moduleLabel && screen.moduleLabel.toLowerCase().includes(searchLower)) ||
        (screen.moduleName && screen.moduleName.toLowerCase().includes(searchLower)) ||
        (screen.moduleNameLocal && screen.moduleNameLocal.toLowerCase().includes(searchLower));
      
      return matchesSearch;
    });
  }, [screens, searchTerm]);

  // Select or Unselect all currently visible filtered screens
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredScreens.map((s) => s.id);
    setSelectedScreenIds((prev) => {
      const allSelected = filteredIds.length > 0 && filteredIds.every((id) => prev.includes(id));
      if (allSelected) {
        // Unselect all filtered items
        return prev.filter((id) => !filteredIds.includes(id));
      } else {
        // Select all filtered items
        const uniqueIds = new Set([...prev, ...filteredIds]);
        return Array.from(uniqueIds);
      }
    });
  };

  // Clear selection on currently visible filtered screens only and reset view filters
  const handleClearAllFiltered = () => {
    const filteredIds = new Set(filteredScreens.map((s) => s.id));
    setSelectedScreenIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    setSearchTerm("");
    updateQueries({ moduleId: null });
  };

  return (
    <div className="flex flex-col gap-1">
      <CardHeader className="mb-0 border border-slate-100 rounded-md bg-slate-50/50 py-3.5 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <CardTitle className="text-sm font-bold text-slate-800">
              {t("screenSelectionCard.title")}
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-2">
            {t("screenSelectionCard.helperText")}
          </p>
        </div>
        <span className="inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {t("screenSelectionCard.selectedCount", { count: selectedScreenIds.length })}
        </span>
      </CardHeader>
      <CardContent className="py-4 pb-1 space-y-1">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              const sanitized = val.replace(SEARCH_ALPHANUMERIC_SANITIZE, "");
              setSearchTerm(sanitized);
            }}
            placeholder={t("screenSelectionCard.searchPlaceholder")}
            className="!mb-0 flex-1 w-full"
            showClear={true}
          />
          <div className="w-full sm:w-[240px]">
            <MultiSelectDropdown
              options={moduleOptions}
              value={selectedModuleIds}
              onChange={(values) => {
                setSelectedScreenIds([]);
                updateQueries({ moduleId: values.length > 0 ? values.join(",") : null });
              }}
              placeholder={t("screenSelectionCard.typeOfUse") || "All Types"}
            />
          </div>
          {/* Bulk Selection Actions */}
          <div className="flex gap-3">
            <SelectAllButton
              label={t("screenSelectionCard.selectAll")}
              onClick={handleSelectAllFiltered}
              disabled={screens.length === 0}
              className="w-fit"
              size="sm"
            />
            <ClearButton
              label={t("screenSelectionCard.clearAll")}
              onClick={handleClearAllFiltered}
              disabled={screens.length === 0}
              className="w-fit"
              size="sm"
            />
          </div>
        </div>

        {/* Screen List */}
        <div className="border border-slate-200/80 rounded-xl p-2 bg-slate-50/20 max-h-[220px] overflow-auto custom-scrollbar">
          {screens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("screenSelectionCard.noScreens")}</p>
          ) : filteredScreens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("screenSelectionCard.noScreens")}</p>
          ) : (
            <div className="w-full">
              <div className={cn("grid gap-2", filteredScreens.length > 3 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                {filteredScreens.map((screen) => {
                  const isChecked = selectedScreenIds.includes(screen.id);
                  const badgeCode = getScreenModule(screen.screenCode);
                  return (
                    <div
                      key={screen.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isChecked}
                      onClick={() => {
                        setSelectedScreenIds((prev) =>
                          isChecked
                            ? prev.filter((id) => id !== screen.id)
                            : [...prev, screen.id]
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedScreenIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== screen.id)
                              : [...prev, screen.id]
                          );
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none w-full",
                        isChecked
                          ? "border-blue-200 bg-blue-50/10 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30"
                      )}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          id={`screen-${screen.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setSelectedScreenIds((prev) =>
                              checked
                                ? [...prev, screen.id]
                                : prev.filter((id) => id !== screen.id)
                            );
                          }}
                          className={isChecked ? "data-[state=checked]:text-blue-600" : ""}
                        />
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider min-w-[36px] justify-center shrink-0">
                        {screen.moduleLabel && screen.moduleName
                          ? `${screen.moduleLabel} - ${screen.moduleName}`
                          : screen.moduleLabel || screen.moduleName || screen.moduleCode || badgeCode}
                      </span>
                      <Label
                        htmlFor={`screen-${screen.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm font-semibold text-slate-700 truncate cursor-pointer"
                      >
                        {screen.screenName}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
