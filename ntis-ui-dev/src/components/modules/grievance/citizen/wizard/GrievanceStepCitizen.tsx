'use client';

/**
 * Grievance Step 3: Citizen Contact & 1-Tap Submit
 * Path: src/components/modules/grievance/citizen/wizard/GrievanceStepCitizen.tsx
 */

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, ShieldCheck, MapPin, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { GrievanceFormErrors } from '@/lib/utils/grievance/citizen-form-validation';
import { CitizenContactSection } from '../CitizenContactSection';

interface GrievanceStepCitizenProps {
  fullName: string;
  mobile: string;
  errors: GrievanceFormErrors;
  onFullNameChange: (val: string) => void;
  onMobileChange: (val: string) => void;
  clearFieldError: (field: keyof GrievanceFormErrors) => void;
  selectedDeptName?: string;
  defectType?: string;
  roadLandmark?: string;
  isSubmitting: boolean;
  editTicket?: unknown;
  onBack: () => void;
}

export function GrievanceStepCitizen({
  fullName,
  mobile,
  errors,
  onFullNameChange,
  onMobileChange,
  clearFieldError,
  selectedDeptName,
  defectType,
  roadLandmark,
  isSubmitting,
  editTicket,
  onBack,
}: GrievanceStepCitizenProps) {
  const t = useTranslations('grievance');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col justify-between space-y-3 sm:space-y-4"
    >
      <div className="space-y-3.5">
      {/* Mini Summary Strip */}
      {(selectedDeptName || defectType || roadLandmark) && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-[10px] space-y-1 text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Building2 className="w-3 h-3 text-green-600 shrink-0" />
            <span className="truncate">{selectedDeptName || 'Department'} • {defectType || 'Issue'}</span>
          </div>
          {roadLandmark && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{roadLandmark}</span>
            </div>
          )}
        </div>
      )}

      {/* Citizen Contact Inputs */}
      <CitizenContactSection
        fullName={fullName}
        mobile={mobile}
        errors={errors}
        onFullNameChange={onFullNameChange}
        onMobileChange={onMobileChange}
        clearFieldError={clearFieldError}
      />

      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 font-medium px-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{t('mobileSecurityNote')}</span>
      </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBack}
          icon={ArrowLeft}
          className="text-xs font-bold border-slate-200 cursor-pointer active:scale-95 shrink-0"
        >
          {t('back')}
        </Button>

        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
          <Button
            variant="success"
            size="sm"
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            icon={CheckCircle2}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {editTicket ? t('saveChanges') : t('submitGrievance')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
