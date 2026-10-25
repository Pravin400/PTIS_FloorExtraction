/**
 * On-The-Go Grievance Main View (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/admin/on-the-go/OnTheGoGrievanceView.tsx
 *
 * Compact executive and field officer grievance intake form.
 * Uses shared `@/components/common` primitives: Button, TextArea, Input, Checkbox.
 * Line ceiling: <= 300 lines.
 */

'use client';

import { useEffect, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle, Camera, X, Check, Send, UserCheck, Phone, User, CheckCircle2, Mic,
} from 'lucide-react';
import { Button, Input, TextArea, Checkbox } from '@/components/common';
import { OnTheGoSuccessModal } from './OnTheGoSuccessModal';
import { OnTheGoAssignmentSection } from './OnTheGoAssignmentSection';
import { useOnTheGoGrievanceForm } from '@/hooks/grievance/admin/useOnTheGoGrievanceForm';
import { useOnTheGoOfficers } from '@/hooks/grievance/admin/useOnTheGoOfficers';
import { useGrievanceVoiceDictation } from '@/hooks/grievance/citizen/useGrievanceVoiceDictation';
import { sanitizeCitizenName, resolveGrievanceTypeItem } from '@/lib/utils/grievance/citizen-form-validation';
import { getTrackingUrl } from '@/lib/services/grievance/tracking-storage.service';

interface OnTheGoGrievanceViewProps {
  className?: string;
}

export function OnTheGoGrievanceView({ className = '' }: OnTheGoGrievanceViewProps) {
  const t = useTranslations('grievance');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    values, errors, isSubmitting, isDraftSaved, submissionResult,
    addPhotos, removePhoto, setDescription, setZoneId, setWardNumber,
    setDepartmentId, setGrievanceTypeId, setOfficerUserId, setIsCitizenReported,
    setAdditionalField, saveDraft, submitForm, resetForm,
  } = useOnTheGoGrievanceForm();

  const { isVoiceActive, handleToggleVoice } = useGrievanceVoiceDictation({
    onTranscript: (cleanText) => setDescription(values.description ? `${values.description} ${cleanText}` : cleanText),
    listeningToastText: t('voiceListening'),
    t,
  });

  const { zones, departments, categories, officers } = useOnTheGoOfficers(
    values.zoneId,
    values.wardNumber,
    values.departmentId
  );

  const activeZone = zones.find((z) => z.id === values.zoneId);
  const activeOfficer = officers.find((o) => Number(o.id) === Number(values.officerUserId));

  // Auto-resolve category from description keywords if not manually chosen
  useEffect(() => {
    if (!values.grievanceTypeId && categories.length > 0 && values.description?.trim().length >= 4) {
      const match = resolveGrievanceTypeItem(values.description, categories as unknown as Parameters<typeof resolveGrievanceTypeItem>[1]);
      if (match?.id) setGrievanceTypeId(match.id);
    }
  }, [values.description, categories, values.grievanceTypeId, setGrievanceTypeId]);

  // Synchronize department selection if previously selected department is not in list
  useEffect(() => {
    if (departments.length > 0 && values.departmentId && !departments.some((d) => String(d.id) === String(values.departmentId))) {
      setDepartmentId(null);
    }
  }, [departments, values.departmentId, setDepartmentId]);

  // Synchronize officer selection if previously selected officer is not in list
  useEffect(() => {
    if (officers.length > 0 && values.officerUserId && !officers.some((o) => Number(o.id) === Number(values.officerUserId))) {
      setOfficerUserId(null);
    }
  }, [officers, values.officerUserId, setOfficerUserId]);

  const handleTrackGrievance = () => {
    if (!submissionResult?.trackingToken) return;
    router.push(getTrackingUrl(submissionResult.trackingToken));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className={`flex-1 w-full flex flex-col font-sans ${className}`}>
      <main className="flex-1 max-w-6xl w-full mx-auto space-y-3 sm:space-y-4">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t('newGrievance')}
        </h1>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {errors.general && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Two-Column Form Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start">
            {/* Left Column: Issue details, Photos, Description & Citizen Info */}
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {t('issueDetails')}
              </h2>

              {/* Photos Strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">{t('photosOptional')}</label>
                  <span className="text-[11px] text-slate-400">{values.photos.length}/5</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {values.photos.map((item) => (
                    <div key={item.id} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-slate-200 overflow-hidden shrink-0 group bg-slate-100 shadow-2xs">
                      <Image src={item.previewUrl} alt="Evidence" fill className="object-cover" sizes="80px" unoptimized />
                      {!isSubmitting && (
                        <button type="button" onClick={() => removePhoto(item.id)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors" aria-label="Remove photo">
                          <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  ))}
                  {values.photos.length < 5 && !isSubmitting && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-teal-600/50 hover:border-teal-600 hover:bg-teal-50/40 text-teal-700 flex flex-col items-center justify-center gap-1 transition-all shrink-0 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500/30">
                      <Camera className="w-4 h-4 stroke-[1.8]" />
                      <span className="text-[10px] font-medium leading-none">{t('addPhotos')}</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Description using Common TextArea with Voice Dictation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span>{t('descriptionLabel')}</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Button
                    type="button" variant={isVoiceActive ? 'danger' : 'secondary'} size="xs"
                    onClick={handleToggleVoice} icon={Mic} title={t('voice')}
                    className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer active:scale-95 ${
                      isVoiceActive ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{isVoiceActive ? t('voiceListening') : t('voice')}</span>
                  </Button>
                </div>
                <TextArea
                  value={values.description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting}
                  rows={3} placeholder={t('onTheGoDescriptionPlaceholder')} error={Boolean(errors.description)}
                  errorMessage={errors.description} showCharCount charCountLabel={t('charsCount')}
                  className="rounded-lg border-slate-300 bg-white p-2.5 sm:p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-500/20"
                />
              </div>

              {/* Smart Citizen Toggle using Common Checkbox */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="citizen-toggle"
                    checked={values.isCitizenReported}
                    onCheckedChange={(checked) => setIsCitizenReported(Boolean(checked))}
                    disabled={isSubmitting}
                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <label
                    htmlFor="citizen-toggle"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('reportedByCitizen')}</span>
                  </label>
                </div>

                {/* Citizen Details Drawer */}
                {values.isCitizenReported && (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{t('citizenMobileLabel')}</span>
                          <span className="text-red-500 font-bold">*</span>
                        </label>
                        <Input
                          naked={false} type="tel" maxLength={10} value={values.citizenMobile}
                          onChange={(e) => setAdditionalField('citizenMobile', e.target.value.replace(/\D/g, ''))}
                          disabled={isSubmitting} placeholder={t('mobilePlaceholder')} error={errors.citizenMobile}
                          className="rounded-lg border-slate-300 py-1.5 focus:border-emerald-600 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{t('fullName')}</span>
                        </label>
                        <Input
                          naked={false} type="text" value={values.citizenName}
                          onChange={(e) => setAdditionalField('citizenName', sanitizeCitizenName(e.target.value))}
                          disabled={isSubmitting} placeholder={t('citizenNamePlaceholder')} error={errors.citizenName}
                          className="rounded-lg border-slate-300 py-1.5 focus:border-emerald-600 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{t('citizenSmsNote')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cascading Assignment Selectors & Landmark */}
            <OnTheGoAssignmentSection
              zoneId={values.zoneId} wardNumber={values.wardNumber} departmentId={values.departmentId}
              grievanceTypeId={values.grievanceTypeId} categories={categories} onCategoryChange={setGrievanceTypeId}
              officerUserId={values.officerUserId} landmark={values.landmark} errors={errors}
              zones={zones} activeZone={activeZone} departments={departments} officers={officers}
              activeOfficer={activeOfficer} isSubmitting={isSubmitting}
              onZoneChange={setZoneId} onWardChange={setWardNumber}
              onDepartmentChange={setDepartmentId} onOfficerChange={setOfficerUserId}
              onLandmarkChange={(val) => setAdditionalField('landmark', val)}
            />
          </div>

          {/* Action Footer using Common Button */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
            <Button
              variant="secondary" onClick={saveDraft} disabled={isSubmitting} icon={isDraftSaved ? Check : undefined}
              className="w-full sm:w-auto px-5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className={isDraftSaved ? 'text-emerald-700' : ''}>{isDraftSaved ? t('draftSaved') : t('saveDraft')}</span>
            </Button>

            <Button
              variant="primary" onClick={submitForm} disabled={isSubmitting} isLoading={isSubmitting} icon={Send}
              className="w-full sm:w-auto sm:min-w-[200px] px-6 py-2 rounded-lg text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{isSubmitting ? t('submittingAndAssigning') : t('submitAndAssign')}</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <OnTheGoSuccessModal result={submissionResult} onReset={resetForm} onTrackGrievance={handleTrackGrievance} />
    </div>
  );
}
