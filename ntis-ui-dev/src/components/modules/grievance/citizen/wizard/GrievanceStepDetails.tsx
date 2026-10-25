'use client';

/**
 * Grievance Step 2: Department, Defect, Location & Description
 * Path: src/components/modules/grievance/citizen/wizard/GrievanceStepDetails.tsx
 *
 * 100% Built with Common Components from `@/components/common`:
 * - Row 1: Department & Defect Type side-by-side
 * - Row 2: Road Name / Landmark with GPS auto-detect
 * - Row 3: Grievance Description with Voice speech-to-text
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Mic,
  ArrowRight,
  ArrowLeft,
  Building2,
  Layers,
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Button,
  TextArea,
  Label,
  Input,
  SearchSelect,
  type SearchSelectOption,
} from '@/components/common';
import type { MunicipalDepartment } from '@/types/grievance';
import type { ResolvedCitizenPlace } from '@/lib/services/grievance';
import type { GrievanceFormErrors } from '@/lib/utils/grievance/citizen-form-validation';

interface GrievanceStepDetailsProps {
  selectedDept: MunicipalDepartment | null;
  departments: MunicipalDepartment[];
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  defectType?: string;
  setDefectType: (defect: string) => void;
  defectTypes: Array<{ id?: string | number; grievanceType: string }>;
  roadLandmark: string;
  setRoadLandmark: (val: string) => void;
  locationCoords: ResolvedCitizenPlace | null;
  isDetectingLocation: boolean;
  autoDetectLocation: (force?: boolean) => void;
  description: string;
  setDescription: (val: string) => void;
  isVoiceActive: boolean;
  handleToggleVoice: () => void;
  isAiRefining?: boolean;
  errors: GrievanceFormErrors;
  clearFieldError: (field: keyof GrievanceFormErrors) => void;
  onBack: () => void;
  onContinue: () => void;
}

const stripAsterisk = (str: string) => str.replace(/\*+$/, '').trim();

export function GrievanceStepDetails({
  selectedDept,
  departments,
  onSelectDepartment,
  defectType,
  setDefectType,
  defectTypes,
  roadLandmark,
  setRoadLandmark,
  locationCoords,
  isDetectingLocation,
  autoDetectLocation,
  description,
  setDescription,
  isVoiceActive,
  handleToggleVoice,
  isAiRefining = false,
  errors,
  clearFieldError,
  onBack,
  onContinue,
}: GrievanceStepDetailsProps) {
  const t = useTranslations('grievance');

  // SearchSelect options directly from API
  const departmentOptions: SearchSelectOption[] = useMemo(() => {
    return departments.map((dept) => ({
      value: String(dept.id),
      label: dept.nameEn || `Department ${dept.id}`,
    }));
  }, [departments]);

  // SearchSelect options for defect types directly from API
  const defectTypeOptions: SearchSelectOption[] = useMemo(() => {
    return defectTypes.map((type) => ({
      value: type.grievanceType,
      label: type.grievanceType,
    }));
  }, [defectTypes]);

  const handleDepartmentDropdown = (_name: string, value: string) => {
    const matched = departments.find((dept) => String(dept.id) === value);
    if (matched) {
      onSelectDepartment(matched);
      clearFieldError('department');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-full flex flex-col justify-between space-y-2.5 sm:space-y-3.5"
    >
      <div className="space-y-2.5 sm:space-y-3">
        {/* Row 1: Department & Defect Type Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-start">
          {/* 1. Department Searchable Dropdown */}
          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
                <Building2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="truncate">{t('department')}</span>
              </Label>
            </div>

            <SearchSelect
              id="grievance-department-select"
              name="department"
              options={departmentOptions}
              value={selectedDept ? String(selectedDept.id) : ''}
              onChange={handleDepartmentDropdown}
              placeholder={t('selectDepartmentPlaceholder')}
              emptyMessage={t('noDeptFound')}
              error={errors.department}
              className="text-xs font-semibold rounded-xl border-slate-200 h-9"
            />
          </div>

          {/* 2. Defect Type Searchable Dropdown */}
          <div className="space-y-1">
            <div className="h-5 flex items-center">
              <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
                <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{stripAsterisk(t('defectType'))}</span>
              </Label>
            </div>

            <SearchSelect
              id="grievance-defect-type-select"
              name="defectType"
              options={defectTypeOptions}
              value={defectType || ''}
              onChange={(_name, value) => {
                setDefectType(value);
                if (errors.defectType) clearFieldError('defectType');
              }}
              placeholder={stripAsterisk(t('defectType'))}
              disabled={!selectedDept || defectTypes.length === 0}
              error={errors.defectType}
              className="text-xs font-semibold rounded-xl border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Row 2: Road Name / Landmark with Header GPS Button */}
        <div className="space-y-1">
          <div className="h-5 flex items-center justify-between gap-1">
            <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{t('roadLandmark')}</span>
            </Label>

            <Button
              type="button"
              variant={locationCoords ? 'success' : 'secondary'}
              size="xs"
              onClick={() => {
                autoDetectLocation(true);
                clearFieldError('roadLandmark');
              }}
              disabled={isDetectingLocation}
              icon={isDetectingLocation ? Loader2 : Crosshair}
              className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer shrink-0 active:scale-95 ${
                locationCoords
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                  : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
              }`}
              title={t('autoDetectGps')}
            >
              <span>{isDetectingLocation ? `${t('locateMe')}...` : t('locateMe')}</span>
            </Button>
          </div>

          <Input
            type="text"
            value={roadLandmark}
            onChange={(e) => {
              setRoadLandmark(e.target.value);
              if (errors.roadLandmark) clearFieldError('roadLandmark');
            }}
            placeholder={t('roadLandmarkPlaceholder')}
            error={errors.roadLandmark}
            className={`w-full bg-white text-xs h-9 px-3 rounded-xl transition-all shadow-2xs ${
              locationCoords ? 'border-emerald-300 ring-1 ring-emerald-400/20' : 'border-slate-200'
            }`}
          />

          {locationCoords && (
            <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-[9.5px] font-bold truncate animate-in fade-in duration-150">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate flex-1">
                {locationCoords.placeName || t('liveGpsPrefix')} ({locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)})
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Grievance Description Full Width */}
        <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-1 sm:space-y-1.5 w-full">
          <div className="flex items-center justify-between">
            <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
              <FileText className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="truncate">{stripAsterisk(t('grievanceDescription'))}</span>
            </Label>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant={isVoiceActive ? 'danger' : 'secondary'}
                size="xs"
                onClick={handleToggleVoice}
                icon={Mic}
                className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer active:scale-95 ${
                  isVoiceActive ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span>{isVoiceActive ? t('voiceListening') : t('voice')}</span>
              </Button>
            </div>
          </div>

          <TextArea
            rows={2}
            maxLength={1000}
            showCharCount={true}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) clearFieldError('description');
            }}
            placeholder={t('descriptionPlaceholder')}
            error={Boolean(errors.description)}
            errorMessage={errors.description}
            className="text-xs bg-white rounded-xl p-2.5 text-slate-800 resize-none w-full border-slate-200"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 shrink-0">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBack}
          icon={ArrowLeft}
          className="text-xs font-bold border-slate-200 cursor-pointer active:scale-95"
        >
          {t('back')}
        </Button>

        <Button
          type="button"
          variant="success"
          size="sm"
          onClick={onContinue}
          disabled={isAiRefining}
          isLoading={isAiRefining}
          icon={isAiRefining ? Loader2 : ArrowRight}
          iconPosition="right"
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
        >
          <span>{isAiRefining ? t('aiRefining') : t('saveAndNext')}</span>
        </Button>
      </div>
    </motion.div>
  );
}
