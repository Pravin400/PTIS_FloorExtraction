'use client';

import { Tabs } from '@/components/common';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { WingFormFields } from './WingFormFields';
import { WingFormActions } from './WingFormActions';
import { useWingForm, UseWingFormProps } from '@/hooks/ptis/QuickDataEntry/Wing/useWingForm';

export default function WingForm(props: UseWingFormProps) {
  const {
    formRef,
    hasChanges,
    isUpdating,
    selectedWingDetailId,
    societyWings,
    currentWing,
    handleWingSelectChange,
    wingName,
    setWingName,
    managerName,
    setManagerName,
    managerNameEnglish,
    setManagerNameEnglish,
    managerMobileCountryCode,
    setManagerMobileCountryCode,
    managerMobileInput,
    managerEmailId,
    setManagerEmailId,
    secretaryName,
    setSecretaryName,
    secretaryNameEnglish,
    setSecretaryNameEnglish,
    secretaryMobileCountryCode,
    setSecretaryMobileCountryCode,
    secretaryMobileInput,
    secretaryEmailId,
    setSecretaryEmailId,
    showError,
    canSubmit,
    handleSubmit,
    checkFormChanges,
    setFocusedField,
  } = useWingForm(props);

  const t = useTranslations('quickDataEntry');

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={checkFormChanges} noValidate>
      <Tabs defaultValue="wing">
        <Tabs.TabPanel value="wing" className="mt-0 p-4 space-y-3">
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 p-4 space-y-4">
            <h3 className="text-sm font-bold text-purple-800 pb-2 border-b-2 border-purple-200">
              {t('wing.title')}
            </h3>

            {/* SELECT WING Section */}
            {societyWings && societyWings.length > 0 && (
              <div className="space-y-2 p-3 rounded-xl border bg-slate-50/60 border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t('building.selectWing') || 'SELECT WING'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {societyWings.map((wing) => {
                    const isSelected =
                      selectedWingDetailId === wing.id ||
                      (currentWing && currentWing.id === wing.id);
                    return (
                      <button
                        key={wing.id}
                        type="button"
                        onClick={() => handleWingSelectChange(undefined, String(wing.id))}
                        className={cn(
                          'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {wing.wingName || wing.wingNo || `Wing ${wing.wingId}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <WingFormFields
              t={t}
              wingName={wingName}
              setWingName={setWingName}
              managerName={managerName}
              setManagerName={setManagerName}
              managerNameEnglish={managerNameEnglish}
              setManagerNameEnglish={setManagerNameEnglish}
              managerMobileCountryCode={managerMobileCountryCode}
              setManagerMobileCountryCode={setManagerMobileCountryCode}
              managerMobileInput={managerMobileInput}
              managerEmailId={managerEmailId}
              setManagerEmailId={setManagerEmailId}
              secretaryName={secretaryName}
              setSecretaryName={setSecretaryName}
              secretaryNameEnglish={secretaryNameEnglish}
              setSecretaryNameEnglish={setSecretaryNameEnglish}
              secretaryMobileCountryCode={secretaryMobileCountryCode}
              setSecretaryMobileCountryCode={setSecretaryMobileCountryCode}
              secretaryMobileInput={secretaryMobileInput}
              secretaryEmailId={secretaryEmailId}
              setSecretaryEmailId={setSecretaryEmailId}
              showError={showError}
              onFocusField={setFocusedField}
              onBlurField={() => setFocusedField(null)}
            />

            <WingFormActions
              t={t}
              isUpdating={isUpdating}
              hasChanges={hasChanges}
              canSubmit={canSubmit()}
            />
          </div>
        </Tabs.TabPanel>
      </Tabs>
    </form>
  );
}
