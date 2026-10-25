'use client';

import { Activity } from 'lucide-react';
import { Label } from '@/components/common/label';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';

interface ModuleStatusToggleProps {
  isActive: boolean;
  onChange: (checked: boolean) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function ModuleStatusToggle({ isActive, onChange, t, tCommon }: ModuleStatusToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-500" />
        <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          {t('drawer.labels.status')}
        </Label>
      </div>
      <div className="flex flex-col items-end gap-1">
        <ToggleSwitch
          id="isActive"
          checked={isActive}
          showPopup={false}
          onChange={onChange}
          activeLabel={tCommon('status.active')}
          inactiveLabel={tCommon('status.inactive')}
        />
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isActive ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          {isActive ? tCommon('status.active') : tCommon('status.inactive')}
        </span>
      </div>
    </div>
  );
}
