/* eslint-disable i18next/no-literal-string */
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TimePickerProps {
  /** Value format: 'HH:mm' in 24-hour style (e.g., "14:30") */
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = '12:00',
  onChange,
  className
}) => {
  const [activeMode, setActiveMode] = React.useState<'hours' | 'minutes'>('hours');

  // Parse initial 24h format to 12h format details
  const getParsedTime = (val24: string) => {
    const parts = val24.split(':');
    const h = parts[0] ? parseInt(parts[0], 10) : 12;
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;

    return { h12, m, period };
  };

  const initialTime = getParsedTime(value);
  const [selectedHour, setSelectedHour] = React.useState<number>(initialTime.h12);
  const [selectedMin, setSelectedMin] = React.useState<number>(initialTime.m);
  const [period, setPeriod] = React.useState<'AM' | 'PM'>(initialTime.period);

  // Sync internal state when prop changes
  React.useEffect(() => {
    const parsed = getParsedTime(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedHour(parsed.h12);
    setSelectedMin(parsed.m);
    setPeriod(parsed.period);
  }, [value]);

  const triggerChange = (h12: number, min: number, ap: 'AM' | 'PM') => {
    let h24 = h12 % 12;
    if (ap === 'PM') {
      h24 += 12;
    }
    const hh = String(h24).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    if (onChange) {
      onChange(`${hh}:${mm}`);
    }
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    triggerChange(h, selectedMin, period);
    // Switch to minutes mode automatically
    setActiveMode('minutes');
  };

  const handleMinSelect = (m: number) => {
    setSelectedMin(m);
    triggerChange(selectedHour, m, period);
  };

  const togglePeriod = (p: 'AM' | 'PM') => {
    setPeriod(p);
    triggerChange(selectedHour, selectedMin, p);
  };

  // Clock positioning helpers
  const getClockNumberPosition = (idx: number) => {
    // idx is from 0 to 11. Angle starts at 0 degrees for 12 o'clock, then 30 deg per step.
    const angle = (idx * 30 * Math.PI) / 180;
    const radius = 38; // percentage radius
    const x = 50 + radius * Math.sin(angle);
    const y = 50 - radius * Math.cos(angle);
    return { left: `${x}%`, top: `${y}%` };
  };

  const getHandRotation = () => {
    if (activeMode === 'hours') {
      return (selectedHour % 12) * 30; // 360 / 12 = 30 deg per hour
    } else {
      return selectedMin * 6; // 360 / 60 = 6 deg per minute
    }
  };

  // Clock items depending on mode
  const clockNumbers = activeMode === 'hours'
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const isHighlighted = (num: number) => {
    if (activeMode === 'hours') {
      return num === selectedHour;
    } else {
      return selectedMin === num;
    }
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-[480px] select-none', className)}>
      {/* Left Panel: Large Digital View */}
      <div className="flex flex-col items-center sm:items-start min-w-[120px]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Time
        </span>
        <div className="flex items-baseline text-slate-800 font-bold mb-4">
          <button
            type="button"
            onClick={() => setActiveMode('hours')}
            className={cn(
              'text-5xl transition',
              activeMode === 'hours' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {String(selectedHour).padStart(2, '0')}
          </button>
          <span className="text-4xl text-slate-300 mx-1">:</span>
          <button
            type="button"
            onClick={() => setActiveMode('minutes')}
            className={cn(
              'text-5xl transition',
              activeMode === 'minutes' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {String(selectedMin).padStart(2, '0')}
          </button>
        </div>

        {/* AM/PM toggle */}
        <div className="flex border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50 p-0.5">
          <button
            type="button"
            onClick={() => togglePeriod('AM')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition',
              period === 'AM'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => togglePeriod('PM')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition',
              period === 'PM'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Right Panel: Dial face */}
      <div className="relative flex flex-col items-center">
        {/* Dial Mode Switch Arrow Controls */}
        <div className="absolute -top-3 right-0 flex gap-2 z-10">
          <button
            type="button"
            onClick={() => setActiveMode(activeMode === 'hours' ? 'minutes' : 'hours')}
            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md transition border border-slate-100 bg-white"
          >
            {activeMode === 'hours' ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Circular Clock Face */}
        <div className="relative size-44 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mt-2 shadow-inner">
          {/* Hand Indicator */}
          <div
            className="absolute bottom-1/2 left-1/2 w-0.5 bg-indigo-600 origin-bottom transition-all duration-300 ease-out"
            style={{
              height: '38%',
              transform: `translateX(-50%) rotate(${getHandRotation()}deg)`,
            }}
          >
            {/* Clock Hand Pointer End Circle */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center">
              <div className="size-1 rounded-full bg-white" />
            </div>
          </div>

          {/* Center Point */}
          <div className="absolute size-2 rounded-full bg-indigo-600 border border-white z-10 shadow-sm" />

          {/* Numbers positioned circular grid */}
          {clockNumbers.map((num, idx) => {
            const pos = getClockNumberPosition(idx);
            const isSel = isHighlighted(num);
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (activeMode === 'hours') {
                    handleHourSelect(num);
                  } else {
                    handleMinSelect(num);
                  }
                }}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center text-xs font-semibold transition',
                  isSel
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                )}
                style={{ left: pos.left, top: pos.top }}
              >
                {activeMode === 'hours' ? num : String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
