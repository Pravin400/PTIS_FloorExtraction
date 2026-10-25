import { useTranslations } from 'next-intl';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/ActionButton';
import { CancelButton, PreviewButton } from '@/components/common/ActionButtons';
import { Info, Calendar as CalendarIcon, Play } from 'lucide-react';
import { DatePicker, TimePicker, Checkbox } from '@/components/common';
import { ScopeOptionItem } from '@/types/addTaxes.types';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ExecutionReviewModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  currentScopeData: ScopeOptionItem | undefined;
  eligibleCount: number | null;
  onStartExecution?: (isScheduled: boolean, scheduledDateTime?: string, forceRecalculate?: boolean) => void;
  onPreview?: () => void;
  isPreviewLoading?: boolean;
  financeYear?: string;
  selectedScope?: string;
}

export function ExecutionReviewModal({
  isModalOpen,
  setIsModalOpen,
  currentScopeData,
  eligibleCount,
  onStartExecution,
  onPreview,
  isPreviewLoading,
  financeYear,
  selectedScope
}: ExecutionReviewModalProps) {
  const t = useTranslations('addTaxes');
  const activeScope = selectedScope || currentScopeData?.scopeType;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [forceRecalculate, setForceRecalculate] = useState(false);

  // Get date options dynamically for today and tomorrow
  const getDates = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatVal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    };

    const formatLabel = (d: Date, label: string) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      return `${label} (${d.toLocaleDateString('en-US', options)})`;
    };

    return [
      { value: formatVal(today), label: formatLabel(today, 'Today') },
      { value: formatVal(tomorrow), label: formatLabel(tomorrow, 'Tomorrow') }
    ];
  };

  const getInitialDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const h = String(now.getHours()).padStart(2, '0');
    return `${h}:00`;
  };

  const dateOptions = getDates();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [selectedTime, setSelectedTime] = useState(getInitialDefaultTime());

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  const [selectedDateObj, setSelectedDateObj] = useState<Date>(tDate);

  // Reset scheduling state when the main modal opens using useEffect
  useEffect(() => {
    if (isModalOpen) {
      const dates = getDates();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(dates[0].value);
      setSelectedDateObj(tDate);
      setSelectedTime(getInitialDefaultTime());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    
    const isTodaySelected = selectedDateObj.getDate() === tDate.getDate() &&
                            selectedDateObj.getMonth() === tDate.getMonth() &&
                            selectedDateObj.getFullYear() === tDate.getFullYear();
    
    if (isTodaySelected) {
      const scheduledDateObj = new Date(`${selectedDate}T${time}`);
      if (scheduledDateObj <= new Date()) {
        toast.warning(t('messages.selectedTimeInPast'));
      }
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDateObj(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedDate(dateStr);

    const isTodaySelected = date.getDate() === tDate.getDate() &&
                            date.getMonth() === tDate.getMonth() &&
                            date.getFullYear() === tDate.getFullYear();

    if (isTodaySelected) {
      const scheduledDateObj = new Date(`${dateStr}T${selectedTime}`);
      if (scheduledDateObj <= new Date()) {
        const futureTime = getInitialDefaultTime();
        setSelectedTime(futureTime);
        toast.info(t('messages.timeReset', { time: futureTime }));
      }
    }
  };

  const handleScheduleSubmit = () => {
    if (!selectedTime) {
      toast.error(t('messages.selectTimeRequired'));
      return;
    }

    const scheduledDateObj = new Date(`${selectedDate}T${selectedTime}`);
    if (scheduledDateObj <= new Date()) {
      toast.error(t('messages.scheduledTimeInPast'));
      return;
    }

    if (onStartExecution) {
      onStartExecution(true, scheduledDateObj.toISOString(), forceRecalculate);
    }
    setShowScheduleModal(false);
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('executionValidation.reviewExecute')}
        subtitle={t('reviewModal.title')}
        maxWidth="lg"
        footer={
          <div className="flex gap-3 justify-between w-full">
            <CancelButton label={t('reviewModal.cancel')} onClick={() => setIsModalOpen(false)} />
            <div className="flex gap-3">
              <PreviewButton
                variant="secondary"
                onClick={onPreview}
                isLoading={isPreviewLoading}
                disabled={isPreviewLoading}
              />
              <Button
                variant="contained"
                icon={CalendarIcon}
                onClick={() => setShowScheduleModal(true)}
              >
                {t('reviewModal.scheduleExecutionButton')}
              </Button>
              <Button
                variant="primary"
                icon={Play}
                onClick={() => {
                  if (onStartExecution) {
                    onStartExecution(false, undefined, forceRecalculate);
                  }
                }}
              >
                {t('reviewModal.proceed')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <span className="text-gray-500 text-sm">{t('reviewModal.operation')}</span>
              <span className="font-semibold text-gray-900 text-sm">{t('reviewModal.action')}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <span className="text-gray-500 text-sm">{t('stats.financeYear')}</span>
              <span className="font-semibold text-gray-900 text-sm">{financeYear || '2026-2027'}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <span className="text-gray-500 text-sm">{t('executionValidation.tags.scope')}</span>
              <span className="font-semibold text-gray-900 text-sm">{currentScopeData?.displayName || (activeScope === 'masterDataChange' ? 'Master Change Batch' : '')}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-gray-500 text-sm">{t('stats.eligibleRecords')}</span>
              <span className="font-bold text-blue-600 text-lg">{eligibleCount}</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={forceRecalculate}
                onCheckedChange={setForceRecalculate}
              />
              <span className="text-sm font-medium text-gray-900">{t('reviewModal.forceRecalculate')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">{t('reviewModal.forceRecalculateHint')}</p>
          {activeScope === 'masterDataChange' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2 font-medium flex items-center gap-1.5">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>{t('reviewModal.masterDataNotice', { financeYear: financeYear || '2026-2027' })}</span>
            </p>
          )}
          </div>

          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 mt-2">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <span className="font-semibold">{t('reviewModal.warningPrefix')} {t('reviewModal.action')} {t('reviewModal.warningSuffix', { count: eligibleCount || 0 })}.</span>
                <br />
                {t('reviewModal.backgroundNotice')}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Schedule Execution Dialog */}
      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={t('schedule.title')}
        subtitle={t('schedule.subtitle')}
        maxWidth="2xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <CancelButton label={t('schedule.back')} onClick={() => setShowScheduleModal(false)} />
            <Button
              variant="primary"
              icon={CalendarIcon}
              onClick={handleScheduleSubmit}
            >
              {t('schedule.submit')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('schedule.selectDate')}</label>
            <div className="flex justify-center">
              <DatePicker
                selected={selectedDateObj}
                onChange={handleDateChange}
                minDate={tDate}
                maxDate={tomDate}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('schedule.selectTime')}</label>
            <div className="flex justify-center">
              <TimePicker
                value={selectedTime}
                onChange={handleTimeChange}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
