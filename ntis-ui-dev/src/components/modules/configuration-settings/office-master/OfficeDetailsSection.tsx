import React from "react";
import { Input, Select } from "@/components/common";
import type { OfficeFormModel } from "@/types/office.types";
import { getOfficeTypeOptions } from "@/config/office-master.config";
import { Calendar } from "lucide-react";

interface OfficeDetailsSectionProps {
  formData: OfficeFormModel;
  errors: Partial<Record<keyof OfficeFormModel, string>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  showError: (name: keyof OfficeFormModel) => boolean;
  t: (key: string) => string;
}

export function OfficeDetailsSection({ 
  formData, 
  errors, 
  handleChange, 
  handleBlur, 
  showError, 
  t 
}: OfficeDetailsSectionProps) {
  const establishedDateRef = React.useRef<HTMLInputElement>(null);

  const triggerDatePicker = () => {
    if (establishedDateRef.current) {
      try {
        if (typeof establishedDateRef.current.showPicker === 'function') {
          establishedDateRef.current.showPicker();
        } else {
          establishedDateRef.current.click();
        }
      } catch (_e) {
        establishedDateRef.current.click();
      }
    }
  };

  const convertDDMMYYYYToYYYYMMDD = (val: string) => {
    if (!val) return "";
    const parts = val.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ymd = e.target.value;
    if (!ymd) {
      const mockEvent = {
        target: {
          name: "establishedDate",
          value: ""
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(mockEvent);
      return;
    }
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const dmy = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const mockEvent = {
        target: {
          name: "establishedDate",
          value: dmy
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(mockEvent);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 dark:bg-slate-800/10 dark:border-slate-800">
        <h3 className="font-semibold text-slate-800">{t("form.detailsSection")}</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("form.fields.officeCode.label")}
            required
            name="officeCode"
            value={formData.officeCode || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={showError("officeCode") ? errors.officeCode : undefined}
            placeholder={t("form.fields.officeCode.placeholder")}
            maxLength={6}
          />

          <Input
            label={t("form.fields.officeName.label")}
            required
            name="officeName"
            value={formData.officeName || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={showError("officeName") ? errors.officeName : undefined}
            placeholder={t("form.fields.officeName.placeholder")}
            maxLength={100}
          />

          <Select
            label={t("form.fields.type.label")}
            name="type"
            value={formData.type || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={showError("type") ? errors.type : undefined}
            options={getOfficeTypeOptions(t)}
            placeholder={t("form.fields.type.placeholder")}
          />

          <div className="flex flex-col">
            <label className="mb-1.5 text-sm font-medium text-gray-700">
              {t("form.fields.establishedDate.label")}
            </label>
            <div className="relative">
              <Input
                type="date"
                ref={establishedDateRef}
                naked
                tabIndex={-1}
                className="absolute inset-0 opacity-0 pointer-events-none"
                value={convertDDMMYYYYToYYYYMMDD(formData.establishedDate || "")}
                onChange={handleDateChange}
              />
              <Input
                type="text"
                naked
                name="establishedDate"
                value={formData.establishedDate || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="DD-MM-YYYY"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 transition-colors placeholder:text-gray-400 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  showError("establishedDate") && errors.establishedDate
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              />
              <Calendar
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                onClick={triggerDatePicker}
              />
            </div>
            {showError("establishedDate") && errors.establishedDate && (
              <span className="mt-1 text-sm text-red-600">
                {errors.establishedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
