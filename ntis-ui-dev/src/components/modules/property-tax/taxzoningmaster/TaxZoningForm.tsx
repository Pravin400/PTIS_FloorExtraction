"use client";

import { MapPin, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle, Select, ValidationMessage, SaveButton, CancelButton } from "@/components/common";
import { MultiSelectDropdown } from "@/components/common/Dropdown";
import {TaxZoningFormProps } from "@/types/taxzoning.types";
import { Label } from "@/components/common/label";

export const TaxZoningForm = ({
  t,
  zone,
  setZone,
  zoneOptions,
  isTaxZoneValid,
  submitted,
  ward,
  setWard,
  wardOptions,
  isWardValid,
  fromProps,
  setFromProps,
  toProps,
  setToProps,
  propertyOptionsByWard,
  isPropertyValid,
  isPropertyRangeValid,
  saving,
  isFormValid,
  handleSubmit,
  onClear,
  wardLabel,
  taxZoneLabel,
}: TaxZoningFormProps) => {
  return (
    <form onSubmit={handleSubmit}>
      <Card
        variant="default"
        padding="none"
        className="border border-blue-200 rounded-xl shadow-sm h-[400px] flex flex-col"
      >
        <CardHeader className="flex items-center gap-2 px-4 py-3 border-b bg-[#F8FAFF] rounded-t-xl mb-0">
          <MapPin className="w-4 h-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold text-[#1E3A8A]">
            {t('form.update')} {t('title')}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>
                {t('form.taxZone', { taxZone: taxZoneLabel ?? '' })}
              </Label>
              <Select
                value={zone}
                onChange={(_, val) => setZone(val)}
                options={zoneOptions}
                placeholder={t('form.selectTaxZone', { taxZone: taxZoneLabel ?? '' })}
              />
              <ValidationMessage
                visible={submitted && !isTaxZoneValid}
                message={t('messages.taxZoneRequired', { taxZone: taxZoneLabel ?? '' })}
              />
            </div>

            <div>
              <Label required>
                {t('form.ward', { ward: wardLabel ?? '' })}
              </Label>
              <div className={cn(!zone && "opacity-60 cursor-not-allowed pointer-events-none")}>
                <MultiSelectDropdown
                  options={wardOptions}
                  value={ward}
                  onChange={setWard}
                  placeholder={zone ? t('form.selectWard', { ward: wardLabel ?? '' }) : t('form.selectTaxZone', { taxZone: taxZoneLabel ?? '' })}
                  className="text-gray-700"
                />
              </div>
              <ValidationMessage
                visible={submitted && !isWardValid}
                message={t('messages.wardRequired', { ward: wardLabel ?? '' })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                {t('form.fromProperty')}
              </Label>
              <Select
                value={fromProps}
                onChange={(_, val) => setFromProps(val)}
                options={propertyOptionsByWard}
                placeholder={t('form.selectFromProperty')}
                disabled={ward.length !== 1}
              />
            </div>

            <div>
              <Label>
                {t('form.toProperty')}
              </Label>
              <Select
                value={toProps}
                onChange={(_, val) => setToProps(val)}
                options={propertyOptionsByWard}
                placeholder={t('form.selectToProperty')}
                disabled={ward.length !== 1}
              />
            </div>
          </div>

          {ward.length === 1 && fromProps && toProps && !isPropertyRangeValid && (
            <ValidationMessage
              visible={true}
              message={t('messages.fromPropertyMustBeSmallerThanToProperty')}
            />
          )}

          {ward.length === 1 && submitted && !isPropertyValid && isPropertyRangeValid && (
            <ValidationMessage
              visible={true}
              message={t('messages.propertyRequired')}
            />
          )}

          {ward.length > 1 && (
            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <Eye className="w-4 h-4 mt-0.5" />
              <div>
                <p className="font-semibold">{t('preview.multipleWardsSelected')}</p>
                <p>
                  {t('preview.multipleWardsMessage')}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t bg-[#F8FAFF] px-4 py-3 rounded-b-xl">
          <div className="grid grid-cols-2 gap-3">
            <SaveButton
              type="submit"
              label={saving ? t('form.updating') : t('form.update')}
              className="w-full"
              disabled={!isFormValid || saving}
            />
            <CancelButton
              label={t('form.clearImported')}
              className="w-full"
              onClick={onClear}
            />
          </div>
        </div>
      </Card>
    </form>
  );
};
