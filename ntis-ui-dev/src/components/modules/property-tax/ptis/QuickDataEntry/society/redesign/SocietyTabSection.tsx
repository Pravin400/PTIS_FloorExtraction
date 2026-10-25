/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { Input, PTISTransliteratedInput } from '@/components/common';
import { Label } from '@/components/common/label';
import {
  Building2,
  MapPin,
  Landmark,
  Tag,
  FileSpreadsheet,
  Crosshair,
  Grid,
  User,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  Home,
  UserCheck,
  Lock,
  Layers,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ApartmentQcWingDto } from '@/types/property-tax/apartment';
import type { ApartmentEditFormData, SectionWingScope } from './types';

interface SectionWingSelectorProps {
  sectionName: string;
  availableWings: ApartmentQcWingDto[];
  scope: SectionWingScope;
  onChangeScope: (scope: SectionWingScope) => void;
  accentColor?: 'blue' | 'emerald' | 'indigo' | 'purple';
}

const SectionWingSelector: React.FC<SectionWingSelectorProps> = ({
  sectionName,
  availableWings,
  scope,
  onChangeScope,
  accentColor = 'blue',
}) => {
  if (availableWings.length === 0) return null;

  const allWingIds = availableWings
    .map((w) => w.wingDetailId)
    .filter((id): id is number => typeof id === 'number');

  const handleToggleAll = (applyToAll: boolean) => {
    onChangeScope({
      applyToAll,
      selectedWingIds: applyToAll ? allWingIds : scope.selectedWingIds,
    });
  };

  const handleToggleWing = (wingId: number) => {
    const isCurrentlySelected = scope.selectedWingIds.includes(wingId);
    const newSelected = isCurrentlySelected
      ? scope.selectedWingIds.filter((id) => id !== wingId)
      : [...scope.selectedWingIds, wingId];

    onChangeScope({
      applyToAll: false,
      selectedWingIds: newSelected,
    });
  };

  const handleSelectAllWings = () => {
    onChangeScope({
      applyToAll: false,
      selectedWingIds: allWingIds,
    });
  };

  const handleClearAllWings = () => {
    onChangeScope({
      applyToAll: false,
      selectedWingIds: [],
    });
  };

  // Color mappings
  const colorMap = {
    blue: {
      bgActive: 'bg-blue-600 text-white shadow-xs',
      chipActive: 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs',
      textAccent: 'text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      borderFocus: 'border-blue-300',
    },
    emerald: {
      bgActive: 'bg-emerald-600 text-white shadow-xs',
      chipActive: 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs',
      textAccent: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      borderFocus: 'border-emerald-300',
    },
    indigo: {
      bgActive: 'bg-indigo-600 text-white shadow-xs',
      chipActive: 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs',
      textAccent: 'text-indigo-700',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      borderFocus: 'border-indigo-300',
    },
    purple: {
      bgActive: 'bg-purple-600 text-white shadow-xs',
      chipActive: 'bg-purple-600 border-purple-600 text-white font-bold shadow-xs',
      textAccent: 'text-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800',
      borderFocus: 'border-purple-300',
    },
  }[accentColor];

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 p-3 rounded-b-xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Apply {sectionName} to:
          </span>
        </div>

        {/* Segmented Scope Toggle */}
        <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleAll(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              scope.applyToAll
                ? colorMap.bgActive
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>All Wings (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleAll(false)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              !scope.applyToAll
                ? colorMap.bgActive
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>
              Selective Wings {!scope.applyToAll ? `(${scope.selectedWingIds.length})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Scope Status / Selection Content */}
      {scope.applyToAll ? (
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            <span>
              These {sectionName} details will automatically apply to all{' '}
              <strong className="font-bold text-slate-800">{availableWings.length} wings</strong> (
              {availableWings.map((w, idx) => w.wingName || w.wingNo || `Wing ${idx + 1}`).join(', ')}).
            </span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            All Wings
          </span>
        </div>
      ) : (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-100">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5">
              <span>Choose wings for {sectionName}:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colorMap.badgeBg}`}>
                {scope.selectedWingIds.length} of {availableWings.length} selected
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllWings}
                className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAllWings}
                className="text-[10.5px] font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Interactive Wing Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-0.5">
            {availableWings.map((wing, index) => {
              const wingId = wing.wingDetailId ?? index;
              const isSelected = scope.selectedWingIds.includes(wingId);
              const wingName = wing.wingName || wing.wingNo || `Wing ${index + 1}`;

              return (
                <button
                  type="button"
                  key={wingId}
                  onClick={() => handleToggleWing(wingId)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer select-none border ${
                    isSelected
                      ? colorMap.chipActive
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                      isSelected ? 'bg-white text-blue-700 border-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-blue-600" />}
                  </div>
                  <span className="font-semibold">{wingName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface SocietyTabSectionProps {
  formData: ApartmentEditFormData;
  onChange: <K extends keyof ApartmentEditFormData>(field: K, value: ApartmentEditFormData[K]) => void;
  fieldErrors?: Record<string, string>;
  touchedFields?: Record<string, boolean>;
  onBlur?: (field: keyof ApartmentEditFormData) => void;
  availableWings?: ApartmentQcWingDto[];
  societyWingScope?: SectionWingScope;
  onSocietyWingScopeChange?: (scope: SectionWingScope) => void;
  managerWingScope?: SectionWingScope;
  onManagerWingScopeChange?: (scope: SectionWingScope) => void;
  secretaryWingScope?: SectionWingScope;
  onSecretaryWingScopeChange?: (scope: SectionWingScope) => void;
}

export const SocietyTabSection: React.FC<SocietyTabSectionProps> = ({
  formData,
  onChange,
  fieldErrors = {},
  touchedFields = {},
  onBlur,
  availableWings = [],
  societyWingScope: _societyWingScope = { applyToAll: true, selectedWingIds: [] },
  onSocietyWingScopeChange: _onSocietyWingScopeChange,
  managerWingScope = { applyToAll: true, selectedWingIds: [] },
  onManagerWingScopeChange,
  secretaryWingScope = { applyToAll: true, selectedWingIds: [] },
  onSecretaryWingScopeChange,
}) => {
  const isFieldInvalid = (fieldKey: keyof ApartmentEditFormData): boolean => {
    return Boolean((touchedFields[fieldKey] || formData[fieldKey]) && fieldErrors[fieldKey]);
  };

  const getInputBorderClass = (fieldKey: keyof ApartmentEditFormData, base: string = 'h-8 text-xs font-medium'): string => {
    if (isFieldInvalid(fieldKey)) {
      return `${base} !border-red-500 !ring-1 !ring-red-500/40 !bg-red-50/20 text-slate-900 focus:!border-red-500 focus:!ring-red-300`;
    }
    return `${base} focus:border-blue-500`;
  };

  const renderFieldError = (fieldKey: keyof ApartmentEditFormData) => {
    if (!isFieldInvalid(fieldKey)) return null;
    return (
      <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium mt-1 leading-tight animate-in fade-in duration-150">
        <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
        <span>{fieldErrors[fieldKey]}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* ========================================================================= */}
      {/* SECTION 1: SOCIETY & PROPERTY DETAILS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs relative focus-within:z-30">
        <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Society Information
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">
            Basic, Location, Owner, Builder & Address
          </span>
        </div>

        <div className="p-3.5 space-y-2.5">
          <div className="grid grid-cols-12 gap-2.5 items-start">
            {/* ROW 1: Basic Information */}
            {/* 1. Society Name (Regional) (5 cols) */}
            <div className="col-span-12 md:col-span-5 space-y-1 relative focus-within:z-50">
              <Label htmlFor="soc-name" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Society Name (Regional)</span>
                  <span className="text-red-500 font-bold">*</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="soc-name"
                maxLength={100}
                value={formData.societyName}
                placeholder="Enter society name (Regional)"
                onChange={(e) => onChange('societyName', e.target.value)}
                onBlur={() => onBlur?.('societyName')}
                className={getInputBorderClass('societyName')}
              />
              {renderFieldError('societyName')}
            </div>

            {/* 2. Society Name (5 cols) */}
            <div className="col-span-12 md:col-span-5 space-y-1">
              <Label htmlFor="soc-name-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Society Name</span>
                </span>
              </Label>
              <Input
                id="soc-name-en"
                maxLength={100}
                value={formData.societyNameEnglish || ''}
                placeholder="Enter society name"
                onChange={(e) => onChange('societyNameEnglish', e.target.value)}
                onBlur={() => onBlur?.('societyNameEnglish')}
                className={getInputBorderClass('societyNameEnglish')}
              />
              {renderFieldError('societyNameEnglish')}
            </div>

            {/* 3. Property Description (2 cols) */}
            <div className="col-span-12 md:col-span-2 space-y-1">
              <Label htmlFor="prop-desc" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Description</span>
                </span>
                <span className="flex items-center text-[10px] text-slate-400 font-normal">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> View-only
                </span>
              </Label>
              <Input
                id="prop-desc"
                value={formData.propertyDescription || '—'}
                readOnly
                disabled
                title={formData.propertyDescription || 'Property Description'}
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none truncate"
              />
            </div>

            {/* ROW 2: Location & Zoning Identifiers (View Only) */}
            {/* 4. Division (3 cols) */}
            <div className="col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="prop-division" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Division</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View-only</span>
              </Label>
              <Input
                id="prop-division"
                value={formData.division || '—'}
                readOnly
                disabled
                title={formData.division || 'Division'}
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none truncate"
              />
            </div>

            {/* 5. Ward No. (2 cols) */}
            <div className="col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="prop-ward" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Landmark className="w-3 h-3 text-slate-400" />
                  <span>Ward No.</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View-only</span>
              </Label>
              <Input
                id="prop-ward"
                value={formData.wardNo || '—'}
                readOnly
                disabled
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none"
              />
            </div>

            {/* 6. Category (2 cols) */}
            <div className="col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="prop-category" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Category</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View-only</span>
              </Label>
              <Input
                id="prop-category"
                value={formData.category || '—'}
                readOnly
                disabled
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none truncate"
              />
            </div>

            {/* 7. Tax Zone & Name (2 cols) */}
            <div className="col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="prop-tax-zone" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                  <span>Tax Zone</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View-only</span>
              </Label>
              <Input
                id="prop-tax-zone"
                value={formData.taxZoneAndName || '—'}
                readOnly
                disabled
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none truncate"
              />
            </div>

            {/* 8. Sub Zone & CSN (2 cols) */}
            <div className="col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="prop-sub-zone" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <Crosshair className="w-3 h-3 text-slate-400" />
                  <span>Sub Zone & CSN</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View-only</span>
              </Label>
              <Input
                id="prop-sub-zone"
                value={formData.subZoneCsnNo || '—'}
                readOnly
                disabled
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none truncate"
              />
            </div>

            {/* 9. Plot No. (1 col) */}
            <div className="col-span-6 md:col-span-1 space-y-1">
              <Label htmlFor="prop-plot-no" className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-0.5 truncate">
                  <Grid className="w-3 h-3 text-slate-400" />
                  <span>Plot</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">View</span>
              </Label>
              <Input
                id="prop-plot-no"
                value={formData.plotNo || '—'}
                readOnly
                disabled
                className="h-8 text-xs font-medium bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none text-center"
              />
            </div>

            {/* ROW 3: Owner & Builder Names */}
            {/* 10. Land Owner Name (Regional) (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1 relative focus-within:z-50">
              <Label htmlFor="land-owner" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Land Owner Name (Regional)</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="land-owner"
                maxLength={100}
                value={formData.landOwnerName}
                placeholder="Enter land owner name (Regional)"
                onChange={(e) => onChange('landOwnerName', e.target.value)}
                onBlur={() => onBlur?.('landOwnerName')}
                className={getInputBorderClass('landOwnerName')}
              />
              {renderFieldError('landOwnerName')}
            </div>

            {/* 11. Land Owner Name (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="land-owner-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Land Owner Name</span>
                </span>
              </Label>
              <Input
                id="land-owner-en"
                maxLength={100}
                value={formData.landOwnerNameEnglish || ''}
                placeholder="Enter land owner name"
                onChange={(e) => onChange('landOwnerNameEnglish', e.target.value)}
                onBlur={() => onBlur?.('landOwnerNameEnglish')}
                className={getInputBorderClass('landOwnerNameEnglish')}
              />
              {renderFieldError('landOwnerNameEnglish')}
            </div>

            {/* 12. Builder Name (Regional) (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1 relative focus-within:z-50">
              <Label htmlFor="builder-name" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Builder Name (Regional)</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="builder-name"
                maxLength={100}
                value={formData.builderName}
                placeholder="Enter builder name (Regional)"
                onChange={(e) => onChange('builderName', e.target.value)}
                onBlur={() => onBlur?.('builderName')}
                className={getInputBorderClass('builderName')}
              />
              {renderFieldError('builderName')}
            </div>

            {/* 13. Builder Name (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="builder-name-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Builder Name</span>
                </span>
              </Label>
              <Input
                id="builder-name-en"
                maxLength={100}
                value={formData.builderNameEnglish || ''}
                placeholder="Enter builder name"
                onChange={(e) => onChange('builderNameEnglish', e.target.value)}
                onBlur={() => onBlur?.('builderNameEnglish')}
                className={getInputBorderClass('builderNameEnglish')}
              />
              {renderFieldError('builderNameEnglish')}
            </div>

            {/* ROW 4: Contacts & Addresses */}
            {/* 14. Builder Mobile No. (2 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="builder-mobile" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Builder Mobile</span>
                </span>
              </Label>
              <Input
                id="builder-mobile"
                type="tel"
                maxLength={10}
                value={formData.builderMobileNo || ''}
                placeholder="10-digit mobile"
                onChange={(e) => onChange('builderMobileNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => onBlur?.('builderMobileNo')}
                className={getInputBorderClass('builderMobileNo')}
              />
              {renderFieldError('builderMobileNo')}
            </div>

            {/* 15. Society Email (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="soc-email" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Society Email</span>
                </span>
              </Label>
              <Input
                id="soc-email"
                type="email"
                maxLength={100}
                value={formData.societyEmail}
                placeholder="e.g. society@example.com"
                onChange={(e) => onChange('societyEmail', e.target.value)}
                onBlur={() => onBlur?.('societyEmail')}
                className={getInputBorderClass('societyEmail')}
              />
              {renderFieldError('societyEmail')}
            </div>

            {/* 16. Society Address (Regional) (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-3 space-y-1 relative focus-within:z-50">
              <Label htmlFor="soc-address" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-sky-600" />
                  <span>Society Address (Regional)</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="soc-address"
                maxLength={250}
                value={formData.societyAddress}
                placeholder="Enter society address (Regional)"
                onChange={(e) => onChange('societyAddress', e.target.value)}
                onBlur={() => onBlur?.('societyAddress')}
                className={getInputBorderClass('societyAddress')}
              />
              {renderFieldError('societyAddress')}
            </div>

            {/* 17. Society Address (4 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 space-y-1">
              <Label htmlFor="soc-address-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-sky-600" />
                  <span>Society Address</span>
                </span>
              </Label>
              <Input
                id="soc-address-en"
                maxLength={250}
                value={formData.societyAddressEnglish || ''}
                placeholder="Enter society address"
                onChange={(e) => onChange('societyAddressEnglish', e.target.value)}
                onBlur={() => onBlur?.('societyAddressEnglish')}
                className={getInputBorderClass('societyAddressEnglish')}
              />
              {renderFieldError('societyAddressEnglish')}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MANAGER INFORMATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs relative focus-within:z-20">
        <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Manager Information
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">
            Manager identity and communication contacts
          </span>
        </div>

        <div className="p-3.5">
          <div className="grid grid-cols-12 gap-2.5 items-start">
            {/* Manager Name (Regional) (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1 relative focus-within:z-50">
              <Label htmlFor="mgr-name" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager Name (Regional)</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="mgr-name"
                maxLength={100}
                value={formData.managerName}
                placeholder="Enter manager name (Regional)"
                onChange={(e) => onChange('managerName', e.target.value)}
                onBlur={() => onBlur?.('managerName')}
                className={getInputBorderClass('managerName')}
              />
              {renderFieldError('managerName')}
            </div>

            {/* Manager Name (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="mgr-name-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager Name</span>
                </span>
              </Label>
              <Input
                id="mgr-name-en"
                maxLength={100}
                value={formData.managerNameEnglish || ''}
                placeholder="Enter manager name"
                onChange={(e) => onChange('managerNameEnglish', e.target.value)}
                onBlur={() => onBlur?.('managerNameEnglish')}
                className={getInputBorderClass('managerNameEnglish')}
              />
              {renderFieldError('managerNameEnglish')}
            </div>

            {/* Manager Mobile No. (2 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="mgr-mobile" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mobile No.</span>
                </span>
              </Label>
              <Input
                id="mgr-mobile"
                type="tel"
                maxLength={10}
                value={formData.managerMobileNo}
                placeholder="10-digit mobile"
                onChange={(e) => onChange('managerMobileNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => onBlur?.('managerMobileNo')}
                className={getInputBorderClass('managerMobileNo')}
              />
              {renderFieldError('managerMobileNo')}
            </div>

            {/* Manager Email Id (4 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1">
              <Label htmlFor="mgr-email" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager Email</span>
                </span>
              </Label>
              <Input
                id="mgr-email"
                type="email"
                maxLength={100}
                value={formData.managerEmail}
                placeholder="e.g. manager@example.com"
                onChange={(e) => onChange('managerEmail', e.target.value)}
                onBlur={() => onBlur?.('managerEmail')}
                className={getInputBorderClass('managerEmail')}
              />
              {renderFieldError('managerEmail')}
            </div>
          </div>
        </div>

        {/* Section 2 Wing Selector (Manager Info) */}
        {onManagerWingScopeChange && (
          <SectionWingSelector
            sectionName="Manager Info"
            availableWings={availableWings}
            scope={managerWingScope}
            onChangeScope={onManagerWingScopeChange}
            accentColor="indigo"
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SECRETARY INFORMATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs relative focus-within:z-10">
        <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Secretary Information
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">
            Secretary identity and representative contacts
          </span>
        </div>

        <div className="p-3.5">
          <div className="grid grid-cols-12 gap-2.5 items-start">
            {/* Secretary Name (Regional) (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1 relative focus-within:z-50">
              <Label htmlFor="sec-name" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secretary Name (Regional)</span>
                </span>
              </Label>
              <PTISTransliteratedInput
                id="sec-name"
                maxLength={100}
                value={formData.secretaryName}
                placeholder="Enter secretary name (Regional)"
                onChange={(e) => onChange('secretaryName', e.target.value)}
                onBlur={() => onBlur?.('secretaryName')}
                className={getInputBorderClass('secretaryName')}
              />
              {renderFieldError('secretaryName')}
            </div>

            {/* Secretary Name (3 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
              <Label htmlFor="sec-name-en" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secretary Name</span>
                </span>
              </Label>
              <Input
                id="sec-name-en"
                maxLength={100}
                value={formData.secretaryNameEnglish || ''}
                placeholder="Enter secretary name"
                onChange={(e) => onChange('secretaryNameEnglish', e.target.value)}
                onBlur={() => onBlur?.('secretaryNameEnglish')}
                className={getInputBorderClass('secretaryNameEnglish')}
              />
              {renderFieldError('secretaryNameEnglish')}
            </div>

            {/* Secretary Mobile No. (2 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1">
              <Label htmlFor="sec-mobile" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile No.</span>
                </span>
              </Label>
              <Input
                id="sec-mobile"
                type="tel"
                maxLength={10}
                value={formData.secretaryMobileNo}
                placeholder="10-digit mobile"
                onChange={(e) => onChange('secretaryMobileNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => onBlur?.('secretaryMobileNo')}
                className={getInputBorderClass('secretaryMobileNo')}
              />
              {renderFieldError('secretaryMobileNo')}
            </div>

            {/* Secretary Email Id (4 cols) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1">
              <Label htmlFor="sec-email" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secretary Email</span>
                </span>
              </Label>
              <Input
                id="sec-email"
                type="email"
                maxLength={100}
                value={formData.secretaryEmail}
                placeholder="e.g. secretary@example.com"
                onChange={(e) => onChange('secretaryEmail', e.target.value)}
                onBlur={() => onBlur?.('secretaryEmail')}
                className={getInputBorderClass('secretaryEmail')}
              />
              {renderFieldError('secretaryEmail')}
            </div>
          </div>
        </div>

        {/* Section 3 Wing Selector (Secretary Info) */}
        {onSecretaryWingScopeChange && (
          <SectionWingSelector
            sectionName="Secretary Info"
            availableWings={availableWings}
            scope={secretaryWingScope}
            onChangeScope={onSecretaryWingScopeChange}
            accentColor="emerald"
          />
        )}
      </div>
    </div>
  );
};

