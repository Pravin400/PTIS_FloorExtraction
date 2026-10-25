"use client";

import { memo } from "react";
import { Building2, Check } from "lucide-react";
import { SearchInput, SelectAllButton, ClearButton } from "@/components/common";
import type { OwningDepartmentOption } from "@/types/asset-masters/user-department-allocation.types";

interface UserAllocationStep1DepartmentProps {
  filteredDepts: OwningDepartmentOption[];
  selectedDeptIds: number[];
  deptSearch: string;
  setDeptSearch: (val: string) => void;
  toggleDept: (id: number) => void;
  selectAllDepts: () => void;
  clearAllDepts: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationStep1Department = memo(function UserAllocationStep1Department({
  filteredDepts,
  selectedDeptIds,
  deptSearch,
  setDeptSearch,
  toggleDept,
  selectAllDepts,
  clearAllDepts,
  t,
}: UserAllocationStep1DepartmentProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span className="inline-flex items-center">
              <span>{t("drawer.step1Title")}</span>
              <span className="text-red-500 font-bold ml-0.5 leading-none">*</span>
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{t("drawer.step1Description")}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <SelectAllButton
            label={t("drawer.selectAll")}
            onClick={selectAllDepts}
            size="xs"
            disabled={filteredDepts.length === 0}
            className="w-fit"
          />
          <ClearButton
            label={t("drawer.clearAll")}
            onClick={clearAllDepts}
            size="xs"
            disabled={selectedDeptIds.length === 0}
            className="w-fit"
          />
        </div>
      </div>

      <SearchInput
        value={deptSearch}
        onChange={(val) => setDeptSearch(val)}
        placeholder={t("drawer.searchDepartmentsPlaceholder")}
        className="w-full text-slate-900"
      />

      {filteredDepts.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-300">
          {t("drawer.noDepartmentsAvailable")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredDepts.map((dept) => {
            const isSelected = selectedDeptIds.some((id) => Number(id) === Number(dept.id));
            return (
              <div
                key={dept.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => toggleDept(dept.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleDept(dept.id);
                  }
                }}
                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group min-h-[56px] ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/50 shadow-xs ring-1 ring-blue-900/20"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isSelected ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-xs truncate leading-tight">
                      {dept.owningDepartmentName}
                    </p>
                    {dept.description ? (
                      <p className="text-[10.5px] text-slate-500 line-clamp-1 truncate mt-0.5 leading-tight">
                        {dept.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ml-1.5 ${
                    isSelected
                      ? "border-blue-900 bg-blue-900 text-white shadow-xs"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
