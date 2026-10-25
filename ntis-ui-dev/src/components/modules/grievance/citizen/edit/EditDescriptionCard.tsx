'use client';

/**
 * Edit Description Card (Presentation Component)
 * Path: src/components/modules/grievance/citizen/edit/EditDescriptionCard.tsx
 * Line ceiling: <= 300 lines.
 */

import { FileText, Mic, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, TextArea } from '@/components/common';

interface EditDescriptionCardProps {
  description: string;
  setDescription: (val: string) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  error?: string;
  onClearError?: () => void;
}

export function EditDescriptionCard({
  description,
  setDescription,
  isVoiceActive,
  onToggleVoice,
  error,
  onClearError,
}: EditDescriptionCardProps) {
  const t = useTranslations('grievance');

  return (
    <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-1.5 truncate">
          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{t('grievanceDescription')}</span>
          <span className="text-red-500">*</span>
        </label>
      </div>

      <div className="relative">
        <TextArea
          rows={2}
          maxLength={1000}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) onClearError?.();
          }}
          placeholder={t('descriptionPlaceholder')}
          className={`text-xs bg-white rounded-xl p-2.5 pb-8 text-slate-800 resize-none w-full transition-colors ${
            error ? 'border-red-500 ring-1 ring-red-400/30' : 'border-slate-200'
          }`}
        />

        {/* Floating Voice Dictation Button in bottom right */}
        <div className="absolute right-2.5 bottom-2.5 z-10">
          <Button
            type="button"
            variant={isVoiceActive ? 'danger' : 'secondary'}
            size="xs"
            onClick={onToggleVoice}
            icon={Mic}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 shadow-2xs ${
              isVoiceActive
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isVoiceActive ? t('voiceListening') : t('voice')}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium px-0.5">
        <span>
          {error ? (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {error}
            </span>
          ) : null}
        </span>
        <span className={description.length >= 950 ? 'text-amber-600 font-bold' : ''}>
          {description.length}/1000
        </span>
      </div>
    </div>
  );
}
